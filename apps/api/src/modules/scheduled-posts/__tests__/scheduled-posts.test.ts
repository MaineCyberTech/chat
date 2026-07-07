import { describe, it, expect, vi, beforeEach } from "vitest";
import scheduledPostsRouter from "../routes.js";
import { errorHandler } from "../../../middleware/error-handler.js";

vi.mock("../../../middleware/authenticate.js", () => ({
  authenticate: vi.fn((req: any, _res: any, next: any) => {
    req.userId ??= "user-1";
    req.supabase ??= { from: vi.fn() };
    next();
  }),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function createChain(result: unknown) {
  const chain: any = {};
  for (const m of [
    "select", "eq", "order", "limit", "single",
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
  for (const layer of (scheduledPostsRouter as any).stack) {
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

describe("scheduled-posts routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("lists unsent, uncancelled scheduled posts", async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const chain = createChain({
        data: [
          { id: "p-1", channel_id: "ch-1", content: "Hello world", scheduled_at: futureDate },
          { id: "p-2", channel_id: "ch-2", content: "Reminder", scheduled_at: futureDate },
        ],
        error: null,
      });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/");
      const req = mockReq({ supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({
        posts: expect.arrayContaining([
          expect.objectContaining({ content: "Hello world" }),
          expect.objectContaining({ content: "Reminder" }),
        ]),
      });
    });
  });

  describe("POST /", () => {
    it("returns 400 when channel_id missing", async () => {
      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { content: "Hello", scheduled_at: new Date(Date.now() + 86400000).toISOString() },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns 400 when content missing", async () => {
      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { channel_id: "ch-1", scheduled_at: new Date(Date.now() + 86400000).toISOString() },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when scheduled_at missing", async () => {
      const handler = findHandler("post", "/");
      const req = mockReq({ body: { channel_id: "ch-1", content: "Hello" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when scheduled_at is in the past", async () => {
      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { channel_id: "ch-1", content: "Hello", scheduled_at: new Date("2020-01-01").toISOString() },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("creates a scheduled post", async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const insertChain = createChain({
        data: { id: "p-1", channel_id: "ch-1", content: "Hello", scheduled_at: futureDate.toISOString() },
        error: null,
      });
      const from = vi.fn(() => insertChain);

      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { channel_id: "ch-1", content: "Hello", scheduled_at: futureDate.toISOString() },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          post: expect.objectContaining({ content: "Hello" }),
        }),
      );
    });
  });

  describe("DELETE /:id", () => {
    it("cancels a scheduled post", async () => {
      const from = vi.fn(() => createChain({ error: null }));

      const handler = findHandler("delete", "/:id");
      const req = mockReq({ params: { id: "p-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
