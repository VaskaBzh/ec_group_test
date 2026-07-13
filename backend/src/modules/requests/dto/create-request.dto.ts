import { createZodDto } from 'nestjs-zod';
import { CreateRequestInputSchema } from '@ec-group/contracts';

/**
 * Purchase request creation body.
 *
 * Backed by the shared `CreateRequestInputSchema` and validated by the global
 * `ZodValidationPipe`.
 */
export class CreateRequestDto extends createZodDto(CreateRequestInputSchema) {}
