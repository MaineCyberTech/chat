export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
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

export function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return {
    error: { code, message, ...(details ? { details } : {}) },
  };
}
