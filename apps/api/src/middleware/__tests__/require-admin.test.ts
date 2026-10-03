import { describe, it, expect, vi } from "vitest";
import { BadRequestError, ForbiddenError } from "../../lib/app-error.js";
import { requireAdmin } from "../require-admin.js";

type AnyObj = any;

describe("requireAdmin middleware", () => {
  it("calls next with ForbiddenError when supabase is missing", async () => {
    const next = vi.fn();
    const req = { userId: "u1", supabase: undefined } as AnyObj;
    const _res = {} as AnyObj;

    try {
      if (!req.supabase) {
        next(new ForbiddenError("Auth context missing"));
        return;
      }
      next();
    } catch {
      next(new ForbiddenError("Admin access check failed"));
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(next.mock.calls[0][0].message).toBe("Auth context missing");
  });

  it("calls next with ForbiddenError when user lacks admin role", async () => {
    const mockResult = Promise.resolve({ data: [], error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockResult),
            }),
          }),
        }),
      }),
    };
    const next = vi.fn();
    const req = { userId: "u1", supabase } as AnyObj;
    const _res = {} as AnyObj;

    try {
      const supabase2 = req.supabase;
      if (!supabase2) {
        next(new ForbiddenError("Auth context missing"));
        return;
      }
      const { data, error } = await supabase2
        .from("workspace_members")
        .select("role")
        .eq("user_id", req.userId)
        .in("role", ["owner", "admin"])
        .limit(1);
      if (error || !data || data.length === 0) {
        next(new ForbiddenError("Admin access required"));
        return;
      }
      next();
    } catch {
      next(new ForbiddenError("Admin access check failed"));
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(next.mock.calls[0][0].message).toBe("Admin access required");
  });

  it("calls next() when user has admin role", async () => {
    const mockResult = Promise.resolve({ data: [{ role: "admin" }], error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockResult),
            }),
          }),
        }),
      }),
    };
    const next = vi.fn();
    const req = { userId: "u1", supabase } as AnyObj;
    const _res = {} as AnyObj;

    try {
      const supabase2 = req.supabase;
      if (!supabase2) {
        next(new ForbiddenError("Auth context missing"));
        return;
      }
      const { data, error } = await supabase2
        .from("workspace_members")
        .select("role")
        .eq("user_id", req.userId)
        .in("role", ["owner", "admin"])
        .limit(1);
      if (error || !data || data.length === 0) {
        next(new ForbiddenError("Admin access required"));
        return;
      }
      next();
    } catch {
      next(new ForbiddenError("Admin access check failed"));
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with ForbiddenError when db throws", async () => {
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        throw new Error("connection refused");
      }),
    };
    const next = vi.fn();
    const req = { userId: "u1", supabase } as AnyObj;
    const _res = {} as AnyObj;

    try {
      const supabase2 = req.supabase;
      if (!supabase2) {
        next(new ForbiddenError("Auth context missing"));
        return;
      }
      const { data, error } = await supabase2
        .from("workspace_members")
        .select("role")
        .eq("user_id", req.userId)
        .in("role", ["owner", "admin"])
        .limit(1);
      if (error || !data || data.length === 0) {
        next(new ForbiddenError("Admin access required"));
        return;
      }
      next();
    } catch {
      next(new ForbiddenError("Admin access check failed"));
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(next.mock.calls[0][0].message).toBe("Admin access check failed");
  });
});

describe("requireAdmin middleware (real implementation, ARCH-P3-005)", () => {
  function chain(result: unknown) {
    const c: AnyObj = {};
    for (const m of ["select", "eq", "in", "limit"]) {
      c[m] = vi.fn(() => c);
    }
    c.then = (onFulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onFulfilled);
    return c;
  }

  it("attaches every admin workspace id when asked, without limit(1)", async () => {
    const c = chain({
      data: [
        { workspace_id: "ws-1", role: "owner" },
        { workspace_id: "ws-2", role: "admin" },
      ],
      error: null,
    });
    const req = { userId: "u1", supabase: { from: vi.fn(() => c) }, params: {} } as AnyObj;
    const next = vi.fn();

    await requireAdmin(null, { attachWorkspaceIds: true })(req, {} as AnyObj, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.adminWorkspaceIds).toEqual(["ws-1", "ws-2"]);
    expect(c.select).toHaveBeenCalledWith("workspace_id, role");
    expect(c.limit).not.toHaveBeenCalled();
  });

  it("rejects a non-admin when attaching workspace ids", async () => {
    const c = chain({ data: [], error: null });
    const req = { userId: "u1", supabase: { from: vi.fn(() => c) }, params: {} } as AnyObj;
    const next = vi.fn();

    await requireAdmin(null, { attachWorkspaceIds: true })(req, {} as AnyObj, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(req.adminWorkspaceIds).toBeUndefined();
  });

  it("requires the named workspace param", async () => {
    const c = chain({ data: [], error: null });
    const req = { userId: "u1", supabase: { from: vi.fn(() => c) }, params: {} } as AnyObj;
    const next = vi.fn();

    await requireAdmin("workspaceId")(req, {} as AnyObj, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
  });

  it("keeps the role-only path limited to one membership", async () => {
    const c = chain({ data: [{ role: "admin" }], error: null });
    const req = { userId: "u1", supabase: { from: vi.fn(() => c) }, params: {} } as AnyObj;
    const next = vi.fn();

    await requireAdmin()(req, {} as AnyObj, next);

    expect(next).toHaveBeenCalledWith();
    expect(c.limit).toHaveBeenCalled();
  });
});
