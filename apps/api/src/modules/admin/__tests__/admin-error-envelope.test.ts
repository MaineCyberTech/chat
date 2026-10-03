import { describe, it, expect, vi, beforeEach } from "vitest";
import adminRouter from "../routes.js";
import { NotFoundError } from "../../../lib/app-error.js";

type AnyObj = any;

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../webhooks/service.js", () => ({
  webhookService: { retryDeadLetter: vi.fn() },
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (adminRouter as AnyObj).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function mockRes() {
  const res: AnyObj = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("admin error envelope (API-P2-002)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes a missing dead letter through the canonical error envelope", async () => {
    const { webhookService } = await import("../../webhooks/service.js");
    (webhookService.retryDeadLetter as AnyObj).mockResolvedValue(false);

    const handler = findHandler("post", "/webhooks/dead-letters/:id/retry");
    const res = mockRes();
    const next = vi.fn();

    await handler({ params: { id: "dl-1" } }, res, next);

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it("returns success when the dead letter is retried", async () => {
    const { webhookService } = await import("../../webhooks/service.js");
    (webhookService.retryDeadLetter as AnyObj).mockResolvedValue(true);

    const handler = findHandler("post", "/webhooks/dead-letters/:id/retry");
    const res = mockRes();
    const next = vi.fn();

    await handler({ params: { id: "dl-1" } }, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });
});
