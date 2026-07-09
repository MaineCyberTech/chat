import { describe, it, expect, vi } from "vitest";
import exportRouter from "../routes.js";

const mockData = { data: [], error: null };

const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({ order: vi.fn(() => mockData) })),
}));

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseAdmin: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (exportRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return { userId: "admin-1", supabase: { from: vi.fn() }, query: {}, ...overrides } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  res.setHeader = vi.fn(() => res) as any;
  return res as any;
}

describe("Export Routes", () => {
  it("GET /admin/export/workspaces returns CSV", async () => {
    const handler = findHandler("get", "/admin/export/workspaces");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalled();
  });

  it("GET /admin/export/users returns CSV", async () => {
    const handler = findHandler("get", "/admin/export/users");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalled();
  });

  it("GET /admin/export/channels returns CSV", async () => {
    const handler = findHandler("get", "/admin/export/channels");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalled();
  });

  it("GET /admin/export/messages returns CSV", async () => {
    const handler = findHandler("get", "/admin/export/messages");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalled();
  });
});
