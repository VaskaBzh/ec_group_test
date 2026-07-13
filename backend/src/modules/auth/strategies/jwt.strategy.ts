import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '../../../shared/config/env.validation';
import type { AuthenticatedUser, JwtPayload } from '../../../shared/types';

/**
 * Passport JWT strategy backing {@link JwtAuthGuard}.
 *
 * Extracts a bearer token from the `Authorization` header, verifies its
 * signature against `JWT_SECRET` and rejects expired tokens
 * (`ignoreExpiration: false`). The decoded payload is projected onto the
 * {@link AuthenticatedUser} attached to `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', { infer: true }),
    });
  }

  /**
   * Map verified token claims to the authenticated principal.
   *
   * Passport stores the return value on `request.user`.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
