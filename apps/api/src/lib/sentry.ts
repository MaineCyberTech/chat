import * as Sentry from "@sentry/node";
import { loadEnv } from "../config/env.js";

export function initSentry() {
  const env = loadEnv();
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    profilesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0.0,
    integrations: [Sentry.expressIntegration()],
  });

  Sentry.addEventProcessor((event) => {
    if (event.type === "transaction") {
      event.tags = { ...event.tags, component: "api" };
    }
    return event;
  });
}

export const sentryErrorMiddleware = Sentry.expressErrorHandler();
