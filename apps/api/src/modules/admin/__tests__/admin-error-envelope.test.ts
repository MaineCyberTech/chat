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

function mockChain(result: unknown) {
  const chain: AnyObj = {};
  for (const method of ["select", "eq", "in", "single"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return chain;
}

// The retry handler scopes the dead letter to the caller's admin workspaces
// (chat-AUTH-001), so the test must provide both the request context normally
// attached by requireAdmin and the two Supabase queries it performs.
function mockAdminForRetry(deadLetter: { id: string } | null) {
  const endpointsChain = mockChain({ data: [{ id: "wh-1" }], error: null });
  const deadLetterChain = mockChain({ data: deadLetter, error: null });
  const from = vi.fn().mockReturnValueOnce(endpointsChain).mockReturnValueOnce(deadLetterChain);
  return { from };
}

describe("admin error envelope (API-P2-002)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes a missing dead letter through the canonical error envelope", async () => {
    const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
    const { webhookService } = await import("../../webhooks/service.js");
    (webhookService.retryDeadLetter as AnyObj).mockResolvedValue(false);
    (getSupabaseAdmin as AnyObj).mockReturnValue(mockAdminForRetry(null));

    const handler = findHandler("post", "/webhooks/dead-letters/:id/retry");
    const res = mockRes();
    const next = vi.fn();

    await handler({ params: { id: "dl-1" }, adminWorkspaceIds: ["ws-1"] }, res, next);

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it("returns success when the dead letter is retried", async () => {
    const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
    const { webhookService } = await import("../../webhooks/service.js");
    (webhookService.retryDeadLetter as AnyObj).mockResolvedValue(true);
    (getSupabaseAdmin as AnyObj).mockReturnValue(mockAdminForRetry({ id: "dl-1" }));

    const handler = findHandler("post", "/webhooks/dead-letters/:id/retry");
    const res = mockRes();
    const next = vi.fn();

    await handler({ params: { id: "dl-1" }, adminWorkspaceIds: ["ws-1"] }, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });
});
