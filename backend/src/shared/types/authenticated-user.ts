import type { UserRole } from '@ec-group/contracts';

/**
 * Authenticated principal attached to a request after a valid JWT is verified.
 *
 * Produced by the Passport JWT strategy and consumed by guards, the
 * `@CurrentUser` decorator and services. Contains only non-sensitive identity
 * fields — never the password hash.
 */
export interface AuthenticatedUser {
  /** Unique user id (matches the `sub` claim of the token). */
  id: string;
  /** User email. */
  email: string;
  /** Role driving role-based access control. */
  role: UserRole;
}
