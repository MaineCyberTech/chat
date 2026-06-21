import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageService } from "../service.js";

const mockClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            lt: vi.fn(() => ({
              data: [
                {
                  id: "m1",
                  channel_id: "ch-1",
                  user_id: "u1",
                  content: "Hello",
                  parent_id: null,
                  edited_at: null,
                  created_at: "2024-01-01T00:00:00Z",
                },
              ],
              error: null,
            })),
            data: [
              {
                id: "m1",
                channel_id: "ch-1",
                user_id: "u1",
                content: "Hello",
                parent_id: null,
                edited_at: null,
                created_at: "2024-01-01T00:00:00Z",
              },
            ],
            error: null,
          })),
        })),
        single: vi.fn(() => ({
          data: {
            id: "m1",
            channel_id: "ch-1",
            user_id: "u1",
            content: "Hello",
            parent_id: null,
            edited_at: null,
            created_at: "2024-01-01T00:00:00Z",
          },
          error: null,
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "m-new",
            channel_id: "ch-1",
            user_id: "u1",
            content: "Hi",
            parent_id: null,
            edited_at: null,
            created_at: "2024-01-01T00:00:00Z",
          },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: "m1",
              channel_id: "ch-1",
              user_id: "u1",
              content: "Updated",
              parent_id: null,
              edited_at: "2024-01-01T00:00:00Z",
              created_at: "2024-01-01T00:00:00Z",
            },
            error: null,
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    })),
  })),
});

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => mockClient()),
  getSupabaseAdmin: vi.fn(() => mockClient()),
  getAdminOrAnon: vi.fn(() => mockClient()),
}));

vi.mock("../../../lib/socket.js", () => ({
  getIO: vi.fn(() => ({
    to: vi.fn(() => ({
      emit: vi.fn(),
    })),
  })),
}));

describe("MessageService", () => {
  let service: MessageService;

  beforeEach(() => {
    service = new MessageService();
  });

  it("lists messages for a channel", async () => {
    const msgs = await service.listByChannel("ch-1");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe("Hello");
  });

  it("gets a message by id", async () => {
    const msg = await service.getById("m1");
    expect(msg).not.toBeNull();
    expect(msg?.content).toBe("Hello");
  });

  it("creates a message", async () => {
    const msg = await service.create({
      channel_id: "ch-1",
      user_id: "u1",
      content: "Hi",
    });
    expect(msg?.content).toBe("Hi");
  });

  it("updates a message", async () => {
    const msg = await service.update("m1", "Updated");
    expect(msg?.content).toBe("Updated");
  });

  it("deletes a message", async () => {
    const result = await service.remove("m1");
    expect(result).toEqual({ channel_id: "ch-1" });
  });
});
