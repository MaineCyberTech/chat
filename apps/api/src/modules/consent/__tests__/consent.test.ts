import { describe, it, expect, vi, beforeEach } from "vitest";
import consentRouter from "../routes.js";
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
    headers: { "user-agent": "TestAgent/1.0" },
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
  for (const layer of (consentRouter as any).stack) {
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

describe("consent routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /consent", () => {
    it("lists consent records", async () => {
      const listChain = createChain({
        data: [
          { id: "c1", user_id: "user-1", consent_type: "cookies", granted: true, created_at: "2024-01-01T00:00:00Z" },
        ],
        error: null,
      });
      const from = vi.fn(() => listChain);

      const handler = findHandler("get", "/consent");
      const req = mockReq({ supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          consents: expect.arrayContaining([
            expect.objectContaining({ consent_type: "cookies", granted: true }),
          ]),
        }),
      );
    });

    it("returns empty array when no consents", async () => {
      const listChain = createChain({ data: [], error: null });
      const from = vi.fn(() => listChain);

      const handler = findHandler("get", "/consent");
      const req = mockReq({ supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ consents: [] });
    });
  });

  describe("POST /consent", () => {
    it("creates a consent record", async () => {
      const insertChain = createChain({
        data: { id: "c-new", user_id: "user-1", consent_type: "analytics", granted: true },
        error: null,
      });
      const from = vi.fn(() => insertChain);

      const handler = findHandler("post", "/consent");
      const req = mockReq({
        body: { consent_type: "analytics", granted: true },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          consent: expect.objectContaining({ consent_type: "analytics", granted: true }),
        }),
      );
    });

    it("returns 400 when consent_type missing", async () => {
      const handler = findHandler("post", "/consent");
      const req = mockReq({ body: { granted: true } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when granted missing", async () => {
      const handler = findHandler("post", "/consent");
      const req = mockReq({ body: { consent_type: "analytics" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for invalid consent_type", async () => {
      const handler = findHandler("post", "/consent");
      const req = mockReq({ body: { consent_type: "invalid", granted: true } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
