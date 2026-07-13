import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type {
  AuthTokensDto,
  LoginInput,
  RegisterInput,
  UserDto,
} from '@ec-group/contracts';
import type { User } from '@prisma/client';
import { UsersService } from '../../users/services/users.service';
import { toUserDto } from '../../users/mappers/user.mapper';
import type { JwtPayload } from '../../../shared/types';

/** Combined authentication response: issued tokens plus the public user. */
export interface AuthResponse extends AuthTokensDto {
  /** Public representation of the authenticated user. */
  user: UserDto;
}

/** Cost factor for bcrypt password hashing. */
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Orchestrates registration and login.
 *
 * Hashes passwords with bcrypt, verifies credentials and issues signed JWT
 * access tokens. Never logs raw passwords or hashes. Returns a public
 * {@link UserDto} alongside the tokens so the client can render the session
 * without an extra request.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new account and immediately authenticate it.
   *
   * @param input - Validated registration payload (email, strong password, role).
   * @returns Access token bundle and the created user.
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
   * @returns Access token bundle and the authenticated user.
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

  /** Sign an access token for the user and assemble the public response. */
  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    this.logger.debug(`[AuthService] issued access token user=${user.id}`);

    return {
      accessToken,
      user: toUserDto(user),
    };
  }
}
