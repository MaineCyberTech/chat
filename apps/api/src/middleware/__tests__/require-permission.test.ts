import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermission } from "../require-permission.js";

type AnyObj = any;

vi.mock("@chat/db", () => ({
  hasPermission: vi.fn(),
}));

function mockReq(workspaceRole?: string) {
  return {
    workspaceRole,
  } as AnyObj;
}

function mockRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as AnyObj;
}

describe("requirePermission middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when no workspaceRole is set", () => {
    const middleware = requirePermission("channel:create");
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "FORBIDDEN" }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when role lacks the required permission", async () => {
    const { hasPermission } = await import("@chat/db");
    (hasPermission as AnyObj).mockReturnValue(false);

    const middleware = requirePermission("workspace:delete");
    const req = mockReq("member");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(hasPermission).toHaveBeenCalledWith("member", "workspace:delete");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when role has the required permission", async () => {
    const { hasPermission } = await import("@chat/db");
    (hasPermission as AnyObj).mockReturnValue(true);

    const middleware = requirePermission("channel:create");
    const req = mockReq("member");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(hasPermission).toHaveBeenCalledWith("member", "channel:create");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next for owner with any permission", async () => {
    const { hasPermission } = await import("@chat/db");
    (hasPermission as AnyObj).mockReturnValue(true);

    const middleware = requirePermission("workspace:delete");
    const req = mockReq("owner");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(hasPermission).toHaveBeenCalledWith("owner", "workspace:delete");
    expect(next).toHaveBeenCalled();
  });

  it("blocks admin from workspace:delete", async () => {
    const { hasPermission } = await import("@chat/db");
    (hasPermission as AnyObj).mockReturnValue(false);

    const middleware = requirePermission("workspace:delete");
    const req = mockReq("admin");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(hasPermission).toHaveBeenCalledWith("admin", "workspace:delete");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
