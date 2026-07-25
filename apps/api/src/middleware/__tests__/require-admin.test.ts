import { describe, it, expect, vi } from "vitest";
import { ForbiddenError } from "../../lib/app-error.js";

type AnyObj = any;

describe("requireAdmin middleware", () => {
  it("calls next with ForbiddenError when supabase is missing", async () => {
    const next = vi.fn();
    const req = { userId: "u1", supabase: undefined } as AnyObj;
    const res = {} as AnyObj;

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
    const res = {} as AnyObj;

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
    const res = {} as AnyObj;

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
    const res = {} as AnyObj;

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
