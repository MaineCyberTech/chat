import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../service.js";
import authRouter from "../routes.js";

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: "user-1",
              email: "test@example.com",
              display_name: "Tester",
              avatar_url: null,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
            error: null,
          })),
        })),
        or: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [
              { id: "user-1", email: "test@example.com", display_name: "Tester", avatar_url: null },
            ],
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: "user-1",
                email: "test@example.com",
                display_name: "Updated",
                avatar_url: null,
              },
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: "user-1",
              email: "test@example.com",
              display_name: "Tester",
              avatar_url: null,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
            error: null,
          })),
        })),
        or: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [
              { id: "user-1", email: "test@example.com", display_name: "Tester", avatar_url: null },
            ],
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: "user-1",
                email: "test@example.com",
                display_name: "Updated",
                avatar_url: null,
              },
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../../lib/socket.js", () => ({
  getOnlineUsers: vi.fn(() => ["user-1"]),
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

function mockReq(overrides: Record<string, unknown> = {}) {
  return { userId: "user-1", supabase: { from: vi.fn(), storage: { from: vi.fn() } }, body: {}, query: {}, ...overrides } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  res.setHeader = vi.fn(() => res) as any;
  return res as any;
}

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  describe("getUser", () => {
    it("returns a user by id", async () => {
      const user = await service.getUser("user-1");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("test@example.com");
    });
  });

  describe("getProfile", () => {
    it("returns a user profile", async () => {
      const profile = await service.getProfile("user-1");
      expect(profile).not.toBeNull();
      expect(profile?.display_name).toBe("Tester");
    });
  });

  describe("updateProfile", () => {
    it("updates and returns the profile", async () => {
      const profile = await service.updateProfile("user-1", { display_name: "Updated" });
      expect(profile?.display_name).toBe("Updated");
    });
  });

  describe("searchUsers", () => {
    it("returns matching users", async () => {
      const users = await service.searchUsers("test");
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe("test@example.com");
    });
  });
});

describe("Auth Routes", () => {
  it("GET /session returns user profile via authenticate middleware", async () => {
    const handler = findHandler("get", "/session");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ display_name: "Tester" }) }),
    );
  });

  it("POST /magic-link accepts valid email", async () => {
    const handler = findHandler("post", "/magic-link");
    expect(handler).toBeTruthy();
    const req = mockReq({ body: { email: "test@example.com" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  it("POST /magic-link rejects invalid email format", async () => {
    const handler = findHandler("post", "/magic-link");
    expect(handler).toBeTruthy();
    const req = mockReq({ body: { email: "bad" } });
    const res = mockRes();
    const next = vi.fn();
    res.json.mockClear();
    await handler(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("GET /online returns online users", async () => {
    const handler = findHandler("get", "/online");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ online: ["user-1"] });
  });

  it("GET /search requires authenticate middleware", async () => {
    const handler = findHandler("get", "/search");
    expect(handler).toBeTruthy();
    const req = mockReq({ query: { q: "test" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ profiles: expect.any(Array) }),
    );
  });

  it("PATCH /profile updates and returns profile", async () => {
    const handler = findHandler("patch", "/profile");
    expect(handler).toBeTruthy();
    const req = mockReq({ body: { display_name: "Updated" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ display_name: "Updated" }) }),
    );
  });
});
