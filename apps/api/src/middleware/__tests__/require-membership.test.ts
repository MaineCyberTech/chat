import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requireWorkspaceMembership,
  requireWorkspaceRole,
  requireChannelAccess,
} from "../require-membership.js";

type AnyObj = any;

vi.mock("../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(),
  })),
  getSupabaseForUser: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    userId: "user-1",
    supabase: undefined,
    ...overrides,
  } as AnyObj;
}

function mockRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as AnyObj;
}

describe("requireWorkspaceMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when workspaceId param is missing", async () => {
    const middleware = requireWorkspaceMembership("workspaceId");
    const req = mockReq({ params: {} });
    const res = mockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 500 when auth context is missing", async () => {
    const middleware = requireWorkspaceMembership("workspaceId");
    const req = mockReq({ params: { workspaceId: "ws-1" }, supabase: undefined });
    const res = mockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not a workspace member", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error("no rows") }),
            }),
          }),
        }),
      }),
    };

    const middleware = requireWorkspaceMembership("workspaceId");
    const req = mockReq({
      params: { workspaceId: "ws-1" },
      userId: "user-1",
      supabase: mockSupabase,
    });
    const res = mockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets workspaceRole and calls next when user is a member", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "member" }, error: null }),
            }),
          }),
        }),
      }),
    };

    const middleware = requireWorkspaceMembership("workspaceId");
    const req = mockReq({
      params: { workspaceId: "ws-1" },
      userId: "user-1",
      supabase: mockSupabase,
    });
    const res = mockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(req.workspaceRole).toBe("member");
    expect(next).toHaveBeenCalled();
  });
});

describe("requireWorkspaceRole", () => {
  it("returns 403 when workspaceRole is missing", () => {
    const middleware = requireWorkspaceRole("admin");
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when role is below minimum", () => {
    const middleware = requireWorkspaceRole("admin");
    const req = mockReq();
    (req as AnyObj).workspaceRole = "member";
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when role meets minimum (admin for admin)", () => {
    const middleware = requireWorkspaceRole("admin");
    const req = mockReq();
    (req as AnyObj).workspaceRole = "admin";
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("calls next when role exceeds minimum (owner for admin)", () => {
    const middleware = requireWorkspaceRole("admin");
    const req = mockReq();
    (req as AnyObj).workspaceRole = "owner";
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 403 when admin but owner is required", () => {
    const middleware = requireWorkspaceRole("owner");
    const req = mockReq();
    (req as AnyObj).workspaceRole = "admin";
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireChannelAccess", () => {
  it("returns 400 when channelId param is missing", async () => {
    const middleware = requireChannelAccess("channelId");
    const req = mockReq({ params: {} });
    const res = mockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 500 when auth context is missing", async () => {
    const middleware = requireChannelAccess("channelId");
    const req = mockReq({ params: { channelId: "ch-1" }, supabase: undefined });
    const res = mockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
