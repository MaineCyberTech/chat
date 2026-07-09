import { describe, it, expect, vi, beforeEach } from "vitest";
import statusRouter from "../routes.js";
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
  for (const layer of (statusRouter as any).stack) {
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

describe("status routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /status", () => {
    it("returns null when no status set", async () => {
      const { getSupabase } = await import("../../../lib/supabase.js");
      const from = vi.fn(() => createChain({ data: null, error: null }));
      (getSupabase as any).mockReturnValue({ from });

      const handler = findHandler("get", "/status");
      const req = mockReq();
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ status: null });
    });
  });

  describe("PUT /status", () => {
    it("sets a status with emoji and text", async () => {
      const { getSupabase } = await import("../../../lib/supabase.js");
      const insertChain = createChain({
        data: { user_id: "user-1", emoji: "smile", text: "Happy", expires_at: null },
        error: null,
      });
      const from = vi.fn(() => insertChain);
      (getSupabase as any).mockReturnValue({ from });

      const handler = findHandler("put", "/status");
      const req = mockReq({ body: { emoji: "smile", text: "Happy" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.objectContaining({ emoji: "smile", text: "Happy" }),
        }),
      );
    });

    it("returns 400 when text exceeds 100 chars", async () => {
      const handler = findHandler("put", "/status");
      const req = mockReq({ body: { text: "x".repeat(101) } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("sets a status with duration", async () => {
      const { getSupabase } = await import("../../../lib/supabase.js");
      const insertChain = createChain({
        data: {
          user_id: "user-1",
          emoji: "speech_balloon",
          text: "Busy",
          expires_at: expect.any(String),
        },
        error: null,
      });
      const from = vi.fn(() => insertChain);
      (getSupabase as any).mockReturnValue({ from });

      const handler = findHandler("put", "/status");
      const req = mockReq({ body: { duration: "1h" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.objectContaining({ emoji: "speech_balloon", text: "Busy" }),
        }),
      );
    });
  });

  describe("DELETE /status", () => {
    it("clears status and returns 204", async () => {
      const { getSupabase } = await import("../../../lib/supabase.js");
      const deleteChain = createChain({ data: null, error: null });
      const from = vi.fn(() => deleteChain);
      (getSupabase as any).mockReturnValue({ from });

      const handler = findHandler("delete", "/status");
      const req = mockReq();
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("POST /status/batch", () => {
    it("returns statuses for user ids", async () => {
      const { getSupabase } = await import("../../../lib/supabase.js");
      const batchChain = createChain({
        data: [
          { user_id: "user-1", emoji: "wave", text: "Hello" },
          { user_id: "user-2", emoji: "coffee", text: "Break" },
        ],
        error: null,
      });
      const from = vi.fn(() => batchChain);
      (getSupabase as any).mockReturnValue({ from });

      const handler = findHandler("post", "/status/batch");
      const req = mockReq({ body: { userIds: ["user-1", "user-2"] } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: expect.objectContaining({
            "user-1": expect.objectContaining({ emoji: "wave" }),
          }),
        }),
      );
    });

    it("returns empty map when no userIds", async () => {
      const handler = findHandler("post", "/status/batch");
      const req = mockReq({ body: { userIds: [] } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ statuses: {} });
    });
  });
});
