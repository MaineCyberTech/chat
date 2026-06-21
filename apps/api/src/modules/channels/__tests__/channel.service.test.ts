import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChannelService } from "../service.js";

const mockClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              id: "ch-1",
              workspace_id: "ws-1",
              name: "general",
              slug: "general",
              topic: null,
              is_private: false,
              created_by: "u1",
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
          ],
          error: null,
        })),
        single: vi.fn(() => ({
          data: {
            id: "ch-1",
            workspace_id: "ws-1",
            name: "general",
            slug: "general",
            topic: null,
            is_private: false,
            created_by: "u1",
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
          error: null,
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "ch-new",
            workspace_id: "ws-1",
            name: "random",
            slug: "random",
            topic: null,
            is_private: false,
            created_by: "u1",
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
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
              id: "ch-1",
              workspace_id: "ws-1",
              name: "Updated",
              slug: "general",
              topic: "A topic",
              is_private: false,
              created_by: "u1",
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
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
}));

describe("ChannelService", () => {
  let service: ChannelService;

  beforeEach(() => {
    service = new ChannelService();
  });

  it("lists channels for a workspace", async () => {
    const list = await service.listByWorkspace("ws-1");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("general");
  });

  it("gets a channel by id", async () => {
    const ch = await service.getById("ch-1");
    expect(ch).not.toBeNull();
    expect(ch?.slug).toBe("general");
  });

  it("creates a channel", async () => {
    const ch = await service.create({
      name: "random",
      workspace_id: "ws-1",
      created_by: "u1",
    });
    expect(ch?.slug).toBe("random");
  });

  it("updates a channel", async () => {
    const ch = await service.update("ch-1", { name: "Updated" });
    expect(ch?.name).toBe("Updated");
  });

  it("deletes a channel", async () => {
    const result = await service.remove("ch-1");
    expect(result).toBe(true);
  });
});
