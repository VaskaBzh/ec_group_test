import { z } from 'zod';

/**
 * Schema describing every environment variable the backend depends on.
 *
 * Serves as the single source of truth for runtime configuration: values are
 * coerced and validated once at startup so the rest of the application can
 * consume a fully-typed, guaranteed-present config via `ConfigService`.
 */
export const envSchema = z.object({
  /** PostgreSQL connection string consumed by Prisma. */
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection URL' }),

  /** HTTP port the application listens on. */
  PORT: z.coerce.number().int().positive().default(3000),

  /** Logging verbosity threshold (DEBUG | INFO | WARN | ERROR and synonyms). */
  LOG_LEVEL: z.string().default('DEBUG'),

  /** Secret used to sign and verify JWT access tokens. */
  JWT_SECRET: z
    .string()
    .min(16, { message: 'JWT_SECRET must be at least 16 characters long' }),

  /** Access-token lifetime accepted by `@nestjs/jwt` (e.g. `15m`, `900s`). */
  JWT_ACCESS_TTL: z.string().default('15m'),

  /**
   * Refresh-token lifetime (e.g. `7d`, `12h`). Parsed into an absolute expiry
   * when a refresh token is issued and stored alongside its hash.
   */
  JWT_REFRESH_TTL: z.string().default('7d'),

  /**
   * Allowed CORS origins. `*` allows any origin; a comma-separated list
   * restricts access to the given origins.
   */
  CORS_ORIGIN: z.string().default('*'),
});

/** Fully-resolved, validated environment configuration. */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate raw environment variables against {@link envSchema}.
 *
 * Passed to `ConfigModule.forRoot({ validate })` so the process fails fast with
 * a descriptive error when a required variable is missing or malformed, instead
 * of surfacing a confusing failure deep inside a request handler later.
 *
 * @param rawEnvironment - Raw `process.env`-shaped object.
 * @returns The parsed, typed configuration.
 * @throws {z.ZodError} When validation fails.
 */
export function validateEnv(rawEnvironment: Record<string, unknown>): Env {
  return envSchema.parse(rawEnvironment);
}
