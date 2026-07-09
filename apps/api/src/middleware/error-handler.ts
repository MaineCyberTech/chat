import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { AppError, errorResponse } from "../lib/app-error.js";
import { pushError } from "../modules/admin/error-buffer.js";

export { AppError };

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as unknown as Record<string, unknown>).requestId as string | undefined;
  const path = req.path;

  if (err instanceof AppError) {
    logger.warn("Application error", {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    pushError({
      level: "warn",
      message: err.message,
      requestId,
      path,
      code: err.code,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
    });
    res.status(err.statusCode).json({
      error: { ...err.toJSON().error, requestId },
    });
  } else {
    logger.error("Unhandled error", {
      requestId,
      message: err.message,
      name: err.name,
      stack: process.env.SHOW_STACK_TRACES === "true" ? err.stack : undefined,
    });
    pushError({
      level: "error",
      message: err.message,
      requestId,
      path,
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      error: {
        ...errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500).error,
        requestId,
      },
    });
  }
}
