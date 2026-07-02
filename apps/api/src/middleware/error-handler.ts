import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { AppError } from "../lib/app-error.js";
import { failure } from "../lib/response.js";

export { AppError };

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn("Application error", {
      requestId: req.requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
    });
    const useEnvelope = req.query?.envelope === "true";
    if (useEnvelope) {
      res.status(err.statusCode).json(failure(err.code, err.message, err.statusCode));
    } else {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
    }
  } else {
    logger.error("Unhandled error", {
      requestId: req.requestId,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    const useEnvelope = req.query?.envelope === "true";
    if (useEnvelope) {
      res.status(500).json(failure("INTERNAL_ERROR", "An unexpected error occurred", 500));
    } else {
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      });
    }
  }
}
