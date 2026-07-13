import { Injectable, Logger } from '@nestjs/common';
import type { RefreshToken } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/** Data required to persist a newly issued refresh token. */
export interface CreateRefreshTokenData {
  /** Owner of the token. */
  userId: string;
  /** SHA-256 hash of the opaque token value (the raw value is never stored). */
  tokenHash: string;
  /** Absolute expiry instant of the token. */
  expiresAt: Date;
}

/**
 * Data-access layer for the `RefreshToken` model.
 *
 * Encapsulates every Prisma query touching refresh tokens. Persists only the
 * token hash; the raw token exists solely in the client's possession. Revocation
 * is a soft update (`revokedAt`) so rows survive to detect reuse of an already
 * rotated or logged-out token.
 */
@Injectable()
export class RefreshTokenRepository {
  private readonly logger = new Logger(RefreshTokenRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a new refresh token.
   *
   * @param data - Owner id, token hash and expiry instant.
   * @returns The created refresh-token row.
   */
  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    this.logger.debug(
      `[RefreshTokenRepository.create] user=${data.userId} expiresAt=${data.expiresAt.toISOString()}`,
    );
    const refreshToken = await this.prisma.refreshToken.create({ data });
    this.logger.debug(`[RefreshTokenRepository.create] created id=${refreshToken.id}`);
    return refreshToken;
  }

  /**
   * Find a refresh token by its hash regardless of state.
   *
   * Returns revoked and expired rows too, so callers can distinguish an unknown
   * token from a reused (already revoked) one.
   *
   * @returns The row, or `null` when no token has that hash.
   */
  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    this.logger.debug('[RefreshTokenRepository.findByHash] lookup by hash');
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  /**
   * Find a currently valid (not revoked, not expired) refresh token by hash.
   *
   * @param tokenHash - SHA-256 hash of the presented token.
   * @param now - Reference instant used for the expiry check (defaults to now).
   * @returns The valid row, or `null` when none matches.
   */
  async findValidByHash(tokenHash: string, now: Date = new Date()): Promise<RefreshToken | null> {
    this.logger.debug('[RefreshTokenRepository.findValidByHash] lookup by hash');
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });
    this.logger.debug(
      `[RefreshTokenRepository.findValidByHash] valid=${refreshToken !== null}`,
    );
    return refreshToken;
  }

  /**
   * Revoke a single refresh token by id (idempotent).
   *
   * Only flips tokens that are still active, so an already-revoked token keeps
   * its original `revokedAt` timestamp.
   *
   * @param id - Refresh-token id to revoke.
   */
  async revoke(id: string): Promise<void> {
    this.logger.debug(`[RefreshTokenRepository.revoke] id=${id}`);
    await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke every active refresh token of a user.
   *
   * Used on logout-all and as a breach response when a revoked token is reused.
   *
   * @param userId - Owner whose sessions should be terminated.
   * @returns The number of tokens revoked.
   */
  async revokeAllForUser(userId: string): Promise<number> {
    this.logger.debug(`[RefreshTokenRepository.revokeAllForUser] user=${userId}`);
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.logger.debug(
      `[RefreshTokenRepository.revokeAllForUser] revoked=${result.count} user=${userId}`,
    );
    return result.count;
  }
}
