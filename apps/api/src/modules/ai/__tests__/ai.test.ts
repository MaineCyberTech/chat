import { describe, it, expect, vi } from "vitest";
import aiRouter from "../routes.js";

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (aiRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return { userId: "user-1", supabase: { from: vi.fn() }, body: {}, ...overrides } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  return res as any;
}

describe("AI Rewrite Route", () => {
  it("POST /rewrite returns rewritten text", async () => {
    const handler = findHandler("post", "/rewrite");
    expect(handler).toBeTruthy();
    const req = mockReq({ body: { text: "Hello teh world", action: "fix-spelling" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ rewritten: "Hello the world" }),
    );
  });

  it("POST /rewrite returns 400 for missing text", async () => {
    const handler = findHandler("post", "/rewrite");
    const req = mockReq({ body: { action: "fix-spelling" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "INVALID_INPUT" }) }),
    );
  });

  it("POST /rewrite returns 400 for missing action", async () => {
    const handler = findHandler("post", "/rewrite");
    const req = mockReq({ body: { text: "Hello" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
