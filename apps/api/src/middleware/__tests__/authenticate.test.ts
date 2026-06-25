import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate } from "../authenticate.js";

type AnyObj = any;

vi.mock("../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
  getSupabaseForUser: vi.fn(() => ({
    auth: { getUser: vi.fn() },
  })),
}));

vi.mock("../../lib/logger.js", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

function mockReq(headers: Record<string, string> = {}) {
  return {
    headers,
    requestId: "test-id",
    userId: undefined,
    userEmail: undefined,
    supabase: undefined,
  } as AnyObj;
}

function mockRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as AnyObj;
}

describe("authenticate middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no auth header", async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "UNAUTHORIZED" }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header is not Bearer", async () => {
    const req = mockReq({ authorization: "Basic abc" });
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when token is valid", async () => {
    const { getSupabase, getSupabaseForUser } = await import("../../lib/supabase.js");
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
      error: null,
    });
    const mockClient = { auth: { getUser: mockGetUser } };
    (getSupabase as AnyObj).mockReturnValue({ auth: { getUser: mockGetUser } });
    (getSupabaseForUser as AnyObj).mockReturnValue(mockClient);

    const req = mockReq({ authorization: "Bearer valid-token" });
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(req.userId).toBe("user-1");
    expect(req.userEmail).toBe("test@example.com");
    expect(req.supabase).toBe(mockClient);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when token is rejected by Supabase", async () => {
    const { getSupabase } = await import("../../lib/supabase.js");
    (getSupabase as AnyObj).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("invalid") }),
      },
    });

    const req = mockReq({ authorization: "Bearer bad-token" });
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
