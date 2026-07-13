import type { UserRole } from '@ec-group/contracts';

/**
 * Claims embedded in a signed JWT access token.
 *
 * `sub` follows the JWT convention of carrying the subject (user id). The role
 * is included so guards can authorize a request without an extra database read.
 */
export interface JwtPayload {
  /** Subject — the authenticated user's id. */
  sub: string;
  /** User email, mirrored for convenience. */
  email: string;
  /** Role used for role-based access control. */
  role: UserRole;
}
