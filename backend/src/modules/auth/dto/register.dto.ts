import { createZodDto } from 'nestjs-zod';
import { RegisterInputSchema } from '@ec-group/contracts';

/**
 * Registration request body.
 *
 * Backed by the shared `RegisterInputSchema` so the global `ZodValidationPipe`
 * validates and types the payload from a single source of truth.
 */
export class RegisterDto extends createZodDto(RegisterInputSchema) {}
