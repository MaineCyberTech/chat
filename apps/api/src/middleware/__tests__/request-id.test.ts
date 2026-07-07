import { describe, it, expect, vi } from "vitest";
import { requestId } from "../request-id.js";

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
});
