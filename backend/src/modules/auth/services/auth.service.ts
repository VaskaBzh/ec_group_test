import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import type {
  AuthTokensDto,
  LoginInput,
  RegisterInput,
  UserDto,
} from '@ec-group/contracts';
import type { User } from '@prisma/client';
import { UsersService } from '../../users/services/users.service';
import { toUserDto } from '../../users/mappers/user.mapper';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { parseDurationToMilliseconds } from '../../../shared/config/duration';
import type { Env } from '../../../shared/config/env.validation';
import type { JwtPayload } from '../../../shared/types';

/** Combined authentication response: issued tokens plus the public user. */
export interface AuthResponse extends AuthTokensDto {
  /** Public representation of the authenticated user. */
  user: UserDto;
}

/** Cost factor for bcrypt password hashing. */
const BCRYPT_SALT_ROUNDS = 12;

/** Number of random bytes backing an opaque refresh token before encoding. */
const REFRESH_TOKEN_BYTE_LENGTH = 48;

/**
 * Orchestrates registration, login and the refresh-token session lifecycle.
 *
 * Hashes passwords with bcrypt, verifies credentials and issues a short-lived
 * signed JWT access token paired with a long-lived opaque refresh token. Only
 * the SHA-256 hash of each refresh token is persisted. Refresh rotates the pair
 * and revokes the old token; reuse of an already-revoked token is treated as a
 * breach and terminates every session of the owner. Never logs raw passwords,
 * hashes or token values.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  /**
   * Register a new account and immediately authenticate it.
   *
   * @param input - Validated registration payload (email, strong password, role).
   * @returns Access/refresh token bundle and the created user.
   * @throws {ConflictException} When the email is already registered.
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    this.logger.log(`[AuthService.register] email=${input.email}`);

    const existingUser = await this.usersService.findByEmail(input.email);
    if (existingUser) {
      this.logger.warn(
        `[AuthService.register] email already registered email=${input.email}`,
      );
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    this.logger.debug('[AuthService.register] password hashed');

    const user = await this.usersService.create({
      email: input.email,
      passwordHash,
      role: input.role,
    });
    this.logger.log(`[AuthService.register] success user=${user.id}`);

    return this.buildAuthResponse(user);
  }

  /**
   * Authenticate an existing account by email and password.
   *
   * Returns a deliberately generic error for both unknown emails and wrong
   * passwords so the endpoint does not reveal which accounts exist.
   *
   * @param input - Validated login payload.
   * @returns Access/refresh token bundle and the authenticated user.
   * @throws {UnauthorizedException} When credentials do not match.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    this.logger.debug(`[AuthService.login] email=${input.email}`);

    const user = await this.usersService.findByEmail(input.email);
    if (!user) {
      this.logger.warn(`[AuthService.login] fail: unknown email=${input.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`[AuthService.login] fail: wrong password user=${user.id}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`[AuthService.login] success user=${user.id}`);
    return this.buildAuthResponse(user);
  }

  /**
   * Exchange a valid refresh token for a fresh token pair (rotation).
   *
   * The presented token is revoked and a new access/refresh pair is issued. A
   * token that is unknown or expired yields a generic `401`. Reuse of an
   * already-revoked token signals theft: every session of the owner is revoked
   * and the request is rejected.
   *
   * @param refreshToken - The opaque refresh token presented by the client.
   * @returns A new token bundle and the authenticated user.
   * @throws {UnauthorizedException} When the token is invalid, expired, revoked
   *   or its owner no longer exists.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const validToken = await this.refreshTokenRepository.findValidByHash(tokenHash);

    if (!validToken) {
      return this.rejectInvalidRefresh(tokenHash);
    }

    const user = await this.usersService.findById(validToken.userId);
    if (!user) {
      this.logger.warn(
        `[AuthService.refresh] owner missing user=${validToken.userId}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenRepository.revoke(validToken.id);
    const response = await this.buildAuthResponse(user);
    this.logger.log(`[AuthService.refresh] user=${user.id} rotated`);
    return response;
  }

  /**
   * Invalidate the refresh token of a single session (logout).
   *
   * Idempotent: unknown or already-revoked tokens are ignored so logout never
   * leaks whether a token existed.
   *
   * @param refreshToken - The opaque refresh token of the session to end.
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const existing = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!existing) {
      this.logger.warn('[AuthService.logout] unknown refresh token ignored');
      return;
    }

    await this.refreshTokenRepository.revoke(existing.id);
    this.logger.log(`[AuthService.logout] user=${existing.userId} revoked`);
  }

  /**
   * Revoke every active session of a user (logout from all devices).
   *
   * @param userId - Owner whose sessions should all be terminated.
   */
  async logoutAll(userId: string): Promise<void> {
    const revokedCount = await this.refreshTokenRepository.revokeAllForUser(userId);
    this.logger.log(
      `[AuthService.logoutAll] user=${userId} revoked=${revokedCount}`,
    );
  }

  /**
   * Reject an invalid refresh attempt, escalating on reuse of a revoked token.
   *
   * @param tokenHash - Hash of the presented (non-valid) token.
   * @throws {UnauthorizedException} Always — either a plain invalid token or a
   *   detected reuse after mass-revoking the owner's sessions.
   */
  private async rejectInvalidRefresh(tokenHash: string): Promise<never> {
    const existing = await this.refreshTokenRepository.findByHash(tokenHash);

    if (existing?.revokedAt) {
      this.logger.error(
        `[AuthService.refresh] reuse of revoked token detected user=${existing.userId}; revoking all sessions`,
      );
      await this.refreshTokenRepository.revokeAllForUser(existing.userId);
    } else {
      this.logger.warn('[AuthService.refresh] invalid or expired refresh token');
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  /** Issue an access/refresh pair for the user and assemble the public response. */
  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const tokens = await this.issueTokens(user);
    return {
      ...tokens,
      user: toUserDto(user),
    };
  }

  /**
   * Sign a fresh access token and mint + persist a new refresh token.
   *
   * @param user - The authenticated user the tokens are issued for.
   * @returns The token bundle with both expiry instants.
   */
  private async issueTokens(user: User): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const accessTtl = this.configService.get('JWT_ACCESS_TTL', { infer: true });
    const refreshTtl = this.configService.get('JWT_REFRESH_TTL', { infer: true });
    const now = Date.now();
    const accessTokenExpiresAt = new Date(now + parseDurationToMilliseconds(accessTtl));
    const refreshTokenExpiresAt = new Date(now + parseDurationToMilliseconds(refreshTtl));

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTE_LENGTH).toString('base64url');
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });

    this.logger.debug(
      `[AuthService] issued tokens user=${user.id} accessExpiresAt=${accessTokenExpiresAt.toISOString()} refreshExpiresAt=${refreshTokenExpiresAt.toISOString()}`,
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
    };
  }

  /**
   * Hash an opaque refresh token for storage and lookup.
   *
   * SHA-256 is deterministic, so the hash doubles as the unique key the token is
   * looked up by — unlike a salted password hash, which could not be queried.
   */
  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
