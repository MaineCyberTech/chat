import { describe, it, expect, vi } from "vitest";
import readReceiptsRouter from "../routes.js";

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@chat/db", () => ({
  readReceiptStore: {
    markChannelRead: vi.fn(),
    getLastViewed: vi.fn(() => "2026-01-01T00:00:00Z"),
    markMessageRead: vi.fn(),
    getMessageReaders: vi.fn(() => ({ readers: [] })),
    getBatchUnread: vi.fn(() => []),
  },
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (readReceiptsRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ data: [], error: null })) })) },
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  return res as any;
}

describe("Read Receipts Routes", () => {
  it("POST /v1/channels/:id/read marks channel as read", async () => {
    const handler = findHandler("post", "/v1/channels/:id/read");
    expect(handler).toBeTruthy();
    const req = mockReq({ params: { id: "channel-1" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("GET /v1/channels/:id/last-viewed returns timestamp", async () => {
    const handler = findHandler("get", "/v1/channels/:id/last-viewed");
    expect(handler).toBeTruthy();
    const req = mockReq({ params: { id: "channel-1" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ lastViewed: "2026-01-01T00:00:00Z" });
  });

  it("POST /v1/messages/:id/read marks message as read", async () => {
    const handler = findHandler("post", "/v1/messages/:id/read");
    expect(handler).toBeTruthy();
    const req = mockReq({ params: { id: "msg-1" }, body: { channelId: "channel-1" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("POST /v1/messages/:id/read returns 400 without channelId", async () => {
    const handler = findHandler("post", "/v1/messages/:id/read");
    const req = mockReq({ params: { id: "msg-1" }, body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("GET /v1/messages/:id/readers returns readers list", async () => {
    const handler = findHandler("get", "/v1/messages/:id/readers");
    expect(handler).toBeTruthy();
    const req = mockReq({ params: { id: "msg-1" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ readers: [] });
  });

  it("GET /v1/unread/counts returns counts", async () => {
    const handler = findHandler("get", "/v1/unread/counts");
    expect(handler).toBeTruthy();
    const req = mockReq({ query: { channel_ids: "ch-1,ch-2" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
