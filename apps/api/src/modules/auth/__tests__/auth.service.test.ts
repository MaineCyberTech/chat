import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../service.js";

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
