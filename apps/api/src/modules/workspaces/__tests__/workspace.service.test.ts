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
        order: vi.fn(() => ({
          data: [
            {
              user_id: "u1",
              role: "owner",
              users: [{ display_name: "Owner", email: "owner@test.com", avatar_url: null }],
            },
          ],
          error: null,
        })),
        eq: vi.fn(() => ({ error: null })),
        data: [
          {
            user_id: "u1",
            role: "owner",
            users: [{ display_name: "Owner", email: "owner@test.com", avatar_url: null }],
          },
        ],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "ws-new",
            name: "New",
            slug: "new",
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
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
    })),
  })),
});

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => mockClient()),
  getSupabaseAdmin: vi.fn(() => mockClient()),
}));

vi.mock("../../../lib/logger.js", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("../webhooks/service.js", () => ({
  webhookService: { triggerEvent: vi.fn(() => Promise.resolve()) },
}));

describe("WorkspaceService", () => {
  let service: WorkspaceService;

  beforeEach(() => {
    service = new WorkspaceService();
  });

  it("lists workspaces for a user", async () => {
    const list = await service.listByUser();
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe("test");
  });

  it("gets a workspace by id", async () => {
    const ws = await service.getById("ws-1");
    expect(ws).not.toBeNull();
    expect(ws?.name).toBe("Test");
  });

  it("creates a workspace", async () => {
    const ws = await service.create({ name: "New", owner_id: "u1" });
    expect(ws).not.toBeNull();
    expect(ws?.slug).toBe("new");
  });

  it("updates a workspace", async () => {
    const ws = await service.update("ws-1", { name: "Updated" });
    expect(ws?.name).toBe("Updated");
    expect(ws?.slug).toBe("updated");
  });

  it("deletes a workspace", async () => {
    const result = await service.remove("ws-1");
    expect(result).toBe(true);
  });

  it("lists workspace members", async () => {
    const members = await service.getMembers("ws-1");
    expect(members).toHaveLength(1);
    expect(members[0].display_name).toBe("Owner");
  });

  it("adds a member", async () => {
    const result = await service.addMember("ws-1", "u2", "member");
    expect(result).toBe(true);
  });

  it("removes a member", async () => {
    const result = await service.removeMember("ws-1", "u2");
    expect(result).toBe(true);
  });

  it("updates a member role", async () => {
    const result = await service.updateMemberRole("ws-1", "u2", "admin");
    expect(result).toBe(true);
  });
});
