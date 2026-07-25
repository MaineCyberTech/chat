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
  isAppError,
  toProblemDetails,
} from "../errors.js";

describe("AppError", () => {
  it("creates an error with statusCode, code, and message", () => {
    const err = new AppError("test", 400, "TEST_ERROR");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("test");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("TEST_ERROR");
    expect(err.name).toBe("AppError");
  });

  it("accepts optional details", () => {
    const err = new AppError("test", 400, "TEST_ERROR", { field: "name" });
    expect(err.details).toEqual({ field: "name" });
  });
});

describe("isAppError", () => {
  it("returns true for AppError instances", () => {
    expect(isAppError(new AppError("err", 500, "ERR"))).toBe(true);
    expect(isAppError(new BadRequestError("bad"))).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
  });

  it("returns false for plain Error", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

describe("toProblemDetails", () => {
  it("converts AppError to RFC 7807 format", () => {
    const err = new NotFoundError("User not found");
    const result = toProblemDetails(err);

    expect(result.status).toBe(404);
    expect(result.title).toBe("NOT FOUND");
    expect(result.detail).toBe("User not found");
    expect(result.type).toContain("not_found");
  });

  it("includes instance when provided", () => {
    const err = new BadRequestError("Invalid input");
    const result = toProblemDetails(err, "/api/v1/users");

    expect(result.instance).toBe("/api/v1/users");
    expect(result.status).toBe(400);
  });
});

describe("error subclasses", () => {
  it("BadRequestError has status 400", () => {
    const err = new BadRequestError("bad");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err).toBeInstanceOf(AppError);
  });

  it("UnauthorizedError has status 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("ForbiddenError has status 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("NotFoundError has status 404", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("ConflictError has status 409", () => {
    const err = new ConflictError("duplicate");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("TooManyRequestsError has status 429", () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("TOO_MANY_REQUESTS");
  });

  it("InternalServerError has status 500", () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("ServiceUnavailableError has status 503", () => {
    const err = new ServiceUnavailableError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("SERVICE_UNAVAILABLE");
  });
});
