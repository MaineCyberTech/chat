import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  errorResponse,
} from "../app-error.js";

describe("AppError", () => {
  it("creates error with default values", () => {
    const err = new AppError("test");
    expect(err.message).toBe("test");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.name).toBe("AppError");
  });

  it("creates error with custom code and status", () => {
    const err = new AppError("not found", 404, "NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("creates error with details", () => {
    const err = new AppError("validation failed", 400, "VALIDATION_ERROR", { field: "name" });
    expect(err.details).toEqual({ field: "name" });
  });

  it("toJSON returns structured error format", () => {
    const err = new AppError("test", 400, "BAD_REQUEST");
    expect(err.toJSON()).toEqual({
      error: { code: "BAD_REQUEST", message: "test" },
    });
  });

  it("toJSON includes details when present", () => {
    const err = new AppError("test", 400, "BAD_REQUEST", { field: "name" });
    expect(err.toJSON()).toEqual({
      error: { code: "BAD_REQUEST", message: "test", details: { field: "name" } },
    });
  });
});

describe("Error subclasses", () => {
  it("BadRequestError", () => {
    const err = new BadRequestError("invalid input");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
  });

  it("BadRequestError with details", () => {
    const err = new BadRequestError("invalid input", { field: "email" });
    expect(err.details).toEqual({ field: "email" });
  });

  it("UnauthorizedError", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Unauthorized");
  });

  it("UnauthorizedError with custom message", () => {
    const err = new UnauthorizedError("Invalid token");
    expect(err.message).toBe("Invalid token");
  });

  it("ForbiddenError", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("NotFoundError", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("ConflictError", () => {
    const err = new ConflictError("duplicate entry");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("TooManyRequestsError", () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("TOO_MANY_REQUESTS");
  });

  it("InternalServerError", () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("ServiceUnavailableError", () => {
    const err = new ServiceUnavailableError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("SERVICE_UNAVAILABLE");
  });
});

describe("errorResponse", () => {
  it("returns basic error response", () => {
    const resp = errorResponse("NOT_FOUND", "Resource not found", 404);
    expect(resp).toEqual({
      error: { code: "NOT_FOUND", message: "Resource not found" },
    });
  });

  it("includes details when provided", () => {
    const resp = errorResponse("VALIDATION_ERROR", "Invalid field", 400, { field: "name" });
    expect(resp.error.details).toEqual({ field: "name" });
  });
});
