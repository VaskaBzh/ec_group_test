import { z } from 'zod';
import { UserRoleSchema } from './enums';

/**
 * Minimum number of characters required for a user password.
 *
 * Shared as a named constant so the backend, the frontend and any test can
 * reference the same threshold instead of hardcoding it.
 */
export const PASSWORD_MINIMUM_LENGTH = 8;

/**
 * Password field with strength requirements.
 *
 * Enforces a minimum length plus at least one lowercase letter, one uppercase
 * letter and one digit. Kept as a standalone schema so both registration and
 * any future password-change flow validate passwords identically.
 */
const passwordSchema = z
  .string()
  .min(PASSWORD_MINIMUM_LENGTH, {
    message: `Password must be at least ${PASSWORD_MINIMUM_LENGTH} characters long`,
  })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one digit' });

/**
 * Payload for registering a new user account.
 *
 * `role` selects whether the account can create requests (`Requester`) or
 * review them (`Reviewer`).
 */
export const RegisterInputSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'A valid email is required' }),
  password: passwordSchema,
  role: UserRoleSchema,
});

/** Registration payload, inferred from {@link RegisterInputSchema}. */
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

/**
 * Payload for authenticating an existing user.
 *
 * The password is only checked for presence here — credential correctness is
 * verified against the stored hash on the backend, never in the contract.
 */
export const LoginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'A valid email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

/** Login payload, inferred from {@link LoginInputSchema}. */
export type LoginInput = z.infer<typeof LoginInputSchema>;

/**
 * Payload for exchanging a refresh token for a fresh token pair.
 *
 * Carries the opaque refresh token issued at login/registration or by a
 * previous refresh. The same shape is reused by the logout endpoint to identify
 * the session being invalidated.
 */
export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1, { message: 'A refresh token is required' }),
});

/** Refresh/logout payload, inferred from {@link RefreshInputSchema}. */
export type RefreshInput = z.infer<typeof RefreshInputSchema>;
