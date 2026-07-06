import { describe, it, expect, vi, beforeEach } from "vitest";
import sidebarRouter from "../routes.js";

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
    "select", "eq", "in", "order", "limit", "single",
    "insert", "update", "delete", "is", "or", "gt", "lt", "contains", "lte",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve(result).then(onfulfilled);
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
  for (const layer of (sidebarRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

describe("sidebar categories routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns 400 when workspace_id missing", async () => {
      const handler = findHandler("get", "/");
      const req = mockReq();
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "workspace_id required" });
    });

    it("lists categories with channel assignments", async () => {
      const catChain = createChain({
        data: [
          { id: "cat-1", workspace_id: "ws-1", user_id: "user-1", name: "General", sort_order: 0 },
        ],
        error: null,
      });
      const asgnChain = createChain({
        data: [
          { id: "asgn-1", category_id: "cat-1", channel_id: "ch-1", sort_order: 0 },
        ],
        error: null,
      });
      const from = vi.fn().mockReturnValueOnce(catChain).mockReturnValueOnce(asgnChain);

      const handler = findHandler("get", "/");
      const req = mockReq({ query: { workspace_id: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.arrayContaining([
            expect.objectContaining({ name: "General", channels: ["ch-1"] }),
          ]),
        }),
      );
    });
  });

  describe("POST /", () => {
    it("returns 400 when name missing", async () => {
      const handler = findHandler("post", "/");
      const req = mockReq({ body: { workspace_id: "ws-1" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("creates a category", async () => {
      const sortChain = createChain({ data: [{ sort_order: 0 }], error: null });
      const insertChain = createChain({
        data: { id: "cat-new", workspace_id: "ws-1", name: "New Category", sort_order: 1 },
        error: null,
      });
      const from = vi.fn().mockReturnValueOnce(sortChain).mockReturnValueOnce(insertChain);

      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { workspace_id: "ws-1", name: "New Category" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.objectContaining({ name: "New Category" }),
        }),
      );
    });
  });

  describe("PATCH /:id", () => {
    it("renames a category", async () => {
      const updateChain = createChain({
        data: { id: "cat-1", name: "Renamed", sort_order: 0 },
        error: null,
      });
      const from = vi.fn(() => updateChain);

      const handler = findHandler("patch", "/:id");
      const req = mockReq({
        params: { id: "11111111-1111-1111-1111-111111111111" },
        body: { name: "Renamed" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.objectContaining({ name: "Renamed" }),
        }),
      );
    });
  });

  describe("DELETE /:id", () => {
    it("deletes a category", async () => {
      const deleteChain = createChain({ error: null });
      const from = vi.fn(() => deleteChain);

      const handler = findHandler("delete", "/:id");
      const req = mockReq({
        params: { id: "11111111-1111-1111-1111-111111111111" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe("PATCH /reorder", () => {
    it("reorders categories", async () => {
      const updateChain = createChain({ error: null });
      const from = vi.fn(() => updateChain);

      const handler = findHandler("patch", "/reorder");
      const req = mockReq({
        body: { categoryIds: ["cat-1", "cat-2"] },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("returns 400 when categoryIds missing", async () => {
      const handler = findHandler("patch", "/reorder");
      const req = mockReq({ body: {} });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("POST /:id/assignments", () => {
    it("adds a channel to a category", async () => {
      const catCheckChain = createChain({
        data: { id: "cat-1" },
        error: null,
      });
      const sortChain = createChain({ data: [{ sort_order: 0 }], error: null });
      const insertChain = createChain({
        data: { id: "asgn-new", category_id: "cat-1", channel_id: "ch-2", sort_order: 1 },
        error: null,
      });
      const from = vi.fn()
        .mockReturnValueOnce(catCheckChain)
        .mockReturnValueOnce(sortChain)
        .mockReturnValueOnce(insertChain);

      const handler = findHandler("post", "/:id/assignments");
      const req = mockReq({
        params: { id: "11111111-1111-1111-1111-111111111111" },
        body: { channel_id: "ch-2" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          assignment: expect.objectContaining({ channel_id: "ch-2" }),
        }),
      );
    });

    it("returns 400 when channel_id missing", async () => {
      const handler = findHandler("post", "/:id/assignments");
      const req = mockReq({
        params: { id: "11111111-1111-1111-1111-111111111111" },
        body: {},
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
