import * as Sentry from "@sentry/node";
import { loadEnv } from "../config/env.js";

function setupGlobalHandlers() {
  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason, {
      level: "fatal",
      tags: { handler: "unhandledRejection" },
    });
  });

  process.on("uncaughtException", (error) => {
    Sentry.captureException(error, {
      level: "fatal",
      tags: { handler: "uncaughtException" },
    });
  });
}

export function initSentry() {
  const env = loadEnv();
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    profilesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0.0,
    integrations: [Sentry.expressIntegration()],
    beforeSend: (event) => {
      if (event.user?.email) event.user.email = "[REDACTED]";
      if (event.user?.id) event.user.id = "[REDACTED]";
      if (event.request?.data && typeof event.request.data === "string") {
        event.request.data = (event.request.data as string).replace(
          /[\w.+-]+@[\w-]+\.[\w.-]+/g,
          "[EMAIL]",
        );
      }
      if (event.exception?.values) {
        for (const value of event.exception.values) {
          if (value.value) {
            value.value = value.value.replace(
              /[\w.+-]+@[\w-]+\.[\w.-]+/g,
              "[EMAIL]",
            );
          }
        }
      }
      return event;
    },
  });

  Sentry.addEventProcessor((event) => {
    if (event.type === "transaction") {
      event.tags = { ...event.tags, component: "api" };
    }
    return event;
  });

  setupGlobalHandlers();
}

export const sentryErrorMiddleware = Sentry.expressErrorHandler();
