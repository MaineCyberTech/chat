import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../service.js";

function mockChain(result: unknown) {
  const methods = ["select", "eq", "order", "range", "update", "insert", "delete"];
  const chain: any = {};
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn);
  return chain;
}

function mockSupabase(result: unknown) {
  return { from: vi.fn(() => mockChain(result)) } as any;
}

const mockAdminClient = mockChain({ error: null });

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => mockAdminClient),
    insert: vi.fn(() => ({ error: null })),
  })),
}));

vi.mock("../push-subscription-service.js", () => ({
  pushSubscriptionService: { sendPush: vi.fn(() => Promise.resolve()) },
}));

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("lists notifications for a user", async () => {
    const supabase = mockSupabase({
      data: [
        {
          id: "n1",
          user_id: "u1",
          workspace_id: "ws-1",
          type: "mention",
          title: "You were mentioned",
          body: "In channel general",
          link: "/ws-1/ch-1",
          read: false,
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
      error: null,
    });
    const list = await service.list("u1", undefined, 50, 0, supabase);
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe("mention");
  });

  it("lists notifications filtered by workspace", async () => {
    const supabase = mockSupabase({
      data: [
        {
          id: "n1",
          user_id: "u1",
          workspace_id: "ws-1",
          type: "mention",
          title: "You were mentioned",
          body: "In channel general",
          link: "/ws-1/ch-1",
          read: false,
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
      error: null,
    });
    const list = await service.list("u1", "ws-1", 50, 0, supabase);
    expect(list).toHaveLength(1);
  });

  it("returns unread count", async () => {
    const supabase = mockSupabase({ count: 5, data: null, error: null });
    const count = await service.unreadCount("u1", undefined, supabase);
    expect(typeof count).toBe("number");
  });

  it("marks a notification as read", async () => {
    const supabase = mockSupabase({ error: null });
    const result = await service.markRead("u1", "n1", supabase);
    expect(result).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const supabase = mockSupabase({ error: null });
    const result = await service.markAllRead("u1", supabase);
    expect(result).toBe(true);
  });

  it("creates a notification", async () => {
    const result = await service.create({
      user_id: "u1",
      workspace_id: "ws-1",
      type: "mention",
      title: "Hello",
      body: "Test notification",
    });
    expect(result).toBe(true);
  });
});
