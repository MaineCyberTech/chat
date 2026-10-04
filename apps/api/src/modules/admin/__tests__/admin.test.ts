import { describe, it, expect, vi, beforeEach } from "vitest";
import adminRouter from "../routes.js";

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseAdmin: vi.fn(),
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
    "range",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (onfulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onfulfilled);
  return chain;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  const membershipChain = createChain({
    data: [{ workspace_id: "ws-1", role: "owner" }],
    error: null,
  });
  return {
    userId: "user-1",
    supabase: { from: vi.fn(() => membershipChain) },
    query: {},
    body: {},
    params: {},
    headers: { authorization: "Bearer token" },
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
  for (const layer of (adminRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

describe("admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /stats", () => {
    it("returns aggregated stats", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const userChain = createChain({ count: 10, error: null });
      const workspaceChain = createChain({ count: 3, error: null });
      const channelChain = createChain({ count: 15, error: null });
      const messageChain = createChain({ count: 200, error: null });
      const from = vi
        .fn()
        .mockReturnValueOnce(userChain)
        .mockReturnValueOnce(workspaceChain)
        .mockReturnValueOnce(channelChain)
        .mockReturnValueOnce(messageChain);
      (getSupabaseAdmin as any).mockReturnValue({ from });

      const handler = findHandler("get", "/stats");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        stats: { users: 10, workspaces: 3, channels: 15, messages: 200 },
      });
    });

    it("returns 500 on error", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const from = vi.fn(() => ({
        select: vi.fn(() => {
          throw new Error("DB fail");
        }),
      }));
      (getSupabaseAdmin as any).mockReturnValue({ from });

      const handler = findHandler("get", "/stats");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("GET /users", () => {
    it("lists users with pagination", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({
        data: [{ id: "u1", email: "a@b.com", display_name: "Alice" }],
        count: 1,
        error: null,
      });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/users");
      const req = mockReq({ query: { page: "1" } });
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          users: expect.arrayContaining([expect.objectContaining({ display_name: "Alice" })]),
          total: 1,
          page: 1,
          limit: 20,
        }),
      );
    });

    it("defaults to page 0 when no page param", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ data: [], count: 0, error: null });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/users");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
    });

    it("searches users by query", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({
        data: [{ id: "u2", email: "b@c.com", display_name: "Bob" }],
        count: 1,
        error: null,
      });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/users");
      const req = mockReq({ query: { search: "bob" } });
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(chain.or).toHaveBeenCalledWith(expect.stringContaining("bob"));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          users: expect.arrayContaining([expect.objectContaining({ display_name: "Bob" })]),
        }),
      );
    });

    it("quotes filter syntax in admin user search so it cannot alter the filter", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const membersChain = createChain({ data: [{ user_id: "u1" }], error: null });
      const usersChain = createChain({ data: [], count: 0, error: null });
      const from = vi.fn().mockReturnValueOnce(membersChain).mockReturnValueOnce(usersChain);
      (getSupabaseAdmin as any).mockReturnValue({ from });

      const handler = findHandler("get", "/users");
      const req = mockReq({ adminWorkspaceIds: ["ws-1"], query: { search: "a,b(c)" } });
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(usersChain.or).toHaveBeenCalledWith(
        'email.ilike."%a,b(c)%",display_name.ilike."%a,b(c)%"',
      );
    });

    it("scopes the directory to members of the caller's admin workspaces", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const membersChain = createChain({ data: [{ user_id: "u1" }, { user_id: "u2" }], error: null });
      const usersChain = createChain({
        data: [{ id: "u1", email: "a@b.com", display_name: "Alice" }],
        count: 1,
        error: null,
      });
      const from = vi.fn().mockReturnValueOnce(membersChain).mockReturnValueOnce(usersChain);
      (getSupabaseAdmin as any).mockReturnValue({ from });

      const handler = findHandler("get", "/users");
      const req = mockReq({ adminWorkspaceIds: ["ws-1"] });
      const res = mockRes();
      await handler(req, res, vi.fn());

      expect(membersChain.in).toHaveBeenCalledWith("workspace_id", ["ws-1"]);
      expect(usersChain.in).toHaveBeenCalledWith("id", ["u1", "u2"]);
    });

    it("returns an empty directory when the caller has no admin workspaces", async () => {
      const handler = findHandler("get", "/users");
      const req = mockReq({ adminWorkspaceIds: [] });
      const res = mockRes();
      await handler(req, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith({ users: [], total: 0, page: 0, limit: 20 });
    });
  });

  describe("GET /audit-logs", () => {
    it("rejects requests without a workspaceId", async () => {
      const handler = findHandler("get", "/audit-logs");
      const req = mockReq({ adminWorkspaceIds: ["ws-1"] });
      const res = mockRes();
      await handler(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: "BAD_REQUEST" }) }),
      );
    });

    it("rejects a workspace the caller does not administer", async () => {
      const handler = findHandler("get", "/audit-logs");
      const req = mockReq({ adminWorkspaceIds: ["ws-1"], query: { workspaceId: "ws-2" } });
      const res = mockRes();
      const next = vi.fn();
      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it("scopes logs to the requested administered workspace", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ data: [], count: 0, error: null });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/audit-logs");
      const req = mockReq({ adminWorkspaceIds: ["ws-1"], query: { workspaceId: "ws-1" } });
      const res = mockRes();
      await handler(req, res, vi.fn());

      expect(chain.eq).toHaveBeenCalledWith("organization_id", "ws-1");
    });
  });

  describe("GET /exports", () => {
    it("scopes compliance exports to the caller's admin workspaces", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ data: [], error: null });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/exports");
      const req = mockReq({ adminWorkspaceIds: ["ws-1"] });
      const res = mockRes();
      await handler(req, res, vi.fn());

      expect(chain.in).toHaveBeenCalledWith("workspace_id", ["ws-1"]);
    });
  });

  describe("GET /exports/:id/download", () => {
    it("scopes the download lookup to the caller's admin workspaces", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({
        data: {
          csv_content: "a,b",
          type: "messages",
          date_from: "2026-01-01",
          date_to: "2026-01-02",
          status: "completed",
        },
        error: null,
      });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/exports/:id/download");
      const req = mockReq({ adminWorkspaceIds: ["ws-1"], params: { id: "exp-2" } });
      const res = mockRes();
      await handler(req, res, vi.fn());

      expect(chain.eq).toHaveBeenCalledWith("id", "exp-2");
      expect(chain.in).toHaveBeenCalledWith("workspace_id", ["ws-1"]);
    });
  });

  describe("GET /channels", () => {
    it("lists channels with pagination", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({
        data: [{ id: "ch1", name: "general", workspaces: { name: "Main", slug: "main" } }],
        count: 1,
        error: null,
      });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/channels");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          channels: expect.arrayContaining([expect.objectContaining({ name: "general" })]),
          total: 1,
        }),
      );
    });

    it("returns 500 on query error", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ data: null, count: null, error: new Error("fail") });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/channels");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 500, code: "INTERNAL_SERVER_ERROR" }),
      );
    });
  });

  describe("GET /workspaces", () => {
    it("lists workspaces with member counts", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({
        data: [{ id: "ws1", name: "Team", workspace_members: [{ count: 5 }] }],
        error: null,
      });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/workspaces");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaces: expect.arrayContaining([expect.objectContaining({ name: "Team" })]),
        }),
      );
    });

    it("returns 500 on query error", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ data: null, error: new Error("fail") });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/workspaces");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 500, code: "INTERNAL_SERVER_ERROR" }),
      );
    });
  });

  describe("GET /system", () => {
    it("returns system info with db status", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ count: 5, error: null });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/system");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          version: expect.any(String),
          environment: expect.any(String),
          uptime_seconds: expect.any(Number),
          database: "connected",
          db_latency_ms: expect.any(Number),
          timestamp: expect.any(String),
        }),
      );
    });

    it("reports db unreachable on error", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ count: null, error: new Error("DB down") });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/system");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          database: "unreachable",
        }),
      );
    });
  });

  describe("GET /integrations", () => {
    it("lists integrations", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({
        data: [
          {
            id: "wh1",
            url: "https://hook.example.com",
            workspaces: { name: "Team", slug: "team" },
          },
        ],
        error: null,
      });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/integrations");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          integrations: expect.arrayContaining([expect.objectContaining({ id: "wh1" })]),
        }),
      );
    });

    it("returns 500 on query error", async () => {
      const { getSupabaseAdmin } = await import("../../../lib/supabase.js");
      const chain = createChain({ data: null, error: new Error("fail") });
      (getSupabaseAdmin as any).mockReturnValue({ from: vi.fn(() => chain) });

      const handler = findHandler("get", "/integrations");
      const req = mockReq();
      const res = mockRes();
      const next = vi.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 500, code: "INTERNAL_SERVER_ERROR" }),
      );
    });
  });
});
