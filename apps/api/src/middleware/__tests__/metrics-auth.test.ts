import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requireMetricsAccess, METRICS_TOKEN_HEADER } from "../metrics-auth.js";

type AnyObj = any;

const ORIGINAL_TOKEN = process.env.METRICS_TOKEN;

function mockReq(headers: Record<string, string> = {}) {
  return { headers } as AnyObj;
}

function mockRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as AnyObj;
}

describe("requireMetricsAccess middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.METRICS_TOKEN;
  });

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) delete process.env.METRICS_TOKEN;
    else process.env.METRICS_TOKEN = ORIGINAL_TOKEN;
  });

  it("returns 404 (hides the endpoint) when METRICS_TOKEN is not configured", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requireMetricsAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when no token is presented", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requireMetricsAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a wrong token of equal length", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    const req = mockReq({ [METRICS_TOKEN_HEADER]: "super-secret-metrics-tokeX" });
    const res = mockRes();
    const next = vi.fn();

    requireMetricsAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 (without throwing) when the token length differs", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    const req = mockReq({ [METRICS_TOKEN_HEADER]: "short" });
    const res = mockRes();
    const next = vi.fn();

    expect(() => requireMetricsAccess(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the x-metrics-token header matches", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    const req = mockReq({ [METRICS_TOKEN_HEADER]: "super-secret-metrics-token" });
    const res = mockRes();
    const next = vi.fn();

    requireMetricsAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next when a matching Bearer token is presented", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    const req = mockReq({ authorization: "Bearer super-secret-metrics-token" });
    const res = mockRes();
    const next = vi.fn();

    requireMetricsAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
