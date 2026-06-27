import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../service.js";

const mockClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
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
            eq: vi.fn(() =>
              Promise.resolve({
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
              }),
            ),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        })),
        eq: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
    insert: vi.fn(() => ({ error: null })),
  })),
});

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => mockClient()),
  getSupabaseAdmin: vi.fn(() => mockClient()),
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
    const list = await service.list("u1");
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe("mention");
  });

  it("lists notifications filtered by workspace", async () => {
    const list = await service.list("u1", "ws-1");
    expect(list).toHaveLength(1);
  });

  it("returns unread count", async () => {
    const count = await service.unreadCount("u1");
    expect(typeof count).toBe("number");
  });

  it("marks a notification as read", async () => {
    const result = await service.markRead("u1", "n1");
    expect(result).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const result = await service.markAllRead("u1");
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
