import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Inject the authenticated user attached to the request by the JWT strategy.
 *
 * Must be used on routes protected by `JwtAuthGuard`; without a preceding
 * authentication step the value is `undefined`.
 *
 * @example
 * ```ts
 * @Post()
 * create(@CurrentUser() user: AuthenticatedUser) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    return request.user as AuthenticatedUser;
  },
);
