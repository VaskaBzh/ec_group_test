import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that enforces a valid JWT access token on protected routes.
 *
 * Delegates to the Passport `jwt` strategy: it extracts the bearer token,
 * verifies the signature and expiry, and attaches the resolved
 * {@link AuthenticatedUser} to `request.user`. A missing or invalid token
 * results in a `401 Unauthorized`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
