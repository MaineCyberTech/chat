import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockLogger,
  mockSupabase,
  mockValidatePushEndpointUrl,
  mockCreatePinnedHttpsAgent,
  webPushMock,
} = vi.hoisted(() => {
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const chain = {
    upsert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(async () => ({ data: [], error: null })),
    single: vi.fn(async () => ({
      data: {
        id: "sub-1",
        user_id: "user-1",
        endpoint: "https://push.example.com/sub",
        p256dh: "key",
        auth: "auth",
        user_agent: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
      error: null,
    })),
  };
  const mockSupabase = { from: vi.fn(() => chain) };
  const mockValidatePushEndpointUrl = vi.fn(
    async (
      _url: string,
    ): Promise<{
      valid: boolean;
      error?: string;
      pinnedAddress?: { address: string; family: 4 | 6 };
    }> => ({
      valid: true,
      pinnedAddress: { address: "93.184.216.34", family: 4 },
    }),
  );
  const mockCreatePinnedHttpsAgent = vi.fn(() => ({ pinned: true }));
  const webPushMock = {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(async () => ({ statusCode: 201 })),
  };

  process.env.VAPID_PUBLIC_KEY = "test-public-key";
  process.env.VAPID_PRIVATE_KEY = "test-private-key";

  return {
    mockLogger,
    mockSupabase,
    mockValidatePushEndpointUrl,
    mockCreatePinnedHttpsAgent,
    webPushMock,
  };
});

vi.mock("../../../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabase),
}));

vi.mock("../../../lib/logger.js", () => ({ logger: mockLogger }));

vi.mock("web-push", () => ({ default: webPushMock }));

vi.mock("@chat/config/webhook-utils.js", () => ({
  validatePushEndpointUrl: mockValidatePushEndpointUrl,
  createPinnedHttpsAgent: mockCreatePinnedHttpsAgent,
}));

describe("PushSubscriptionService endpoint hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidatePushEndpointUrl.mockResolvedValue({
      valid: true,
      pinnedAddress: { address: "93.184.216.34", family: 4 },
    });
  });

  it("rejects storing a non-public or non-HTTPS endpoint", async () => {
    mockValidatePushEndpointUrl.mockResolvedValueOnce({
      valid: false,
      error: "URLs cannot point to private/internal IP addresses",
    });
    const { PushSubscriptionService } = await import("../push-subscription-service.js");
    const service = new PushSubscriptionService();

    await expect(
      service.create("user-1", {
        endpoint: "https://127.0.0.1/push",
        p256dh: "key",
        auth: "auth",
      }),
    ).rejects.toThrow(/private\/internal/);

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("stores a validated HTTPS endpoint", async () => {
    const { PushSubscriptionService } = await import("../push-subscription-service.js");
    const service = new PushSubscriptionService();

    const subscription = await service.create("user-1", {
      endpoint: "https://push.example.com/sub",
      p256dh: "key",
      auth: "auth",
    });

    expect(mockValidatePushEndpointUrl).toHaveBeenCalledWith("https://push.example.com/sub");
    expect(subscription.id).toBe("sub-1");
  });

  it("re-validates a stored endpoint at dispatch and pins the address", async () => {
    const { PushSubscriptionService } = await import("../push-subscription-service.js");
    const service = new PushSubscriptionService();
    const listSpy = vi.spyOn(service, "list").mockResolvedValue([
      {
        id: "sub-1",
        user_id: "user-1",
        endpoint: "https://push.example.com/sub",
        p256dh: "key",
        auth: "auth",
        user_agent: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ]);

    await service.sendPush("user-1", { title: "Hello" });

    expect(mockValidatePushEndpointUrl).toHaveBeenCalledWith("https://push.example.com/sub");
    expect(mockCreatePinnedHttpsAgent).toHaveBeenCalledWith({
      address: "93.184.216.34",
      family: 4,
    });
    expect(webPushMock.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "https://push.example.com/sub" }),
      expect.any(String),
      expect.objectContaining({ agent: { pinned: true } }),
    );

    listSpy.mockRestore();
  });

  it("does not dispatch when a stored endpoint is later found to be private", async () => {
    mockValidatePushEndpointUrl.mockResolvedValueOnce({
      valid: false,
      error: "URL resolves to a private/internal IP address",
    });
    const { PushSubscriptionService } = await import("../push-subscription-service.js");
    const service = new PushSubscriptionService();
    const listSpy = vi.spyOn(service, "list").mockResolvedValue([
      {
        id: "sub-1",
        user_id: "user-1",
        endpoint: "https://rebind.example/sub",
        p256dh: "key",
        auth: "auth",
        user_agent: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ]);

    const sent = await service.sendPush("user-1", { title: "Hello" });

    expect(sent).toBe(0);
    expect(webPushMock.sendNotification).not.toHaveBeenCalled();
    listSpy.mockRestore();
  });
});
