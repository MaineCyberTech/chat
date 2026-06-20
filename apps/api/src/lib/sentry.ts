import * as Sentry from "@sentry/node";
import { loadEnv } from "../config/env.js";

export function initSentry() {
  const env = loadEnv();
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 0.0,
  });
}
