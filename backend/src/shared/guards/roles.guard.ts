import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@ec-group/contracts';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Guard enforcing role-based access declared via the `@Roles` decorator.
 *
 * Runs after `JwtAuthGuard`, so `request.user` is expected to be populated.
 * Handlers without `@Roles` metadata are allowed through unchanged. A request
 * whose user lacks a required role is rejected with `403 Forbidden`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  /**
   * Allow the request when no roles are required or the user holds one of them.
   *
   * @throws {ForbiddenException} When authentication is missing or the role is
   * insufficient.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      this.logger.warn('[RolesGuard] no authenticated user on request → deny');
      throw new ForbiddenException('Authentication required');
    }

    const isAllowed = requiredRoles.includes(user.role);
    this.logger.debug(
      `[RolesGuard] user=${user.id} role=${user.role} required=${requiredRoles.join(',')} → ${isAllowed ? 'allow' : 'deny'}`,
    );

    if (!isAllowed) {
      this.logger.warn(
        `[RolesGuard] user=${user.id} role=${user.role} required=${requiredRoles.join(',')} → deny`,
      );
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
