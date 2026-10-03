import { describe, it, expect, vi, beforeEach } from "vitest";

const { MockQueue, mockAdd } = vi.hoisted(() => {
  const mockAdd = vi.fn().mockResolvedValue({ id: "job-1" });
  const MockQueue = vi.fn(() => ({ add: mockAdd }));
  return { MockQueue, mockAdd };
});

vi.mock("bullmq", () => ({ Queue: MockQueue }));
vi.mock("../../config/env.js", () => ({
  loadEnv: () => ({ REDIS_URL: "redis://localhost:6379" }),
}));
vi.mock("../logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { enqueueWebhookRetry, type WebhookRetryJobData } from "../webhook-queue.js";

function jobData(retryCount: number): WebhookRetryJobData {
  return {
    webhookId: "wh-1",
    event: "message.created",
    payload: { channel_id: "ch-1" },
    retryCount,
    deliveryId: "d-1",
    idempotencyKey: "idem-stable-1",
  };
}

describe("enqueueWebhookRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a delayed job with a deterministic jobId and remaining attempts", async () => {
    const ok = await enqueueWebhookRetry(jobData(1), 60_000);

    expect(ok).toBe(true);
    expect(mockAdd).toHaveBeenCalledWith(
      "deliver",
      jobData(1),
      expect.objectContaining({
        delay: 60_000,
        jobId: "webhook-retry:d-1:1",
        attempts: 5,
      }),
    );
  });

  it("clamps attempts to one on the final retry", async () => {
    await enqueueWebhookRetry(jobData(5), 1_920_000);

    expect(mockAdd).toHaveBeenCalledWith(
      "deliver",
      jobData(5),
      expect.objectContaining({ attempts: 1, jobId: "webhook-retry:d-1:5" }),
    );
  });
});
