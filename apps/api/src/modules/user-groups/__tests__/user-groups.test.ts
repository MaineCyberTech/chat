import { describe, it, expect, vi, beforeEach } from "vitest";
import userGroupsRouter from "../routes.js";
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

type MockChain = { [key: string]: any; then: (fn: (v: unknown) => unknown) => Promise<unknown> };

function createChain(result: unknown): MockChain {
  const chain: any = {};
  for (const m of [
    "select", "eq", "in", "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete", "is", "or", "gt", "lt", "contains", "lte",
    "range",
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
  for (const layer of (userGroupsRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      const handle = layer.route.stack[layer.route.stack.length - 1].handle;
      return async (req: any, res: any) => {
        const next = vi.fn();
        await handle(req, res, next);
        if (next.mock.calls.length > 0) {
          const err = next.mock.calls[0][0];
          errorHandler(err, req, res, vi.fn());
        }
      };
    }
  }
  return null;
}

describe("user-groups routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("lists groups in a workspace", async () => {
      const groups = [
        { id: "g-1", workspace_id: "ws-1", name: "engineering", description: "Engineering team", created_by: "user-1", user_group_members: [{ count: 3 }] },
        { id: "g-2", workspace_id: "ws-1", name: "design", description: "Design team", created_by: "user-2", user_group_members: [{ count: 2 }] },
      ];
      const chain = createChain({ data: groups, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/");
      const req = mockReq({ query: { workspace_id: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(from).toHaveBeenCalledWith("user_groups");
      expect(res.json).toHaveBeenCalledWith({ groups });
    });

    it("returns 400 when workspace_id missing", async () => {
      const handler = findHandler("get", "/");
      const req = mockReq();
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns empty array when no groups exist", async () => {
      const chain = createChain({ data: [], error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/");
      const req = mockReq({ query: { workspace_id: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ groups: [] });
    });

    it("returns 500 when query fails", async () => {
      const memberChain = createChain({ data: { role: "admin" }, error: null });
      const queryChain = createChain({ data: null, error: { message: "DB error" } });
      const from = vi.fn().mockReturnValueOnce(memberChain).mockReturnValueOnce(queryChain);

      const handler = findHandler("get", "/");
      const req = mockReq({ query: { workspace_id: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("POST /", () => {
    it("creates a group", async () => {
      const newGroup = { id: "g-new", workspace_id: "ws-1", name: "Engineering", created_by: "user-1", description: "" };
      const chain = createChain({ data: newGroup, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { workspace_id: "ws-1", name: "Engineering" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ group: newGroup });
    });

    it("creates a group with description", async () => {
      const newGroup = { id: "g-new", workspace_id: "ws-1", name: "Engineering", description: "Team description", created_by: "user-1" };
      const chain = createChain({ data: newGroup, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { workspace_id: "ws-1", name: "Engineering", description: "Team description" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ group: expect.objectContaining({ description: "Team description" }) });
    });

    it("creates a group with member_ids", async () => {
      const membershipChain = createChain({ data: { role: "admin" }, error: null });
      const insertChain = createChain({
        data: { id: "g-new", workspace_id: "ws-1", name: "Engineering", created_by: "user-1" },
        error: null,
      });
      const memberInsertChain = createChain({ error: null });
      const from = vi.fn()
        .mockReturnValueOnce(membershipChain)
        .mockReturnValueOnce(insertChain)
        .mockReturnValueOnce(memberInsertChain);

      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { workspace_id: "ws-1", name: "Engineering", member_ids: ["user-2", "user-3"] },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(from).toHaveBeenCalledTimes(3);
    });

    it("returns 400 when workspace_id missing", async () => {
      const handler = findHandler("post", "/");
      const req = mockReq({ body: { name: "Engineering" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns 400 when name missing", async () => {
      const handler = findHandler("post", "/");
      const req = mockReq({ body: { workspace_id: "ws-1" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns 500 when insert fails", async () => {
      const memberChain = createChain({ data: { role: "admin" }, error: null });
      const insertChain = createChain({ data: null, error: { message: "Duplicate name" } });
      const from = vi.fn().mockReturnValueOnce(memberChain).mockReturnValueOnce(insertChain);

      const handler = findHandler("post", "/");
      const req = mockReq({
        body: { workspace_id: "ws-1", name: "Engineering" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("PATCH /:id", () => {
    it("updates group name", async () => {
      const updated = { id: "g-1", name: "Renamed", description: "Original desc" };
      const chain = createChain({ data: updated, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("patch", "/:id");
      const req = mockReq({
        params: { id: "g-1" },
        body: { name: "Renamed" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ group: updated });
    });

    it("updates group description", async () => {
      const updated = { id: "g-1", name: "Engineering", description: "New description" };
      const chain = createChain({ data: updated, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("patch", "/:id");
      const req = mockReq({
        params: { id: "g-1" },
        body: { description: "New description" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ group: updated });
    });

    it("returns 500 when update fails", async () => {
      const chain = createChain({ data: null, error: { message: "Not found" } });
      const from = vi.fn(() => chain);

      const handler = findHandler("patch", "/:id");
      const req = mockReq({
        params: { id: "g-999" },
        body: { name: "Renamed" },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("DELETE /:id", () => {
    it("deletes a group", async () => {
      const chain = createChain({ error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("delete", "/:id");
      const req = mockReq({ params: { id: "g-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("returns 500 when delete fails", async () => {
      const chain = createChain({ error: { message: "Not found" } });
      const from = vi.fn(() => chain);

      const handler = findHandler("delete", "/:id");
      const req = mockReq({ params: { id: "g-999" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("GET /:id/members", () => {
    it("lists group members", async () => {
      const members = [
        { group_id: "g-1", user_id: "user-2", users: { email: "user2@test.com", display_name: "User Two" } },
        { group_id: "g-1", user_id: "user-3", users: { email: "user3@test.com", display_name: "User Three" } },
      ];
      const chain = createChain({ data: members, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/:id/members");
      const req = mockReq({ params: { id: "g-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(from).toHaveBeenCalledWith("user_group_members");
      expect(res.json).toHaveBeenCalledWith({ members });
    });

    it("returns 500 when query fails", async () => {
      const chain = createChain({ data: null, error: { message: "DB error" } });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/:id/members");
      const req = mockReq({ params: { id: "g-1" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("POST /:id/members", () => {
    it("adds members to a group", async () => {
      const newMembers = [
        { group_id: "g-1", user_id: "user-2" },
        { group_id: "g-1", user_id: "user-3" },
      ];
      const chain = createChain({ data: newMembers, error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("post", "/:id/members");
      const req = mockReq({
        params: { id: "g-1" },
        body: { user_ids: ["user-2", "user-3"] },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ members: newMembers });
    });

    it("returns 400 when user_ids missing", async () => {
      const handler = findHandler("post", "/:id/members");
      const req = mockReq({
        params: { id: "g-1" },
        body: {},
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns 400 when user_ids is not an array", async () => {
      const handler = findHandler("post", "/:id/members");
      const req = mockReq({
        params: { id: "g-1" },
        body: { user_ids: "not-an-array" },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns 500 when insert fails", async () => {
      const chain = createChain({ data: null, error: { message: "Duplicate member" } });
      const from = vi.fn(() => chain);

      const handler = findHandler("post", "/:id/members");
      const req = mockReq({
        params: { id: "g-1" },
        body: { user_ids: ["user-2"] },
        supabase: { from },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("DELETE /:id/members/:userId", () => {
    it("removes a member from a group", async () => {
      const chain = createChain({ error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("delete", "/:id/members/:userId");
      const req = mockReq({ params: { id: "g-1", userId: "user-2" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("returns 500 when delete fails", async () => {
      const chain = createChain({ error: { message: "Not found" } });
      const from = vi.fn(() => chain);

      const handler = findHandler("delete", "/:id/members/:userId");
      const req = mockReq({ params: { id: "g-1", userId: "user-999" }, supabase: { from } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });
});
