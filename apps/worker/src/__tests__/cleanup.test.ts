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
    storage: {
      from: vi.fn().mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) }),
    },
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

describe("cleanup processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates cleanup queue with correct name", async () => {
    await import("../processors/cleanup.js");
    expect(MockQueue).toHaveBeenCalledWith(
      "cleanup",
      expect.objectContaining({ defaultJobOptions: expect.any(Object) }),
    );
  });

  it("registers worker for cleanup queue", async () => {
    const { registerCleanupProcessor } = await import("../processors/cleanup.js");
    const worker = registerCleanupProcessor();
    expect(worker).toBeDefined();
    expect(MockWorker).toHaveBeenCalledWith(
      "cleanup",
      expect.any(Function),
      expect.objectContaining({ concurrency: 1 }),
    );
  });

  it("handles old_deliveries job type", async () => {
    const { registerCleanupProcessor } = await import("../processors/cleanup.js");
    registerCleanupProcessor();
    const handler = (
      MockWorker.mock.calls[0] as unknown as [unknown, (job: unknown) => Promise<unknown>]
    )?.[1];
    const result = await handler!({
      data: { type: "old_deliveries", olderThanDays: 30 },
      id: "job-1",
    });
    expect(result).toBeDefined();
  });
});
