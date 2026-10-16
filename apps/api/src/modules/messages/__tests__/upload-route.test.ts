import { describe, it, expect, vi, beforeEach } from "vitest";
import messagesRouter from "../routes.js";

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: {
    isStorageConfigured: vi.fn(() => true),
    createPresignedUpload: vi.fn(
      async () => "https://minio.example/chat-uploads?X-Amz-Signature=x",
    ),
    publicUrl: vi.fn((key: string) => `https://chat.example/storage/v1/chat-uploads/${key}`),
  },
}));

vi.mock("../../../lib/storage.js", () => mockStorage);

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  getAdminOrAnon: vi.fn(),
}));

vi.mock("../../../lib/socket.js", () => ({
  getOnlineUsers: vi.fn(() => []),
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (messagesRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    body: {},
    query: {},
    ...overrides,
  } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  return res as any;
}

describe("POST /messages/upload (S3 adapter)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.isStorageConfigured.mockReturnValue(true);
    mockStorage.createPresignedUpload.mockResolvedValue(
      "https://minio.example/chat-uploads?X-Amz-Signature=x",
    );
  });

  it("preserves the response shape: uploadUrl, filePath, publicUrl", async () => {
    const handler = findHandler("post", "/messages/upload");
    expect(handler).toBeTruthy();
    const req = mockReq({
      body: { fileName: "quarterly report.pdf", contentType: "application/pdf" },
    });
    const res = mockRes();
    await handler(req, res, vi.fn());

    const payload = res.json.mock.calls[0][0];
    expect(payload.uploadUrl).toBe("https://minio.example/chat-uploads?X-Amz-Signature=x");
    expect(payload.filePath).toMatch(
      /^00000000-0000-4000-8000-000000000001\/\d+-quarterly_report\.pdf$/,
    );
    expect(payload.publicUrl).toBe(
      `https://chat.example/storage/v1/chat-uploads/${payload.filePath}`,
    );
    expect(mockStorage.createPresignedUpload).toHaveBeenCalledWith(
      payload.filePath,
      "application/pdf",
    );
  });

  it("returns a clear 503-style error when storage is not configured", async () => {
    mockStorage.isStorageConfigured.mockReturnValueOnce(false);
    const handler = findHandler("post", "/messages/upload");
    const req = mockReq({ body: { fileName: "a.png", contentType: "image/png" } });
    const res = mockRes();
    const next = vi.fn();
    await handler(req, res, next);

    expect(mockStorage.createPresignedUpload).not.toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(503);
    expect(err.message).toContain("storage is not configured");
  });
});
