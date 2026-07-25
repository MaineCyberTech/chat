import { describe, it, expect, vi, beforeEach } from "vitest";
import emojiRouter from "../routes.js";
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
  for (const layer of (emojiRouter as any).stack) {
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

describe("emoji routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /workspaces/:workspaceId/emoji", () => {
    it("lists emoji for a workspace", async () => {
      const chain = createChain({
        data: [
          {
            id: "e1",
            workspace_id: "ws-1",
            name: "wave",
            image_url: "https://example.com/wave.png",
            created_by: "user-1",
          },
        ],
        error: null,
      });

      const handler = findHandler("get", "/workspaces/:workspaceId/emoji");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        supabase: { from: vi.fn(() => chain) },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          emoji: expect.arrayContaining([
            expect.objectContaining({ name: "wave", image_url: "https://example.com/wave.png" }),
          ]),
        }),
      );
    });

    it("returns empty array when no emoji", async () => {
      const chain = createChain({ data: [], error: null });

      const handler = findHandler("get", "/workspaces/:workspaceId/emoji");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        supabase: { from: vi.fn(() => chain) },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ emoji: [] });
    });
  });

  describe("POST /workspaces/:workspaceId/emoji", () => {
    it("creates an emoji", async () => {
      const chain = createChain({
        data: {
          id: "e-new",
          workspace_id: "ws-1",
          name: "wave",
          image_url: "https://example.com/wave.png",
          created_by: "user-1",
        },
        error: null,
      });

      const handler = findHandler("post", "/workspaces/:workspaceId/emoji");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        body: { name: "wave", imageUrl: "https://example.com/wave.png" },
        supabase: { from: vi.fn(() => chain) },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          emoji: expect.objectContaining({ name: "wave" }),
        }),
      );
    });

    it("returns 400 when name missing", async () => {
      const handler = findHandler("post", "/workspaces/:workspaceId/emoji");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        body: { imageUrl: "https://example.com/wave.png" },
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

    it("returns 400 when imageUrl missing", async () => {
      const handler = findHandler("post", "/workspaces/:workspaceId/emoji");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        body: { name: "wave" },
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

    it("sanitizes the emoji name", async () => {
      let insertedName = "";
      const chain = {
        select: vi.fn(() => chain),
        single: vi.fn(() => chain),
        then: (fn: (v: unknown) => unknown) =>
          Promise.resolve({ data: { id: "e-new", name: insertedName }, error: null }).then(fn),
      };

      const handler = findHandler("post", "/workspaces/:workspaceId/emoji");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        body: { name: "MY EMOJI!", imageUrl: "https://example.com/e.png" },
        supabase: {
          from: vi.fn(() => ({
            insert: vi.fn((data: any) => {
              insertedName = data.name;
              return chain;
            }),
            ...chain,
          })),
        },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(insertedName).toBe("myemoji");
    });

    it("returns 500 when create fails", async () => {
      const chain = createChain({ data: null, error: new Error("Duplicate emoji") });

      const handler = findHandler("post", "/workspaces/:workspaceId/emoji");
      const req = mockReq({
        params: { workspaceId: "ws-1" },
        body: { name: "wave", imageUrl: "https://example.com/wave.png" },
        supabase: { from: vi.fn(() => chain) },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("DELETE /emoji/:id", () => {
    it("deletes an emoji", async () => {
      let customEmojiCalls = 0;
      const from = vi.fn((table: string) => {
        if (table === "workspace_members")
          return createChain({ data: { role: "member" }, error: null });
        if (table === "custom_emoji") {
          customEmojiCalls++;
          if (customEmojiCalls === 1)
            return createChain({ data: { workspace_id: "ws-1" }, error: null });
          return createChain({ data: null, error: null });
        }
        return createChain({ data: [], error: null });
      });

      const handler = findHandler("delete", "/emoji/:id");
      const req = mockReq({
        params: { id: "e-1" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("returns 500 when delete fails", async () => {
      let customEmojiCalls = 0;
      const from = vi.fn((table: string) => {
        if (table === "workspace_members")
          return createChain({ data: { role: "member" }, error: null });
        if (table === "custom_emoji") {
          customEmojiCalls++;
          if (customEmojiCalls === 1)
            return createChain({ data: { workspace_id: "ws-1" }, error: null });
          return createChain({ data: null, error: new Error("DB error") });
        }
        return createChain({ data: [], error: null });
      });

      const handler = findHandler("delete", "/emoji/:id");
      const req = mockReq({
        params: { id: "e-1" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });
});
