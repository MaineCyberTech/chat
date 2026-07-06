import pino from "pino";

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

const pinoLogger = pino({ level });

function createLogger(bindings?: Record<string, unknown>) {
  const base = bindings ? pinoLogger.child(bindings) : pinoLogger;

  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.debug(meta, message);
      } else {
        base.debug(message);
      }
    },
    info(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.info(meta, message);
      } else {
        base.info(message);
      }
    },
    warn(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.warn(meta, message);
      } else {
        base.warn(message);
      }
    },
    error(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.error(meta, message);
      } else {
        base.error(message);
      }
    },
    child(newBindings: Record<string, unknown>) {
      return createLogger({ ...bindings, ...newBindings });
    },
  };
}

export const logger = createLogger();
