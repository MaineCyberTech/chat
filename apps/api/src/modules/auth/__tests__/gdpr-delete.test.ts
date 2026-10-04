import { describe, it, expect, vi, beforeEach } from "vitest";
import authRouter from "../routes.js";

const mockAdminClient = {
  rpc: vi.fn(),
  auth: {
    signInWithPassword: vi.fn(),
    admin: { deleteUser: vi.fn() },
  },
};

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => ({})),
  getSupabaseAdmin: vi.fn(() => mockAdminClient),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../../lib/socket.js", () => ({
  getOnlineUsers: vi.fn(() => []),
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (authRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  res.setHeader = vi.fn(() => res) as any;
  return res as any;
}

const req = {
  userId: "user-1",
  userEmail: "test@example.com",
  body: { password: "correct-horse" },
} as any;

describe("DELETE /account (GDPR erasure)", () => {
  beforeEach(() => {
    mockAdminClient.rpc.mockReset();
    mockAdminClient.auth.signInWithPassword.mockReset();
    mockAdminClient.auth.admin.deleteUser.mockReset();
    mockAdminClient.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockAdminClient.rpc.mockResolvedValue({ data: { success: true, user_id: "user-1" }, error: null });
  });

  it("erases via a single atomic RPC and never calls auth.admin.deleteUser", async () => {
    const handler = findHandler("delete", "/account");
    expect(handler).toBeTruthy();
    const res = mockRes();
    const next = vi.fn();

    await handler(req, res, next);

    expect(mockAdminClient.rpc).toHaveBeenCalledTimes(1);
    expect(mockAdminClient.rpc).toHaveBeenCalledWith("gdpr_delete_user", { target_user_id: "user-1" });
    expect(mockAdminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("bubbles a rolled-back (success=false) erasure as an error so it can be retried", async () => {
    mockAdminClient.rpc.mockResolvedValueOnce({
      data: { success: false, user_id: "user-1", error: "fk violation" },
      error: null,
    });
    const handler = findHandler("delete", "/account");
    const res = mockRes();
    const next = vi.fn();

    await handler(req, res, next);

    expect(mockAdminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalledWith(204);
  });
});
