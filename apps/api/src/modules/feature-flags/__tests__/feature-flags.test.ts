import { describe, it, expect, vi, beforeEach } from "vitest";
import ffRouter from "../routes.js";
import { errorHandler } from "../../../middleware/error-handler.js";

const mockService = vi.hoisted(() => ({
  getAllFlags: vi.fn<() => Promise<any[]>>(),
  getFlag: vi.fn<(key: string) => Promise<any | null>>(),
  createFlag: vi.fn<(input: any) => Promise<any | null>>(),
  updateFlag: vi.fn<(key: string, updates: any) => Promise<any | null>>(),
  deleteFlag: vi.fn<(key: string) => Promise<boolean>>(),
  evaluateFlag: vi.fn<(key: string, context: any) => Promise<any>>(),
}));

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(),
  getSupabaseForUser: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../../lib/feature-flags.js", () => ({
  featureFlagService: mockService,
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
  for (const layer of (ffRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      const handle = layer.route.stack[layer.route.stack.length - 1].handle;
      return async (req: any, res: any) => {
        const next = vi.fn();
        await handle(req, res, next);
        if (next.mock.calls.length > 0) {
          const err = next.mock.calls[0][0];
          errorHandler(err, req, res, vi.fn());
        }
      };
    }
  }
  return null;
}

const testFlag = {
  key: "new-ui",
  name: "New UI",
  description: "Enable new UI",
  enabled: false,
  rolloutPercentage: 0,
  targetRoles: [],
  targetUserIds: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("feature-flags routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /feature-flags", () => {
    it("lists all flags", async () => {
      mockService.getAllFlags.mockResolvedValue([testFlag]);

      const handler = findHandler("get", "/feature-flags");
      const req = mockReq();
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ flags: expect.arrayContaining([expect.objectContaining({ key: "new-ui" })]) });
    });

    it("returns empty array when no flags", async () => {
      mockService.getAllFlags.mockResolvedValue([]);

      const handler = findHandler("get", "/feature-flags");
      const req = mockReq();
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ flags: [] });
    });
  });

  describe("GET /feature-flags/:key", () => {
    it("returns a single flag", async () => {
      mockService.getFlag.mockResolvedValue(testFlag);

      const handler = findHandler("get", "/feature-flags/:key");
      const req = mockReq({ params: { key: "new-ui" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({ flag: expect.objectContaining({ key: "new-ui" }) });
    });

    it("returns 404 when not found", async () => {
      mockService.getFlag.mockResolvedValue(null);

      const handler = findHandler("get", "/feature-flags/:key");
      const req = mockReq({ params: { key: "unknown" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "NOT_FOUND" }),
        }),
      );
    });
  });

  describe("POST /feature-flags", () => {
    it("creates a flag", async () => {
      mockService.createFlag.mockResolvedValue(testFlag);

      const handler = findHandler("post", "/feature-flags");
      const req = mockReq({
        body: { key: "new-ui", name: "New UI" },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ flag: expect.objectContaining({ key: "new-ui" }) });
      expect(mockService.createFlag).toHaveBeenCalledWith(
        expect.objectContaining({ key: "new-ui", name: "New UI", description: "" }),
      );
    });

    it("returns 400 when key missing", async () => {
      const handler = findHandler("post", "/feature-flags");
      const req = mockReq({ body: { name: "New UI" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns 400 when name missing", async () => {
      const handler = findHandler("post", "/feature-flags");
      const req = mockReq({ body: { key: "new-ui" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });

    it("returns 400 for invalid key format", async () => {
      const handler = findHandler("post", "/feature-flags");
      const req = mockReq({ body: { key: "INVALID_KEY", name: "New UI" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 500 when create fails (service returns null)", async () => {
      mockService.createFlag.mockResolvedValue(null);

      const handler = findHandler("post", "/feature-flags");
      const req = mockReq({ body: { key: "new-ui", name: "New UI" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "INTERNAL_SERVER_ERROR" }),
        }),
      );
    });
  });

  describe("PATCH /feature-flags/:key", () => {
    it("updates a flag", async () => {
      mockService.updateFlag.mockResolvedValue({ ...testFlag, enabled: true });

      const handler = findHandler("patch", "/feature-flags/:key");
      const req = mockReq({
        params: { key: "new-ui" },
        body: { enabled: true },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        flag: expect.objectContaining({ key: "new-ui", enabled: true }),
      });
    });

    it("returns 404 when not found", async () => {
      mockService.updateFlag.mockResolvedValue(null);

      const handler = findHandler("patch", "/feature-flags/:key");
      const req = mockReq({
        params: { key: "unknown" },
        body: { enabled: true },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "NOT_FOUND" }),
        }),
      );
    });

    it("returns 400 for invalid body", async () => {
      const handler = findHandler("patch", "/feature-flags/:key");
      const req = mockReq({
        params: { key: "new-ui" },
        body: { name: "" },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("DELETE /feature-flags/:key", () => {
    it("deletes a flag", async () => {
      mockService.deleteFlag.mockResolvedValue(true);

      const handler = findHandler("delete", "/feature-flags/:key");
      const req = mockReq({ params: { key: "new-ui" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("returns 404 when not found", async () => {
      mockService.deleteFlag.mockResolvedValue(false);

      const handler = findHandler("delete", "/feature-flags/:key");
      const req = mockReq({ params: { key: "unknown" } });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "NOT_FOUND" }),
        }),
      );
    });
  });

  describe("POST /feature-flags/:key/evaluate", () => {
    it("evaluates a flag for the current user", async () => {
      mockService.evaluateFlag.mockResolvedValue({ key: "new-ui", enabled: true, reason: "matched" });

      const handler = findHandler("post", "/feature-flags/:key/evaluate");
      const req = mockReq({ params: { key: "new-ui" }, body: {} });
      const res = mockRes();

      await handler(req, res);

      expect(mockService.evaluateFlag).toHaveBeenCalledWith("new-ui", {
        userId: "user-1",
        userRole: undefined,
      });
      expect(res.json).toHaveBeenCalledWith({
        evaluation: expect.objectContaining({ key: "new-ui", enabled: true }),
      });
    });

    it("evaluates with explicit userId and userRole", async () => {
      mockService.evaluateFlag.mockResolvedValue({ key: "new-ui", enabled: false, reason: "role_not_targeted" });

      const handler = findHandler("post", "/feature-flags/:key/evaluate");
      const req = mockReq({
        params: { key: "new-ui" },
        body: { userId: "22222222-2222-2222-2222-222222222222", userRole: "admin" },
      });
      const res = mockRes();

      await handler(req, res);

      expect(mockService.evaluateFlag).toHaveBeenCalledWith("new-ui", {
        userId: "22222222-2222-2222-2222-222222222222",
        userRole: "admin",
      });
      expect(res.json).toHaveBeenCalledWith({
        evaluation: expect.objectContaining({ key: "new-ui", enabled: false, reason: "role_not_targeted" }),
      });
    });

    it("returns 400 for invalid userId in body", async () => {
      const handler = findHandler("post", "/feature-flags/:key/evaluate");
      const req = mockReq({
        params: { key: "new-ui" },
        body: { userId: "not-a-uuid" },
      });
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: "BAD_REQUEST" }),
        }),
      );
    });
  });
});
