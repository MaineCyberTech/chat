import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  SENTRY_DSN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  SHOW_STACK_TRACES: z.enum(["true", "false"]).default("false"),
  WEBHOOK_ENCRYPTION_KEY: z.string().min(32).optional(),
});

export type Env = z.infer<typeof envSchema>;

function isSecretKey(key: string): boolean {
  return /secret|key|pass|token/i.test(key);
}

export function logEnvStatus(env: Env): void {
  // Use dynamic import to avoid circular dependency
  const logger = { info: (...args: unknown[]) => console.log(...args) };
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const l = require("../lib/logger.js");
    logger.info = l.logger.info.bind(l.logger);
  } catch {
    // Fallback to console if logger not yet available
  }

  const defined: string[] = [];
  const missing: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (isSecretKey(key)) {
      // Skip logging secret values
      continue;
    }
    if (value === undefined || value === null || value === "") {
      missing.push(key);
    } else {
      defined.push(key);
    }
  }

  logger.info("Environment configuration", {
    defined: defined.join(", "),
    missing: missing.length > 0 ? missing.join(", ") : "(none)",
  });
}

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const msg = "Invalid environment configuration: " + JSON.stringify(result.error.flatten());
    throw new Error(msg);
  }
  return result.data;
}
