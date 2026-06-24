export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", details?: unknown) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Too many requests", details?: unknown) {
    super(message, 429, "TOO_MANY_REQUESTS", details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", details?: unknown) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service unavailable", details?: unknown) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
  }
}

/**
 * RFC 7807 Problem Details format
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  [key: string]: unknown;
}

export function toProblemDetails(error: AppError, instance?: string): ProblemDetails {
  return {
    type: `https://api.chat-platform.dev/errors/${error.code.toLowerCase()}`,
    title: error.code.replace(/_/g, " "),
    status: error.statusCode,
    detail: error.message,
    instance,
    ...(error.details ? { details: error.details } : {}),
  };
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
