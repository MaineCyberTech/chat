import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReactionService } from "../service.js";

function mockSupabase() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [
            { id: "r1", message_id: "m1", user_id: "u1", emoji: "👍", created_at: "2024-01-01" },
          ],
          error: null,
        })),
        in: vi.fn(() => ({
          data: [
            { id: "r1", message_id: "m1", user_id: "u1", emoji: "👍", created_at: "2024-01-01" },
          ],
          error: null,
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: "r-new",
              message_id: "m1",
              user_id: "u1",
              emoji: "🎉",
              created_at: "2024-01-01",
            },
            error: null,
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        })),
      })),
    })),
  };
}

const sb = mockSupabase() as any;

describe("ReactionService", () => {
  let service: ReactionService;

  beforeEach(() => {
    service = new ReactionService();
  });

  it("gets reactions by message id", async () => {
    const reactions = await service.getByMessage("m1", sb);
    expect(reactions).toHaveLength(1);
    expect(reactions[0].emoji).toBe("👍");
  });

  it("gets reactions by multiple message ids", async () => {
    const grouped = await service.getByMessages(["m1"], sb);
    expect(grouped["m1"]).toHaveLength(1);
  });

  it("returns empty map for empty message ids", async () => {
    const grouped = await service.getByMessages([], sb);
    expect(grouped).toEqual({});
  });

  it("adds a reaction", async () => {
    const reaction = await service.add("m1", "u1", "🎉", sb);
    expect(reaction).not.toBeNull();
    expect(reaction?.emoji).toBe("🎉");
  });

  it("removes a reaction", async () => {
    const result = await service.remove("m1", "u1", "👍", sb);
    expect(result).toBe(true);
  });
});
