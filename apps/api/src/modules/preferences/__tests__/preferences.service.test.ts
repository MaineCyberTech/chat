import { describe, it, expect, vi, beforeEach } from "vitest";
import { PreferencesService } from "../service.js";

const mockClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => ({
          data: {
            user_id: "u1",
            theme: "dark",
            notification_prefs: {},
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
          error: null,
        })),
      })),
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            user_id: "u1",
            theme: "light",
            notification_prefs: {},
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
          error: null,
        })),
      })),
    })),
  })),
});

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => mockClient()),
}));

describe("PreferencesService", () => {
  let service: PreferencesService;

  beforeEach(() => {
    service = new PreferencesService();
  });

  it("gets user preferences", async () => {
    const prefs = await service.get("u1");
    expect(prefs).not.toBeNull();
    expect(prefs?.theme).toBe("dark");
  });

  it("upserts user preferences", async () => {
    const prefs = await service.upsert("u1", { theme: "light" });
    expect(prefs?.theme).toBe("light");
  });

  it("returns null on error when getting preferences", async () => {
    const mockFail = () => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({ data: null, error: new Error("DB error") })),
          })),
        })),
      })),
    });
    vi.mocked((await import("../../../lib/supabase.js")).getSupabase).mockImplementationOnce(
      mockFail as any,
    );
    const prefs = await service.get("u1");
    expect(prefs).toBeNull();
  });
});
