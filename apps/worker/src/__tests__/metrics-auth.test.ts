import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkMetricsAccess, METRICS_TOKEN_HEADER } from "../lib/metrics-auth.js";

type AnyReq = any;

const ORIGINAL_TOKEN = process.env.METRICS_TOKEN;

function mockReq(headers: Record<string, string> = {}) {
  return { headers } as AnyReq;
}

describe("checkMetricsAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.METRICS_TOKEN;
  });

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) delete process.env.METRICS_TOKEN;
    else process.env.METRICS_TOKEN = ORIGINAL_TOKEN;
  });

  it("is 404 (endpoint hidden) when METRICS_TOKEN is not configured", () => {
    expect(checkMetricsAccess(mockReq())).toEqual({ ok: false, status: 404 });
  });

  it("is 401 when the token is missing", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    expect(checkMetricsAccess(mockReq())).toEqual({ ok: false, status: 401 });
  });

  it("is 401 when the token is wrong", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    expect(checkMetricsAccess(mockReq({ [METRICS_TOKEN_HEADER]: "nope" }))).toEqual({
      ok: false,
      status: 401,
    });
  });

  it("authorizes a matching x-metrics-token header", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    expect(
      checkMetricsAccess(mockReq({ [METRICS_TOKEN_HEADER]: "super-secret-metrics-token" })),
    ).toEqual({ ok: true });
  });

  it("authorizes a matching Bearer token", () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token";
    expect(
      checkMetricsAccess(mockReq({ authorization: "Bearer super-secret-metrics-token" })),
    ).toEqual({ ok: true });
  });
});
