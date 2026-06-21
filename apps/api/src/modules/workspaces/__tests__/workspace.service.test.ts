import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkspaceService } from "../service.js";

const mockClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: [
          {
            id: "ws-1",
            name: "Test",
            slug: "test",
            owner_id: "u1",
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        ],
        error: null,
      })),
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "ws-1",
            name: "Test",
            slug: "test",
            owner_id: "u1",
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
            id: "ws-new",
            name: "New WS",
            slug: "new-ws",
            owner_id: "u1",
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
              id: "ws-1",
              name: "Updated",
              slug: "updated",
              owner_id: "u1",
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
  getAdminOrAnon: vi.fn(() => mockClient()),
}));

describe("WorkspaceService", () => {
  let service: WorkspaceService;

  beforeEach(() => {
    service = new WorkspaceService();
  });

  it("lists workspaces for a user", async () => {
    const list = await service.listByUser();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Test");
  });

  it("gets a workspace by id", async () => {
    const ws = await service.getById("ws-1");
    expect(ws).not.toBeNull();
    expect(ws?.slug).toBe("test");
  });

  it("creates a workspace", async () => {
    const ws = await service.create({ name: "New WS", owner_id: "u1" });
    expect(ws?.slug).toBe("new-ws");
  });

  it("updates a workspace", async () => {
    const ws = await service.update("ws-1", { name: "Updated" });
    expect(ws?.name).toBe("Updated");
  });

  it("deletes a workspace", async () => {
    const result = await service.remove("ws-1");
    expect(result).toBe(true);
  });
});
