import {
  createLogger as createBaseLogger,
  getLogger as getBaseLogger,
} from "@chat/config/logger.js";

function createLogger(bindings?: Record<string, unknown>) {
  const base = bindings ? createBaseLogger().child(bindings ?? {}) : getBaseLogger();

  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        (base as { debug: (obj: Record<string, unknown>, msg: string) => void }).debug(
          meta,
          message,
        );
      } else {
        base.debug(message);
      }
    },
    info(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        (base as { info: (obj: Record<string, unknown>, msg: string) => void }).info(meta, message);
      } else {
        base.info(message);
      }
    },
    warn(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        (base as { warn: (obj: Record<string, unknown>, msg: string) => void }).warn(meta, message);
      } else {
        base.warn(message);
      }
    },
    error(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        (base as { error: (obj: Record<string, unknown>, msg: string) => void }).error(
          meta,
          message,
        );
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
