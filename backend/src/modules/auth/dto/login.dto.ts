import { createZodDto } from 'nestjs-zod';
import { LoginInputSchema } from '@ec-group/contracts';

/**
 * Login request body.
 *
 * Backed by the shared `LoginInputSchema` and validated by the global
 * `ZodValidationPipe`.
 */
export class LoginDto extends createZodDto(LoginInputSchema) {}
