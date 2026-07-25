import { describe, it, expect, vi, beforeEach } from "vitest";
import announcementsRouter from "../routes.js";
import { errorHandler } from "../../../middleware/error-handler.js";

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseForUser: vi.fn(),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

type MockChain = { [key: string]: any; then: (fn: (v: unknown) => unknown) => Promise<unknown> };

function createChain(result: unknown): MockChain {
  const chain: any = {};
  for (const m of [
    "select",
    "eq",
    "in",
    "order",
    "limit",
    "single",
    "insert",
    "update",
    "delete",
    "is",
    "or",
    "gt",
    "lt",
    "contains",
    "lte",
    "upsert",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (onfulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onfulfilled);
  return chain;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    supabase: { from: vi.fn() },
    query: {},
    body: {},
    params: {},
    headers: {},
    ip: "127.0.0.1",
    ...overrides,
  } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  return res as any;
}

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (announcementsRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

async function callHandler(handler: any, req: any, res: any) {
  const next = vi.fn();
  await handler(req, res, next);
  if (next.mock.calls.length > 0) {
    const err = next.mock.calls[0][0];
    errorHandler(err, req, res, vi.fn());
  }
}

describe("announcements routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /workspaces/:workspaceId/announcements", () => {
    it("returns active announcements for workspace", async () => {
      const mockData = [
        {
          id: "1",
          title: "Welcome",
          body: "Hello!",
          created_by: "user-1",
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      ];
      const chain = createChain({ data: mockData, error: null });
      const from = vi.fn(() => chain);
      const handler = findHandler("get", "/workspaces/:workspaceId/announcements");
      const req = mockReq({ params: { workspaceId: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ announcements: mockData });
    });

    it("throws on database error", async () => {
      const chain = createChain({ data: null, error: new Error("DB error") });
      const from = vi.fn(() => chain);
      const handler = findHandler("get", "/workspaces/:workspaceId/announcements");
      const req = mockReq({ params: { workspaceId: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("POST /workspaces/:workspaceId/announcements", () => {
    it("creates an announcement and returns 201", async () => {
      const mockAnnouncement = {
        id: "ann-1",
        title: "New Policy",
        body: "Please read",
        created_by: "user-1",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      };
      const insertChain = createChain({ data: mockAnnouncement, error: null });
      const from = vi.fn(() => insertChain);
      const handler = findHandler("post", "/workspaces/:workspaceId/announcements");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        body: { title: "New Policy", body: "Please read" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ announcement: mockAnnouncement });
    });

    it("returns 400 when title is missing", async () => {
      const handler = findHandler("post", "/workspaces/:workspaceId/announcements");
      const req = mockReq({ params: { workspaceId: "ws-1" }, body: { body: "Some body" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: "BAD_REQUEST" }) }),
      );
    });

    it("returns 400 when body is missing", async () => {
      const handler = findHandler("post", "/workspaces/:workspaceId/announcements");
      const req = mockReq({ params: { workspaceId: "ws-1" }, body: { title: "Title" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("throws on database error", async () => {
      const insertChain = createChain({ data: null, error: new Error("Insert failed") });
      const from = vi.fn(() => insertChain);
      const handler = findHandler("post", "/workspaces/:workspaceId/announcements");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        body: { title: "Title", body: "Body" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("PATCH /workspaces/:workspaceId/announcements/:id/dismiss", () => {
    it("dismisses an announcement", async () => {
      const existingChain = createChain({ data: { id: "ann-1", active: true }, error: null });
      const updateChain = createChain({
        data: {
          id: "ann-1",
          title: "Old",
          body: "Old",
          active: false,
          created_by: "user-1",
          created_at: "2026-01-01",
          updated_at: "2026-01-02",
        },
        error: null,
      });
      let callCount = 0;
      const from = vi.fn(() => {
        callCount++;
        return callCount === 1 ? existingChain : updateChain;
      });
      const handler = findHandler("patch", "/workspaces/:workspaceId/announcements/:id/dismiss");
      const req = mockReq({ params: { workspaceId: "ws-1", id: "ann-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          announcement: expect.objectContaining({ id: "ann-1", active: false }),
        }),
      );
    });

    it("returns 404 when announcement not found", async () => {
      const chain = createChain({ data: null, error: { code: "PGRST116", message: "Not found" } });
      const from = vi.fn(() => chain);
      const handler = findHandler("patch", "/workspaces/:workspaceId/announcements/:id/dismiss");
      const req = mockReq({ params: { workspaceId: "ws-1", id: "missing" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("throws on database error during update", async () => {
      let callCount = 0;
      const existingChain = createChain({ data: { id: "ann-1", active: true }, error: null });
      const updateChain = createChain({ data: null, error: new Error("Update failed") });
      const from = vi.fn(() => {
        callCount++;
        return callCount === 1 ? existingChain : updateChain;
      });
      const handler = findHandler("patch", "/workspaces/:workspaceId/announcements/:id/dismiss");
      const req = mockReq({ params: { workspaceId: "ws-1", id: "ann-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
