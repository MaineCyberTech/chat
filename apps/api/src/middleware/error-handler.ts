import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn("Application error", {
      requestId: req.requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
    });
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  } else {
    logger.error("Unhandled error", {
      requestId: req.requestId,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
}
