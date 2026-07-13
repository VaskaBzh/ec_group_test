import { z } from 'zod';

/** Maximum length allowed for a purchase request title. */
export const REQUEST_TITLE_MAXIMUM_LENGTH = 200;

/** Maximum length allowed for an optional purchase request comment. */
export const REQUEST_COMMENT_MAXIMUM_LENGTH = 2000;

/**
 * Payload for creating a purchase request.
 *
 * - `title` — human-readable name of the item being requested.
 * - `quantity` — how many units are requested; must be a positive integer.
 * - `amount` — monetary value of the request; must be a positive number.
 * - `comment` — optional free-form note; omitted or empty means "no comment".
 */
export const CreateRequestInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(REQUEST_TITLE_MAXIMUM_LENGTH, {
      message: `Title must be at most ${REQUEST_TITLE_MAXIMUM_LENGTH} characters long`,
    }),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int({ message: 'Quantity must be a whole number' })
    .positive({ message: 'Quantity must be greater than 0' }),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be greater than 0' }),
  comment: z
    .string()
    .trim()
    .max(REQUEST_COMMENT_MAXIMUM_LENGTH, {
      message: `Comment must be at most ${REQUEST_COMMENT_MAXIMUM_LENGTH} characters long`,
    })
    .optional(),
});

/** Purchase request creation payload, inferred from {@link CreateRequestInputSchema}. */
export type CreateRequestInput = z.infer<typeof CreateRequestInputSchema>;
