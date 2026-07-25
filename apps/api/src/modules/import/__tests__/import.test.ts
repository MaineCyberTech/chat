import { describe, it, expect, vi, beforeEach } from "vitest";
import importRouter from "../routes.js";

let insertErrors: boolean = false;

const mockInsert = vi.fn(() =>
  insertErrors ? { error: { message: "duplicate key" } } : { error: null },
);

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({ insert: mockInsert })),
  })),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (importRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return { userId: "admin-1", supabase: { from: vi.fn() }, body: "", ...overrides } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  return res as any;
}

function csvBody(csv: string) {
  return { body: csv, headers: { "content-type": "text/csv" } };
}

describe("Import Routes", () => {
  beforeEach(() => {
    insertErrors = false;
    mockInsert.mockClear();
  });

  it("POST /admin/import/workspaces returns correct imported count", async () => {
    const handler = findHandler("post", "/admin/import/workspaces");
    expect(handler).toBeTruthy();
    const req = mockReq(csvBody("name,slug\nTest,test\nSecond,second"));
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ imported: 2, errors: undefined });
  });

  it("POST /admin/import/workspaces handles empty CSV", async () => {
    const handler = findHandler("post", "/admin/import/workspaces");
    const req = mockReq(csvBody("name,slug"));
    const res = mockRes();
    const next = vi.fn();
    await handler(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0]?.[0];
    expect(err?.message).toContain("CSV must contain a header row");
  });

  it("POST /admin/import/workspaces reports errors on insert failure", async () => {
    insertErrors = true;
    const handler = findHandler("post", "/admin/import/workspaces");
    const req = mockReq(csvBody("name,slug\nTest,test"));
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ imported: 0, errors: expect.any(Array) }),
    );
  });

  it("POST /admin/import/users returns correct imported count", async () => {
    const handler = findHandler("post", "/admin/import/users");
    expect(handler).toBeTruthy();
    const req = mockReq(csvBody("email,display_name\na@test.com,UserA\nb@test.com,UserB"));
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ imported: 2, errors: undefined });
  });

  it("POST /admin/import/users reports missing email column", async () => {
    const handler = findHandler("post", "/admin/import/users");
    const req = mockReq(csvBody("email,display_name\n,Tester"));
    const res = mockRes();
    await handler(req, res);
    const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.imported).toBe(0);
    expect(call.errors).toBeDefined();
    expect(call.errors.length).toBeGreaterThan(0);
  });
});
