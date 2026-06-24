import pino, { Logger, LoggerOptions, LogFn } from "pino";
import pretty from "pino-pretty";

export interface LogConfig extends LoggerOptions {
  level?: string;
  pretty?: boolean;
}

// Extended logger type that supports structured logging
export interface ExtendedLogger extends Logger {
  info: LogFn & ((obj: Record<string, unknown>, msg?: string) => void);
  warn: LogFn & ((obj: Record<string, unknown>, msg?: string) => void);
  error: LogFn & ((obj: Record<string, unknown>, msg?: string) => void);
  debug: LogFn & ((obj: Record<string, unknown>, msg?: string) => void);
  trace: LogFn & ((obj: Record<string, unknown>, msg?: string) => void);
  fatal: LogFn & ((obj: Record<string, unknown>, msg?: string) => void);
}

let loggerInstance: ExtendedLogger | null = null;

export function createLogger(config: LogConfig = {}): ExtendedLogger {
  if (loggerInstance) return loggerInstance;

  const isDev = process.env.NODE_ENV !== "production";
  const level = config.level ?? process.env.LOG_LEVEL ?? "info";

  const options: LoggerOptions = {
    level,
    base: {
      service: process.env.npm_package_name ?? "unknown",
      version: process.env.npm_package_version ?? "0.0.0",
      env: process.env.NODE_ENV,
    },
    redact: {
      paths: [
        "*.password",
        "*.secret",
        "*.token",
        "*.authorization",
        "*.cookie",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  };

  if (isDev && config.pretty !== false) {
    const stream = pretty({
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    });
    loggerInstance = pino(options, stream) as ExtendedLogger;
  } else {
    loggerInstance = pino(options) as ExtendedLogger;
  }

  return loggerInstance;
}

export function getLogger(): ExtendedLogger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}

export const logger = getLogger();
