import { describe, it, expect, vi, beforeEach } from "vitest";
import { securityHeaders } from "../security-headers.js";

type AnyObj = any;

function mockReq() {
  return {} as AnyObj;
}

function mockRes() {
  const headers: Record<string, string> = {};
  return {
    setHeader: vi.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    removeHeader: vi.fn(),
    getHeader: vi.fn((name: string) => headers[name]),
  } as AnyObj;
}

describe("securityHeaders middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets Content-Security-Policy header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Security-Policy", expect.any(String));
  });

  it("sets Strict-Transport-Security header with max-age and preload", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  });

  it("sets X-Content-Type-Options header to nosniff", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
  });

  it("sets X-Frame-Options header to DENY", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
  });

  it("sets Referrer-Policy header to strict-origin-when-cross-origin", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Referrer-Policy",
      "strict-origin-when-cross-origin",
    );
  });

  it("sets X-XSS-Protection header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-XSS-Protection", "1; mode=block");
  });

  it("sets Permissions-Policy header restricting camera, mic, geolocation", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
  });

  it("sets Cross-Origin isolation headers", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Cross-Origin-Embedder-Policy", "credentialless");
    expect(res.setHeader).toHaveBeenCalledWith("Cross-Origin-Opener-Policy", "same-origin");
    expect(res.setHeader).toHaveBeenCalledWith("Cross-Origin-Resource-Policy", "same-origin");
  });

  it("removes X-Powered-By header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(res.removeHeader).toHaveBeenCalledWith("X-Powered-By");
  });

  it("calls next after setting headers", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("does not override existing headers (setHeader is called once per header)", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    securityHeaders(req, res, next);

    const cspCalls = res.setHeader.mock.calls.filter(
      ([name]: [string]) => name === "Content-Security-Policy",
    );
    expect(cspCalls).toHaveLength(1);
  });
});
