import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { AppError, errorResponse } from "../lib/app-error.js";
import { failure } from "../lib/response.js";

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
    const useEnvelope = req.query?.envelope === "true";
    if (useEnvelope) {
      res.status(err.statusCode).json(failure(err.code, err.message, err.statusCode));
    } else {
      res.status(err.statusCode).json(err.toJSON());
    }
  } else {
    logger.error("Unhandled error", {
      requestId,
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    const useEnvelope = req.query?.envelope === "true";
    if (useEnvelope) {
      res.status(500).json(failure("INTERNAL_ERROR", "An unexpected error occurred", 500));
    } else {
      res.status(500).json(errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500));
    }
  }
}
