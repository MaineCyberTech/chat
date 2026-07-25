import { describe, it, expect, vi, beforeEach } from "vitest";
import exportRouter from "../routes.js";

const mockWorkspaces = [
  { id: "ws-1", name: "Test WS", slug: "test-ws", created_at: "2024-01-01" },
  { id: "ws-2", name: "Second", slug: "second", created_at: "2024-01-02" },
];

const mockUsers = [
  { id: "u-1", email: "a@test.com", display_name: "User A", created_at: "2024-01-01" },
];

const mockChannels = [
  { id: "ch-1", name: "General", slug: "general", workspace_id: "ws-1", channel_type: "public", created_at: "2024-01-01" },
];

const mockMessages = [
  { id: "m-1", channel_id: "ch-1", user_id: "u-1", content: "Hello world", created_at: "2024-01-01" },
];

const mockMembers = [
  { user_id: "u-1" },
];

const tableData: Record<string, unknown[]> = {
  workspaces: mockWorkspaces,
  users: mockUsers,
  channels: mockChannels,
  messages: mockMessages,
  workspace_members: mockMembers,
};

const mockAdminFrom = vi.fn((table: string) => {
  const data = tableData[table] ?? [];
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
  };
  chain.then = (fn: (v: unknown) => unknown) => Promise.resolve({ data, error: null }).then(fn);
  return chain;
});

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseAdmin: vi.fn(() => ({ from: mockAdminFrom })),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (exportRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function createAdminChain(result: unknown) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
  };
  chain.then = (fn: (v: unknown) => unknown) => Promise.resolve(result).then(fn);
  return chain;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  const adminRows = [{ workspace_id: "ws-1" }];
  const adminChain = createAdminChain({ data: adminRows, error: null });
  const from = vi.fn((table: string) => {
    if (table === "workspace_members") return adminChain;
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      order: vi.fn(() => chain),
    };
    return chain;
  });
  return { userId: "admin-1", supabase: { from }, query: {}, ...overrides } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  res.setHeader = vi.fn(() => res) as any;
  res.req = { query: {} } as any;
  return res as any;
}

describe("Export Routes", () => {
  beforeEach(() => {
    mockAdminFrom.mockClear();
  });

  it("GET /admin/export/workspaces returns CSV with headers and rows", async () => {
    const handler = findHandler("get", "/admin/export/workspaces");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.send).toHaveBeenCalled();
    const csv = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,name,slug,created_at");
    expect(lines[1]).toContain("ws-1");
    expect(lines[2]).toContain("ws-2");
    expect(lines).toHaveLength(3);
  });

  it("GET /admin/export/users returns CSV with headers and rows", async () => {
    const handler = findHandler("get", "/admin/export/users");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    const csv = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(csv).toContain("id,email,display_name,created_at");
    expect(csv).toContain("u-1");
  });

  it("GET /admin/export/channels returns CSV with headers and rows", async () => {
    const handler = findHandler("get", "/admin/export/channels");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    const csv = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(csv).toContain("id,name,slug,workspace_id,channel_type,created_at");
    expect(csv).toContain("ch-1");
    expect(csv).toContain("public");
  });

  it("GET /admin/export/messages returns CSV with headers and rows", async () => {
    const handler = findHandler("get", "/admin/export/messages");
    expect(handler).toBeTruthy();
    const req = mockReq();
    const res = mockRes();
    await handler(req, res);
    const csv = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(csv).toContain("id,channel_id,user_id,content,created_at");
    expect(csv).toContain("Hello world");
  });
});
