import { describe, it, expect, vi, beforeEach } from "vitest";
import auditRouter from "../routes.js";

vi.mock("../../../middleware/authenticate.js", () => ({
  authenticate: vi.fn((req: any, _res: any, next: any) => {
    req.userId ??= "user-1";
    req.supabase ??= { from: vi.fn() };
    next();
  }),
}));

vi.mock("../../../middleware/validate-uuid.js", () => ({
  validateUuidParam: vi.fn(() => (_req: any, _res: any, next: any) => next()),
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
    "range", "gte",
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
  for (const layer of (auditRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

describe("audit routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /audit/logs", () => {
    const sampleLogs = [
      { id: "11111111-1111-1111-1111-111111111001", action: "workspace.created", actor_user_id: "user-1", entity_type: "workspace", organization_id: "ws-1", created_at: "2026-07-01T00:00:00Z" },
      { id: "11111111-1111-1111-1111-111111111002", action: "channel.created", actor_user_id: "user-2", entity_type: "channel", organization_id: "ws-1", created_at: "2026-07-02T00:00:00Z" },
    ];

    it("returns audit logs with total count", async () => {
      const chain = createChain({ data: sampleLogs, error: null, count: 2 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(from).toHaveBeenCalledWith("audit_logs");
      expect(res.json).toHaveBeenCalledWith({ logs: sampleLogs, total: 2 });
    });

    it("filters by workspaceId", async () => {
      const chain = createChain({ data: [sampleLogs[0]], error: null, count: 1 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ query: { workspaceId: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(from).toHaveBeenCalledWith("audit_logs");
      expect(res.json).toHaveBeenCalledWith({ logs: [sampleLogs[0]], total: 1 });
    });

    it("filters by actorUserId", async () => {
      const chain = createChain({ data: [sampleLogs[1]], error: null, count: 1 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ query: { actorUserId: "user-2" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ logs: [sampleLogs[1]], total: 1 });
    });

    it("filters by action", async () => {
      const chain = createChain({ data: [sampleLogs[0]], error: null, count: 1 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ query: { action: "workspace.created" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ logs: [sampleLogs[0]], total: 1 });
    });

    it("filters by entityType", async () => {
      const chain = createChain({ data: [sampleLogs[1]], error: null, count: 1 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ query: { entityType: "channel" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ logs: [sampleLogs[1]], total: 1 });
    });

    it("filters by date range", async () => {
      const chain = createChain({ data: [sampleLogs[0]], error: null, count: 1 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ query: { dateFrom: "2026-07-01T00:00:00Z", dateTo: "2026-07-01T23:59:59Z" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ logs: [sampleLogs[0]], total: 1 });
    });

    it("applies pagination parameters", async () => {
      const chain = createChain({ data: [sampleLogs[0]], error: null, count: 1 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ query: { limit: "10", offset: "20" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ logs: [sampleLogs[0]], total: 1 });
    });

    it("returns empty array when no logs exist", async () => {
      const chain = createChain({ data: [], error: null, count: 0 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ logs: [], total: 0 });
    });

    it("returns 500 when query fails", async () => {
      const chain = createChain({ data: null, error: { message: "DB connection failed" }, count: 0 });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "QUERY_FAILED" }),
        }),
      );
    });

    it("returns 500 when supabase context is missing", async () => {
      const handler = findHandler("get", "/audit/logs");
      const req = mockReq({ supabase: undefined });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "AUTH_ERROR" }),
        }),
      );
    });
  });

  describe("GET /audit/logs/:id", () => {
    const sampleLog = { id: "11111111-1111-1111-1111-111111111001", action: "workspace.created", actor_user_id: "user-1", entity_type: "workspace", organization_id: "ws-1", created_at: "2026-07-01T00:00:00Z" };

    it("returns a single audit log", async () => {
      const chain = createChain({ data: sampleLog, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs/:id");
      const req = mockReq({
        params: { id: "11111111-1111-1111-1111-111111111001" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ log: sampleLog });
    });

    it("returns 404 when log not found", async () => {
      const chain = createChain({ data: null, error: { message: "Not found" } });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/audit/logs/:id");
      const req = mockReq({
        params: { id: "11111111-1111-1111-1111-111111111999" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "NOT_FOUND" }),
        }),
      );
    });

    it("returns 500 when supabase context is missing", async () => {
      const handler = findHandler("get", "/audit/logs/:id");
      const req = mockReq({
        params: { id: "11111111-1111-1111-1111-111111111001" },
        supabase: undefined,
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "AUTH_ERROR" }),
        }),
      );
    });
  });
});
