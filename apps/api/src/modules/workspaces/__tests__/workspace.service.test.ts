import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkspaceService } from "../service.js";

const mockClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
      if (opts?.count === "exact") {
        const countResult = { data: null, count: 1, error: null };
        return {
          ...countResult,
          eq: vi.fn(() => ({
            ...countResult,
            then: (onfulfilled: (v: unknown) => unknown) =>
              Promise.resolve(countResult).then(onfulfilled),
          })),
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(countResult).then(onfulfilled),
        };
      }
      return {
        order: vi.fn(() => ({
          range: vi.fn(() => ({
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
                users: { display_name: "Owner", email: "owner@test.com", avatar_url: null },
              },
            ],
            error: null,
          })),
          eq: vi.fn(() => ({ error: null })),
          data: [
            {
              user_id: "u1",
              role: "owner",
              users: { display_name: "Owner", email: "owner@test.com", avatar_url: null },
            },
          ],
          error: null,
        })),
      };
    }),
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

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("../webhooks/service.js", () => ({
  webhookService: { triggerEvent: vi.fn(() => Promise.resolve()) },
}));

describe("WorkspaceService", () => {
  let service: WorkspaceService;

  beforeEach(() => {
    service = new WorkspaceService();
  });

  it("lists workspaces for a user", async () => {
    const { workspaces, total } = await service.listByUser();
    expect(workspaces).toHaveLength(1);
    expect(total).toBe(1);
    expect(workspaces[0].slug).toBe("test");
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

  it("rejects workspace creation when limit reached", async () => {
    vi.mocked(
      await import("../../../lib/supabase.js").then((m) => m.getSupabaseAdmin),
    ).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === "exact") {
            return { eq: vi.fn(() => ({ data: null, count: 10, error: null })) };
          }
          return {
            order: vi.fn(() => ({ data: [], error: null })),
            eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })),
          };
        }),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })),
        })),
      })),
    } as any);

    const ws = await service.create({ name: "Too Many", owner_id: "u1" });
    expect(ws).toBeNull();
  });
});
