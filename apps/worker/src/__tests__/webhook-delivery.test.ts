import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockLogger, MockWorker, MockQueue, mockSupabase, inserts, hmac } = vi.hoisted(() => {
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const MockWorker = vi.fn(() => ({ on: vi.fn() }));
  const MockQueue = vi.fn();

  const inserts: Array<Record<string, unknown>> = [];
  const endpoint = {
    id: "wh-1",
    url: "https://example.com/hook",
    secret: "enc-secret",
    is_active: true,
  };

  const single = vi.fn().mockResolvedValue({ data: endpoint, error: null });
  const eq = vi.fn(() => ({ eq, single }));
  const select = vi.fn(() => ({ eq }));
  const insert = vi.fn(async (row: Record<string, unknown>) => {
    inserts.push(row);
    return { error: null };
  });
  const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
  const mockSupabase = { from: vi.fn(() => ({ select, insert, update })) };

  const hmac = vi.fn(() => "sig");

  return { mockLogger, MockWorker, MockQueue, mockSupabase, inserts, hmac };
});

vi.mock("@chat/config/logger.js", () => ({ logger: mockLogger }));

vi.mock("@chat/config/env-schema.js", () => ({
  loadEnv: () => ({
    REDIS_URL: "redis://localhost:6379",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  }),
}));

vi.mock("@chat/config/webhook-utils.js", () => ({
  MAX_RETRIES: 5,
  BASE_DELAY_MS: 60_000,
  WEBHOOK_REDIRECT_MODE: "manual",
  validateWebhookUrl: vi.fn(async () => ({ valid: true })),
  computeHmacSignature: hmac,
  buildWebhookPayload: (event: string, payload: Record<string, unknown>) =>
    JSON.stringify({ event, ...payload }),
  decryptWebhookSecret: vi.fn((encrypted: string) => `decrypted:${encrypted}`),
}));

vi.mock("../lib/supabase.js", () => ({
  createSupabaseClient: () => mockSupabase,
}));

vi.mock("bullmq", () => ({ Queue: MockQueue, Worker: MockWorker }));

type Handler = (job: unknown) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
  const { registerWebhookProcessor } = await import("../processors/webhook-delivery.js");
  registerWebhookProcessor();
  return (MockWorker.mock.calls[0] as unknown as [unknown, Handler])[1];
}

function job(data: Record<string, unknown>, attemptsMade: number) {
  return { id: "job-1", data, attemptsMade, opts: {} };
}

describe("webhook-delivery processor (durable retries)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inserts.length = 0;
    process.env.WEBHOOK_ENCRYPTION_KEY = "unit-test-encryption-key-1234567890";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("upstream error", { status: 500 })),
    );
  });

  it("signs with the decrypted secret and reuses the provided idempotency key", async () => {
    const handler = await getHandler();
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    await handler(
      job(
        {
          webhookId: "wh-1",
          event: "message.created",
          payload: { channel_id: "ch-1" },
          retryCount: 1,
          deliveryId: "d-1",
          idempotencyKey: "idem-stable-1",
        },
        0,
      ),
    ).catch(() => undefined);

    expect(hmac).toHaveBeenCalledWith("decrypted:enc-secret", expect.anything(), "message.created");
    const [, options] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; redirect: string },
    ];
    expect(options.headers["X-Idempotency-Key"]).toBe("idem-stable-1");
    // SEC-P2-002 / WH-P2-002: redirects are not followed.
    expect(options.redirect).toBe("manual");
  });

  it("throws for a retryable failure before the final attempt so BullMQ retries durably", async () => {
    const handler = await getHandler();

    await expect(
      handler(
        job(
          {
            webhookId: "wh-1",
            event: "message.created",
            payload: {},
            retryCount: 1,
            deliveryId: "d-1",
            idempotencyKey: "idem-1",
          },
          0,
        ),
      ),
    ).rejects.toThrow(/will retry/);
  });

  it("records the cumulative retry count and dead-letters on the final attempt", async () => {
    const handler = await getHandler();

    const result = await handler(
      job(
        {
          webhookId: "wh-1",
          event: "message.created",
          payload: {},
          retryCount: 1,
          deliveryId: "d-1",
          idempotencyKey: "idem-1",
        },
        4,
      ),
    );

    expect((result as { status: string }).status).toBe("failed");
    const deliveryInsert = inserts.find((row) => "retry_count" in row);
    expect(deliveryInsert?.retry_count).toBe(5);
    const deadLetterInsert = inserts.find((row) => "attempt_count" in row);
    expect(deadLetterInsert).toBeTruthy();
  });

  it("does not follow redirects when dispatching a webhook (SSRF)", async () => {
    const handler = await getHandler();
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    // A validated public URL answers 302 -> internal metadata address.
    fetchMock.mockResolvedValueOnce(
      new Response("", {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data/" },
      }),
    );

    const result = await handler(
      job(
        {
          webhookId: "wh-1",
          event: "message.created",
          payload: {},
          retryCount: 5,
          deliveryId: "d-1",
          idempotencyKey: "idem-1",
        },
        0,
      ),
    );

    expect((result as { status: string }).status).toBe("failed");
    const [, options] = fetchMock.mock.calls[0] as [string, { redirect: string }];
    expect(options.redirect).toBe("manual");
    // The redirect was not followed: exactly one request was made.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
