import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockLogger, MockWorker, MockQueue, mockSupabaseClient } = vi.hoisted(() => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  const MockWorker = vi.fn(() => ({ on: vi.fn() }));
  const MockQueue = vi.fn();

  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    abortSignal: vi.fn().mockReturnThis(),
  };
  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue(chain),
    schema: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue(chain) }),
    storage: { from: vi.fn().mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) }) },
    rpc: vi.fn().mockResolvedValue({}),
  };

  return { mockLogger, MockWorker, MockQueue, mockSupabaseClient };
});

vi.mock("@chat/config/logger.js", () => ({ logger: mockLogger }));

vi.mock("@chat/config/env-schema.js", () => ({
  loadEnv: () => ({
    REDIS_URL: "redis://localhost:6379",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  }),
}));

vi.mock("../lib/supabase.js", () => ({
  createSupabaseClient: () => mockSupabaseClient,
  executeWithCircuitBreaker: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Queue: MockQueue,
  Worker: MockWorker,
}));

describe("notification processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates notification queue with retry config", async () => {
    const { notificationQueue } = await import("../processors/notification.js");
    expect(MockQueue).toHaveBeenCalledWith(
      "notification",
      expect.objectContaining({
        defaultJobOptions: expect.objectContaining({ attempts: 3 }),
      }),
    );
  });

  it("registers worker for notification queue", async () => {
    const { registerNotificationProcessor } = await import("../processors/notification.js");
    const worker = registerNotificationProcessor();
    expect(worker).toBeDefined();
    expect(MockWorker).toHaveBeenCalledWith(
      "notification",
      expect.any(Function),
      expect.objectContaining({ concurrency: 20 }),
    );
  });

  it("processes in_app notification job", async () => {
    const { registerNotificationProcessor } = await import("../processors/notification.js");
    registerNotificationProcessor();
    const handler = (MockWorker.mock.calls[0] as unknown as [unknown, (job: unknown) => Promise<unknown>])?.[1];
    const result = await (handler!)({
      data: {
        userId: "user-1",
        type: "mention",
        title: "Hello",
        message: "You were mentioned",
        data: {},
        channels: ["in_app"],
      },
      id: "job-2",
    });
    expect(result).toBeDefined();
    expect((result as { status: string })?.status).toBe("sent");
  });
});
