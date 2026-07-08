import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { AppError, errorResponse } from "../lib/app-error.js";

export { AppError };

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as unknown as Record<string, unknown>).requestId as string | undefined;

  if (err instanceof AppError) {
    logger.warn("Application error", {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
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
    res
      .status(500)
      .json({
        error: {
          ...errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500).error,
          requestId,
        },
      });
  }
}
