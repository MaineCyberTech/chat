import { describe, it, expect, vi, beforeEach } from "vitest";
import groupsRouter from "../routes.js";
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
  for (const layer of (groupsRouter as any).stack) {
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

describe("groups routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /workspaces/:workspaceId/groups", () => {
    it("lists groups for a workspace", async () => {
      const chain = createChain({
        data: [
          {
            id: "g-1",
            workspace_id: "ws-1",
            name: "engineering",
            display_name: "Engineering",
            user_group_members: [],
          },
          {
            id: "g-2",
            workspace_id: "ws-1",
            name: "design",
            display_name: "Design",
            user_group_members: [],
          },
        ],
        error: null,
      });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/workspaces/:workspaceId/groups");
      const req = mockReq({ params: { workspaceId: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(from).toHaveBeenCalledWith("user_groups");
      expect(res.json).toHaveBeenCalledWith({
        groups: expect.arrayContaining([
          expect.objectContaining({ name: "engineering", display_name: "Engineering" }),
          expect.objectContaining({ name: "design", display_name: "Design" }),
        ]),
      });
    });

    it("returns empty array when no groups exist", async () => {
      const chain = createChain({ data: [], error: null });
      const from = vi.fn(() => chain);

      const handler = findHandler("get", "/workspaces/:workspaceId/groups");
      const req = mockReq({ params: { workspaceId: "ws-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.json).toHaveBeenCalledWith({ groups: [] });
    });
  });

  describe("POST /workspaces/:workspaceId/groups", () => {
    it("returns 400 when name missing", async () => {
      const handler = findHandler("post", "/workspaces/:workspaceId/groups");
      const req = mockReq({
        body: { displayName: "Engineering" },
        params: { workspaceId: "ws-1" },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: { code: "BAD_REQUEST", message: "name and displayName required" },
      });
    });

    it("returns 400 when displayName missing", async () => {
      const handler = findHandler("post", "/workspaces/:workspaceId/groups");
      const req = mockReq({ body: { name: "Engineering" }, params: { workspaceId: "ws-1" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("creates a group and lowercases slug", async () => {
      const insertChain = createChain({
        data: {
          id: "g-1",
          workspace_id: "ws-1",
          name: "engineering",
          display_name: "Engineering Team",
        },
        error: null,
      });
      const from = vi.fn(() => insertChain);

      const handler = findHandler("post", "/workspaces/:workspaceId/groups");
      const req = mockReq({
        body: { name: "Engineering Team", displayName: "Engineering Team" },
        params: { workspaceId: "ws-1" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          group: expect.objectContaining({ name: "engineering", display_name: "Engineering Team" }),
        }),
      );
    });

    it("creates a group with memberIds", async () => {
      const insertChain = createChain({
        data: { id: "g-1", workspace_id: "ws-1", name: "engineering", display_name: "Engineering" },
        error: null,
      });
      const memberChain = createChain({ error: null });
      const from = vi.fn().mockReturnValueOnce(insertChain).mockReturnValueOnce(memberChain);

      const handler = findHandler("post", "/workspaces/:workspaceId/groups");
      const req = mockReq({
        body: { name: "Engineering", displayName: "Engineering", memberIds: ["user-2", "user-3"] },
        params: { workspaceId: "ws-1" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(from).toHaveBeenCalledTimes(2);
    });

    it("creates a group without memberIds", async () => {
      const insertChain = createChain({
        data: { id: "g-1", workspace_id: "ws-1", name: "engineering", display_name: "Engineering" },
        error: null,
      });
      const from = vi.fn(() => insertChain);

      const handler = findHandler("post", "/workspaces/:workspaceId/groups");
      const req = mockReq({
        body: { name: "Engineering", displayName: "Engineering" },
        params: { workspaceId: "ws-1" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(from).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /groups/:id/members", () => {
    it("returns 400 when userIds missing", async () => {
      const handler = findHandler("post", "/groups/:id/members");
      const req = mockReq({ body: {}, params: { id: "g-1" } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: { code: "BAD_REQUEST", message: "userIds required" },
      });
    });

    it("adds members to a group", async () => {
      const from = vi.fn(() => createChain({ error: null }));

      const handler = findHandler("post", "/groups/:id/members");
      const req = mockReq({
        body: { userIds: ["user-2", "user-3"] },
        params: { id: "g-1" },
        supabase: { from },
      });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe("DELETE /groups/:id/members/:userId", () => {
    it("removes a member from a group", async () => {
      const from = vi.fn(() => createChain({ error: null }));

      const handler = findHandler("delete", "/groups/:id/members/:userId");
      const req = mockReq({ params: { id: "g-1", userId: "user-2" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("DELETE /groups/:id", () => {
    it("deletes a group", async () => {
      const from = vi.fn(() => createChain({ error: null }));

      const handler = findHandler("delete", "/groups/:id");
      const req = mockReq({ params: { id: "g-1" }, supabase: { from } });
      const res = mockRes();

      await callHandler(handler, req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
