import { describe, it, expect, vi } from "vitest";
import { requestId } from "../request-id.js";

const VALID = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

function mockReq(headers: Record<string, string> = {}) {
  return { headers, requestId: "" } as any;
}

function mockRes() {
  return { setHeader: vi.fn() } as any;
}

describe("requestId middleware", () => {
  it("generates a UUID when no x-request-id header is present", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(next).toHaveBeenCalled();
  });

  it("uses x-request-id header when provided", () => {
    const req = mockReq({ "x-request-id": "custom-id-123" });
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.requestId).toBe("custom-id-123");
    expect(next).toHaveBeenCalled();
  });

  it("handles x-request-id as a string array from header", () => {
    const req = mockReq({ "x-request-id": "first-id" });
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.requestId).toBe("first-id");
    expect(next).toHaveBeenCalled();
  });

  it("propagates requestId to response header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(req.requestId.length).toBeGreaterThan(0);
  });

  it("continues an inbound traceparent and echoes it on the response", () => {
    const req = mockReq({ traceparent: VALID });
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(req.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(req.traceparent).toMatch(/^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);
    expect(res.setHeader).toHaveBeenCalledWith("traceparent", req.traceparent);
  });

  it("starts a new trace and emits traceparent when none is inbound", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(req.traceId).not.toBe("00000000000000000000000000000000");
    expect(res.setHeader).toHaveBeenCalledWith("traceparent", req.traceparent);
  });
});
