import pino from "pino";

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

const pinoLogger = pino({
  level,
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: false,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    meta ? pinoLogger.debug(meta, message) : pinoLogger.debug(message);
  },
  info(message: string, meta?: Record<string, unknown>) {
    meta ? pinoLogger.info(meta, message) : pinoLogger.info(message);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    meta ? pinoLogger.warn(meta, message) : pinoLogger.warn(message);
  },
  error(message: string, meta?: Record<string, unknown>) {
    meta ? pinoLogger.error(meta, message) : pinoLogger.error(message);
  },
};
