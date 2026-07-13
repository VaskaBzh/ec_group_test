import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Guard that enforces a valid JWT access token on protected routes.
 *
 * Delegates to the Passport `jwt` strategy: it extracts the bearer token,
 * verifies the signature and expiry, and attaches the resolved
 * {@link AuthenticatedUser} to `request.user`. A missing, malformed or expired
 * token results in a `401 Unauthorized`, which the global exception filter
 * renders in the unified error format. Every rejection is logged at `WARN` with
 * the request path and a coarse reason so expired-token traffic is observable.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  /**
   * Convert a failed authentication into a logged `401`.
   *
   * Passport passes the strategy error/`info` here; on any failure we log the
   * reason and throw a uniform {@link UnauthorizedException} rather than leaking
   * the underlying error.
   */
  handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (error || !user) {
      const request = context.switchToHttp().getRequest<Request>();
      const reason = this.resolveReason(error, info);
      this.logger.warn(
        `[JwtAuthGuard] rejected ${request.method} ${request.url} reason=${reason}`,
      );
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return user;
  }

  /** Derive a short, log-safe reason phrase from the strategy error/info. */
  private resolveReason(error: unknown, info: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (info instanceof Error) {
      return info.name === 'TokenExpiredError' ? 'token expired' : info.message;
    }
    return 'no token';
  }
}
