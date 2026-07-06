import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThreadService } from "../service.js";

function mockSupabase(result: unknown) {
  const chain: any = {};
  for (const m of [
    "select", "eq", "order", "limit", "single",
    "insert", "update", "delete", "is", "or", "gt", "lt",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve(result).then(onfulfilled);

  return { from: vi.fn(() => chain) };
}

describe("ThreadService", () => {
  let service: ThreadService;

  beforeEach(() => {
    service = new ThreadService();
  });

  describe("getParticipants", () => {
    it("returns participants for a thread", async () => {
      const supabase = mockSupabase({
        data: [
          { thread_id: "thread-1", user_id: "user-1", last_read_at: "2024-01-01T00:00:00Z", joined_at: "2024-01-01T00:00:00Z" },
          { thread_id: "thread-1", user_id: "user-2", last_read_at: null, joined_at: "2024-01-02T00:00:00Z" },
        ],
        error: null,
      });

      const participants = await service.getParticipants("thread-1", supabase as any);

      expect(participants).toHaveLength(2);
      expect(participants[0].user_id).toBe("user-1");
      expect(participants[1].user_id).toBe("user-2");
      expect(participants[0].thread_id).toBe("thread-1");
    });

    it("returns empty array when no participants", async () => {
      const supabase = mockSupabase({
        data: [],
        error: null,
      });

      const participants = await service.getParticipants("thread-1", supabase as any);

      expect(participants).toEqual([]);
    });
  });
});
