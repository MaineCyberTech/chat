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
    "select",
    "eq",
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

function makeFrom(mapping: Record<string, (() => any) | any[]>) {
  const callCounts: Record<string, number> = {};
  return vi.fn((table: string) => {
    const entry = mapping[table];
    if (Array.isArray(entry)) {
      const idx = callCounts[table] ?? 0;
      callCounts[table] = idx + 1;
      return entry[idx % entry.length]();
    }
    if (typeof entry === "function") {
      return (entry as () => any)();
    }
    return createChain({ data: [], error: null });
  });
}

describe("scheduled-posts routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("lists unsent, uncancelled scheduled posts", async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const postsChain = createChain({
        data: [
          { id: "p-1", channel_id: "ch-1", content: "Hello world", scheduled_at: futureDate },
          { id: "p-2", channel_id: "ch-2", content: "Reminder", scheduled_at: futureDate },
        ],
        error: null,
      });

      const from = makeFrom({
        workspace_members: () =>
          createChain({
            data: { role: "member" },
            error: null,
          }),
        scheduled_posts: () => postsChain,
      });

      const handler = findHandler("get", "/");
      const req = mockReq({
        supabase: { from },
        query: { workspace_id: "ws-1" },
      });
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

    it("creates a scheduled post", async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const from = makeFrom({
        channels: () =>
          createChain({
            data: { workspace_id: "ws-1" },
            error: null,
          }),
        workspace_members: () =>
          createChain({
            data: { role: "member" },
            error: null,
          }),
        scheduled_posts: () =>
          createChain({
            data: {
              id: "p-1",
              channel_id: "ch-1",
              content: "Hello",
              scheduled_at: futureDate.toISOString(),
            },
            error: null,
          }),
      });

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

    it("returns 400 when scheduled_at is in the past", async () => {
      const from = makeFrom({
        channels: () =>
          createChain({
            data: { workspace_id: "ws-1" },
            error: null,
          }),
        workspace_members: () =>
          createChain({
            data: { role: "member" },
            error: null,
          }),
      });

      const handler = findHandler("post", "/");
      const req = mockReq({
        body: {
          channel_id: "ch-1",
          content: "Hello",
          scheduled_at: new Date("2020-01-01").toISOString(),
        },
        supabase: { from },
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
  });

  describe("DELETE /:id", () => {
    it("cancels a scheduled post", async () => {
      const from = makeFrom({
        scheduled_posts: [
          () =>
            createChain({
              data: { channel_id: "ch-1", user_id: "user-1" },
              error: null,
            }),
          () =>
            createChain({
              data: null,
              error: null,
            }),
        ],
        channels: () =>
          createChain({
            data: { workspace_id: "ws-1" },
            error: null,
          }),
        workspace_members: () =>
          createChain({
            data: { role: "member" },
            error: null,
          }),
      });

      const handler = findHandler("delete", "/:id");
      const req = mockReq({ params: { id: "p-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
