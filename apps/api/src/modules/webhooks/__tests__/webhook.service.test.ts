import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebhookService, validateWebhookUrl } from "../service.js";

const { enqueueWebhookRetry } = vi.hoisted(() => ({
  enqueueWebhookRetry: vi.fn(async () => true),
}));

vi.mock("../../../lib/webhook-queue.js", () => ({ enqueueWebhookRetry }));

const mockClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "wh-1",
            workspace_id: "ws-1",
            name: "Test Webhook",
            url: "https://example.com/hook",
            secret: "sec",
            events: ["message.created"],
            is_active: true,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
          error: null,
        })),
        order: vi.fn(() => ({
          data: [
            {
              id: "wh-1",
              workspace_id: "ws-1",
              name: "Test Webhook",
              url: "https://example.com/hook",
              secret: "sec",
              events: ["message.created"],
              is_active: true,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
          ],
          error: null,
        })),
        contains: vi.fn(() => ({
          data: [
            {
              id: "wh-1",
              workspace_id: "ws-1",
              name: "Test Webhook",
              url: "https://example.com/hook",
              secret: "sec",
              events: ["message.created"],
              is_active: true,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
          ],
          error: null,
        })),
        eq: vi.fn(() => ({
          contains: vi.fn(() => ({
            data: [
              {
                id: "wh-1",
                workspace_id: "ws-1",
                name: "Test Webhook",
                url: "https://example.com/hook",
                secret: "sec",
                events: ["message.created"],
                is_active: true,
                created_at: "2024-01-01",
                updated_at: "2024-01-01",
              },
            ],
            error: null,
          })),
        })),
        lte: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "wh-new",
            workspace_id: "ws-1",
            name: "New",
            url: "https://example.com/new",
            secret: "",
            events: [],
            is_active: true,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: "wh-1",
              workspace_id: "ws-1",
              name: "Updated",
              url: "https://example.com/hook",
              secret: "sec",
              events: ["message.created"],
              is_active: true,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
            error: null,
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
  })),
});

vi.mock("../../../lib/supabase.js", () => ({
  getSupabase: vi.fn(() => mockClient()),
  getSupabaseAdmin: vi.fn(() => mockClient()),
}));

vi.mock("../../../lib/logger.js", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("../../../lib/metrics.js", () => ({ recordWebhookDelivery: vi.fn() }));

// Required by encryptSecret(); value is a throwaway test key, not a real secret.
process.env.WEBHOOK_ENCRYPTION_KEY ??= "test-encryption-key";

describe("WebhookService", () => {
  let service: WebhookService;

  beforeEach(() => {
    service = new WebhookService();
    vi.clearAllMocks();
  });

  it("gets channel workspace id", async () => {
    const wsId = await service.getChannelWorkspaceId("ch-1");
    expect(wsId).toBe("ws-1");
  });

  it("lists webhooks for a workspace", async () => {
    const list = await service.listByWorkspace("ws-1");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Test Webhook");
  });

  it("gets a webhook by id", async () => {
    const wh = await service.getById("wh-1");
    expect(wh).not.toBeNull();
    expect(wh?.name).toBe("Test Webhook");
  });

  it("creates a webhook", async () => {
    const wh = await service.create({
      workspace_id: "ws-1",
      name: "New",
      url: "https://example.com/new",
      secret: "a".repeat(16),
      events: [],
      created_by: "u1",
    });
    expect(wh).not.toBeNull();
    expect(wh?.name).toBe("New");
  });

  it("rejects creating a webhook without a secret", async () => {
    await expect(
      service.create({
        workspace_id: "ws-1",
        name: "New",
        url: "https://example.com/new",
        events: [],
        created_by: "u1",
      } as unknown as Parameters<WebhookService["create"]>[0]),
    ).rejects.toThrow(/secret is required/i);
  });

  it("rejects creating a webhook with a too-short secret", async () => {
    await expect(
      service.create({
        workspace_id: "ws-1",
        name: "New",
        url: "https://example.com/new",
        secret: "short",
        events: [],
        created_by: "u1",
      }),
    ).rejects.toThrow(/at least 16/i);
  });

  it("updates a webhook", async () => {
    const wh = await service.update("wh-1", { name: "Updated" });
    expect(wh?.name).toBe("Updated");
  });

  it("deletes a webhook", async () => {
    const result = await service.remove("wh-1");
    expect(result).toBe(true);
  });

  it("triggers events for matching webhooks", async () => {
    await service.triggerEvent("message.created", "ws-1", { channel_id: "ch-1" });
  });

  it("enqueues a durable retry job when a delivery fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("upstream error", { status: 500 })),
    );

    await service.triggerEvent("message.created", "ws-1", { channel_id: "ch-2" });

    type RetryCall = [
      {
        payload: { channel_id?: string };
        webhookId: string;
        retryCount: number;
        deliveryId: string;
        idempotencyKey: string;
      },
      number,
    ];
    const calls = enqueueWebhookRetry.mock.calls as unknown as RetryCall[];
    const findCall = () => calls.find(([data]) => data.payload.channel_id === "ch-2");

    await vi.waitFor(() => expect(findCall()).toBeTruthy(), { timeout: 15_000 });

    const [jobData, delayMs] = findCall() as RetryCall;
    expect(jobData.webhookId).toBe("wh-1");
    expect(jobData.retryCount).toBe(1);
    expect(jobData.idempotencyKey).toBeTruthy();
    expect(delayMs).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });
});

describe("validateWebhookUrl", () => {
  it("accepts valid HTTPS URLs", async () => {
    const result = await validateWebhookUrl("https://example.com/hook");
    expect(result.valid).toBe(true);
  });

  it("rejects non-HTTPS URLs", async () => {
    const result = await validateWebhookUrl("http://example.com/hook");
    expect(result.valid).toBe(false);
  });

  it("rejects localhost URLs", async () => {
    const result = await validateWebhookUrl("https://127.0.0.1/hook");
    expect(result.valid).toBe(false);
  });

  it("rejects private IP URLs", async () => {
    const result = await validateWebhookUrl("https://10.0.0.1/hook");
    expect(result.valid).toBe(false);
  });

  it("rejects invalid URLs", async () => {
    const result = await validateWebhookUrl("not-a-url");
    expect(result.valid).toBe(false);
  });
});
