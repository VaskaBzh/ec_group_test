import { createZodDto } from 'nestjs-zod';
import { RefreshInputSchema } from '@ec-group/contracts';

/**
 * Refresh/logout request body.
 *
 * Backed by the shared `RefreshInputSchema` and validated by the global
 * `ZodValidationPipe`. Reused by both `POST /auth/refresh` and
 * `POST /auth/logout`, which take the same `{ refreshToken }` shape.
 */
export class RefreshDto extends createZodDto(RefreshInputSchema) {}
