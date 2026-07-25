import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThreadService } from "../service.js";

function makeChain(result: unknown) {
  const chain: any = {};
  for (const m of [
    "select",
    "eq",
    "order",
    "limit",
    "single",
    "insert",
    "update",
    "delete",
    "is",
    "or",
    "gt",
    "lt",
    "upsert",
    "count",
    "head",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (onfulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onfulfilled);
  return chain;
}

function mockSupabase(result: unknown) {
  return { from: vi.fn(() => makeChain(result)) };
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
          {
            thread_id: "thread-1",
            user_id: "user-1",
            last_read_at: "2024-01-01T00:00:00Z",
            joined_at: "2024-01-01T00:00:00Z",
          },
          {
            thread_id: "thread-1",
            user_id: "user-2",
            last_read_at: null,
            joined_at: "2024-01-02T00:00:00Z",
          },
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

  describe("joinThread", () => {
    it("returns true on successful join", async () => {
      const supabase = mockSupabase({ data: null, error: null });

      const joined = await service.joinThread("thread-1", "user-1", supabase as any);

      expect(joined).toBe(true);
    });

    it("returns false on join error", async () => {
      const supabase = mockSupabase({ data: null, error: { message: "duplicate" } });

      const joined = await service.joinThread("thread-1", "user-1", supabase as any);

      expect(joined).toBe(false);
    });
  });

  describe("leaveThread", () => {
    it("returns true on successful leave", async () => {
      const supabase = mockSupabase({ data: null, error: null });

      const left = await service.leaveThread("thread-1", "user-1", supabase as any);

      expect(left).toBe(true);
    });

    it("returns false on leave error", async () => {
      const supabase = mockSupabase({ data: null, error: { message: "not found" } });

      const left = await service.leaveThread("thread-1", "user-1", supabase as any);

      expect(left).toBe(false);
    });
  });

  describe("getUnreadCount", () => {
    it("returns unread count when participant has last_read_at", async () => {
      let callCount = 0;
      const supabase = {
        from: vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return makeChain({ data: { last_read_at: "2024-01-01T00:00:00Z" }, error: null });
          }
          return makeChain({ data: null, error: null, count: 5 });
        }),
      };

      const count = await service.getUnreadCount("thread-1", "user-1", supabase as any);

      expect(count).toBe(5);
    });

    it("returns 0 when no participant record", async () => {
      let callCount = 0;
      const supabase = {
        from: vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return makeChain({ data: null, error: null });
          }
          return makeChain({ data: null, error: null, count: 0 });
        }),
      };

      const count = await service.getUnreadCount("thread-1", "user-1", supabase as any);

      expect(count).toBe(0);
    });
  });
});
