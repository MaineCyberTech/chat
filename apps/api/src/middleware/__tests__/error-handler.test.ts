import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorHandler, AppError } from "../error-handler.js";

type AnyObj = any;

vi.mock("../../lib/logger.js", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

function mockReq(query: Record<string, string> = {}) {
  return {
    requestId: "req-123",
    query,
  } as AnyObj;
}

function mockRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as AnyObj;
}

describe("errorHandler middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 for unknown errors", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new Error("Something broke");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns structured JSON error response for unknown errors", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new Error("Something broke");

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  it("logs error details for unknown errors", async () => {
    const { logger } = await import("../../lib/logger.js");
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new Error("Something broke");

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith("Unhandled error", {
      requestId: "req-123",
      message: "Something broke",
      name: "Error",
      stack: undefined,
    });
  });

  it("returns the stack trace in development mode", async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const { logger } = await import("../../lib/logger.js");

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new Error("dev error");

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith("Unhandled error", {
      requestId: "req-123",
      message: "dev error",
      name: "Error",
      stack: expect.any(String),
    });

    process.env.NODE_ENV = prevEnv;
  });

  it("handles AppError with specific status code and code", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new AppError("Not found", 404, "NOT_FOUND");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  });

  it("handles AppError with default 500 status", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new AppError("Server error");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_ERROR", message: "Server error" },
    });
  });

  it("handles AppError 403 Forbidden", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new AppError("Forbidden", 403, "FORBIDDEN");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "FORBIDDEN", message: "Forbidden" },
    });
  });

  it("handles AppError 401 Unauthorized", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new AppError("Unauthorized", 401, "UNAUTHORIZED");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  });

  it("logs warning for AppError with structured metadata", async () => {
    const { logger } = await import("../../lib/logger.js");
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const err = new AppError("Rate limited", 429, "RATE_LIMITED");

    errorHandler(err, req, res, next);

    expect(logger.warn).toHaveBeenCalledWith("Application error", {
      requestId: "req-123",
      code: "RATE_LIMITED",
      statusCode: 429,
      message: "Rate limited",
    });
  });

  it("handles Zod validation errors as unknown errors (500)", async () => {
    const { z } = await import("zod");
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    const schema = z.object({ name: z.string() });
    let zodError: Error = new Error("fallback");
    try {
      schema.parse({ name: 42 });
    } catch (err) {
      zodError = err as Error;
    }

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  });

  it("uses envelope format when query contains envelope=true", () => {
    const req = mockReq({ envelope: "true" });
    const res = mockRes();
    const next = vi.fn();
    const err = new AppError("Not found", 404, "NOT_FOUND");

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  });

  it("uses envelope format for unknown errors when envelope=true", () => {
    const req = mockReq({ envelope: "true" });
    const res = mockRes();
    const next = vi.fn();
    const err = new Error("Unknown");

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  });
});
