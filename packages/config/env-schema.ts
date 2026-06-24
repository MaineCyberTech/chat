import { z } from "zod";

/**
 * Base environment schema shared across all API applications.
 * Extend this in each app's env.ts for app-specific variables.
 */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  PORT: z.coerce.number().default(4000),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_TLS: z.coerce.boolean().default(false),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // File uploads
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  UPLOAD_TTL_SECONDS: z.coerce.number().default(3600),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

/**
 * Validates and parses environment variables using the base schema.
 * App-specific schemas should extend this.
 */
export function validateBaseEnv(env: Record<string, string | undefined>): BaseEnv {
  return baseEnvSchema.parse(env);
}

/**
 * Loads and validates environment variables from process.env.
 * Exits process on validation failure.
 */
export function loadEnv(): BaseEnv {
  return validateBaseEnv(process.env);
}
