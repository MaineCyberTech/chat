import { describe, it, expect, vi } from "vitest";
import { PreferencesService } from "../service.js";

function mockSupabase(data: unknown, error: unknown = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => ({ data, error })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data, error })),
        })),
      })),
    })),
  } as any;
}

const successData = {
  user_id: "u1",
  theme: "dark",
  notification_prefs: {},
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

describe("PreferencesService", () => {
  let service: PreferencesService;

  it("gets user preferences", async () => {
    service = new PreferencesService();
    const supabase = mockSupabase(successData);
    const prefs = await service.get("u1", supabase);
    expect(prefs).not.toBeNull();
    expect(prefs?.theme).toBe("dark");
  });

  it("upserts user preferences", async () => {
    service = new PreferencesService();
    const supabase = mockSupabase({ ...successData, theme: "light" });
    const prefs = await service.upsert("u1", { theme: "light" }, supabase);
    expect(prefs?.theme).toBe("light");
  });

  it("returns null on error when getting preferences", async () => {
    service = new PreferencesService();
    const supabase = mockSupabase(null, new Error("DB error"));
    const prefs = await service.get("u1", supabase);
    expect(prefs).toBeNull();
  });
});
