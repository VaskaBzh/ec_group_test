import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@ec-group/contracts';

/** Metadata key under which required roles are stored for `RolesGuard`. */
export const ROLES_METADATA_KEY = 'roles';

/**
 * Restrict a route handler (or controller) to the given roles.
 *
 * Attaches the allowed roles as route metadata; `RolesGuard` reads it and
 * rejects requests whose authenticated user does not hold one of these roles.
 *
 * @param roles - Roles allowed to access the decorated handler.
 *
 * @example
 * ```ts
 * @Roles('Reviewer')
 * @Get()
 * list() { ... }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);
