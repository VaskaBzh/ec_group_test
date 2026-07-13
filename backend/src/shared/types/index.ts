/**
 * Shared runtime types and cross-cutting enums.
 *
 * Re-exports the role and status enums from the contracts package so the whole
 * backend references a single source of truth, alongside backend-only auth
 * types (`AuthenticatedUser`, `JwtPayload`).
 */
export { UserRoleSchema, RequestStatusSchema } from '@ec-group/contracts';
export type { UserRole, RequestStatus } from '@ec-group/contracts';

export type { AuthenticatedUser } from './authenticated-user';
export type { JwtPayload } from './jwt-payload';
