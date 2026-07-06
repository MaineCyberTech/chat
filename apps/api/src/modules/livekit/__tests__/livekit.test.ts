import { describe, it, expect, vi, beforeEach } from "vitest";
import livekitRouter from "../routes.js";

vi.mock("../../../middleware/authenticate.js", () => ({
  authenticate: vi.fn((req: any, _res: any, next: any) => {
    req.userId ??= "user-1";
    req.supabase ??= { from: vi.fn() };
    next();
  }),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { mockGenerateToken, mockGetWsUrl, mockIsConfigured } = vi.hoisted(() => ({
  mockGenerateToken: vi.fn(),
  mockGetWsUrl: vi.fn(),
  mockIsConfigured: vi.fn(),
}));

vi.mock("../service.js", () => ({
  liveKitService: {
    generateToken: mockGenerateToken,
    getWsUrl: mockGetWsUrl,
    isConfigured: mockIsConfigured,
  },
  LiveKitService: vi.fn(),
}));

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    supabase: { from: vi.fn() },
    query: {},
    body: {},
    params: {},
    headers: {},
    ip: "127.0.0.1",
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

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (livekitRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

describe("livekit routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /livekit/token", () => {
    it("returns 501 when LiveKit is not configured", async () => {
      mockIsConfigured.mockReturnValue(false);

      const handler = findHandler("get", "/livekit/token");
      const req = mockReq();
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({
        error: { code: "NOT_CONFIGURED", message: "LiveKit is not configured" },
      });
    });

    it("generates a token with room and display name", async () => {
      mockIsConfigured.mockReturnValue(true);
      mockGenerateToken.mockReturnValue("mock-jwt-token");
      mockGetWsUrl.mockReturnValue("ws://livekit.example.com:7880");

      const handler = findHandler("get", "/livekit/token");
      const req = mockReq({ query: { room: "team-call", name: "Alice" } });
      const res = mockRes();

      await handler(req, res);

      expect(mockGenerateToken).toHaveBeenCalledWith("team-call", "user-1", "Alice");
      expect(mockGetWsUrl).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        token: "mock-jwt-token",
        wsUrl: "ws://livekit.example.com:7880",
        roomName: "team-call",
        identity: "user-1",
      });
    });

    it("uses default room name when room query not provided", async () => {
      mockIsConfigured.mockReturnValue(true);
      mockGenerateToken.mockReturnValue("token");
      mockGetWsUrl.mockReturnValue("ws://localhost:7880");

      const handler = findHandler("get", "/livekit/token");
      const req = mockReq({ query: {} });
      const res = mockRes();

      await handler(req, res);

      expect(mockGenerateToken).toHaveBeenCalledWith("room_user-1", "user-1", undefined);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ roomName: "room_user-1" }),
      );
    });

    it("passes undefined display name when name query not provided", async () => {
      mockIsConfigured.mockReturnValue(true);
      mockGenerateToken.mockReturnValue("token");
      mockGetWsUrl.mockReturnValue("ws://localhost:7880");

      const handler = findHandler("get", "/livekit/token");
      const req = mockReq({ query: { room: "test-room" } });
      const res = mockRes();

      await handler(req, res);

      expect(mockGenerateToken).toHaveBeenCalledWith("test-room", "user-1", undefined);
    });
  });

  describe("GET /livekit/status", () => {
    it("returns configured status when LiveKit is configured", async () => {
      mockIsConfigured.mockReturnValue(true);

      const handler = findHandler("get", "/livekit/status");
      const req = mockReq();
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        configured: true,
        host: null,
      });
    });

    it("returns not configured when LiveKit is not configured", async () => {
      mockIsConfigured.mockReturnValue(false);

      const handler = findHandler("get", "/livekit/status");
      const req = mockReq();
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        configured: false,
        host: null,
      });
    });
  });
});
