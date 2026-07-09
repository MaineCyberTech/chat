import { describe, it, expect, vi, beforeEach } from "vitest";

type AnyObj = any;

const capturedOptions: AnyObj[] = [];

vi.mock("express-rate-limit", () => ({
  default: vi.fn((options: AnyObj) => {
    capturedOptions.push(options);
    return vi.fn((_req: AnyObj, _res: AnyObj, next: AnyObj) => next());
  }),
}));

vi.mock("../../lib/logger.js", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe("rate-limit middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an API limiter with 100 requests per minute", async () => {
    await import("../rate-limit.js");
    expect(capturedOptions[0].max).toBe(100);
    expect(capturedOptions[0].windowMs).toBe(60_000);
    expect(capturedOptions[0].standardHeaders).toBe(true);
    expect(capturedOptions[0].legacyHeaders).toBe(false);
  });

  it("creates an auth limiter with 10 requests per minute and composite key", async () => {
    await import("../rate-limit.js");
    expect(capturedOptions[1].max).toBe(10);
    expect(capturedOptions[1].windowMs).toBe(60_000);
    expect(capturedOptions[1].keyGenerator).toBeDefined();
  });

  it("creates a search limiter with 30 requests per minute and composite key", async () => {
    await import("../rate-limit.js");
    expect(capturedOptions[2].max).toBe(30);
    expect(capturedOptions[2].windowMs).toBe(60_000);
    expect(capturedOptions[2].keyGenerator).toBeDefined();
  });

  it("API limiter message returns rate limited error", async () => {
    await import("../rate-limit.js");
    expect(capturedOptions[0].message).toEqual({
      error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" },
    });
  });

  it("auth limiter message returns auth specific error", async () => {
    await import("../rate-limit.js");
    expect(capturedOptions[1].message).toEqual({
      error: { code: "RATE_LIMITED", message: "Too many auth attempts" },
    });
  });

  it("handler logs warning and returns 429", async () => {
    await import("../rate-limit.js");
    const { logger } = await import("../../lib/logger.js");
    const handler = capturedOptions[0].handler;
    const req = { ip: "127.0.0.1", path: "/api/test", userId: undefined };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() };

    handler(req, res, vi.fn(), {
      statusCode: 429,
      message: { error: { code: "RATE_LIMITED", message: "Too many" } },
    });

    expect(logger.warn).toHaveBeenCalledWith("Rate limit hit", {
      ip: "127.0.0.1",
      userId: undefined,
      path: "/api/test",
    });
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: { code: "RATE_LIMITED", message: "Too many" } });
  });

  it("handler includes userId in log when present", async () => {
    await import("../rate-limit.js");
    const { logger } = await import("../../lib/logger.js");
    const handler = capturedOptions[0].handler;
    const req = { ip: "10.0.0.1", path: "/api/data", userId: "user-42" };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() };

    handler(req, res, vi.fn(), { statusCode: 429, message: {} });

    expect(logger.warn).toHaveBeenCalledWith("Rate limit hit", {
      ip: "10.0.0.1",
      userId: "user-42",
      path: "/api/data",
    });
  });

  it("auth limiter key generator produces composite userId:ip key", async () => {
    await import("../rate-limit.js");
    const keyGen = capturedOptions[1].keyGenerator;
    const key = keyGen({ ip: "1.2.3.4", userId: "user-1" });
    expect(key).toBe("user-1:1.2.3.4");
  });

  it("auth limiter key generator falls back to ip only when no userId", async () => {
    await import("../rate-limit.js");
    const keyGen = capturedOptions[1].keyGenerator;
    const key = keyGen({ ip: "1.2.3.4" });
    expect(key).toBe("1.2.3.4");
  });

  it("auth limiter key generator handles missing ip", async () => {
    await import("../rate-limit.js");
    const keyGen = capturedOptions[1].keyGenerator;
    const key = keyGen({});
    expect(key).toBe("unknown");
  });

  it("each limiter has correct max values (100, 10, 30)", async () => {
    await import("../rate-limit.js");
    expect(capturedOptions[0].max).toBe(100);
    expect(capturedOptions[1].max).toBe(10);
    expect(capturedOptions[2].max).toBe(30);
  });
});
