import { getSupabase, getSupabaseAdmin } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import { recordWebhookDelivery } from "../../lib/metrics.js";
import { executeWithCircuitBreaker } from "../../lib/circuit-breaker.js";
import {
  validateWebhookUrl,
  computeHmacSignature,
  buildWebhookPayload,
  MAX_RETRIES,
  BASE_DELAY_MS,
} from "@chat/config/webhook-utils.js";

export { validateWebhookUrl };
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  randomUUID,
} from "node:crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.WEBHOOK_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("WEBHOOK_ENCRYPTION_KEY must be set for webhook secret encryption");
  }
  return createHash("sha256").update(key).digest();
}

function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedData = parts[2];
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let plaintext = decipher.update(encryptedData, "hex", "utf8");
  plaintext += decipher.final("utf8");
  return plaintext;
}

const WEBHOOK_SECRET_MIN_LENGTH = 16;

function validateSecret(secret: string | undefined): { valid: boolean; error?: string } {
  if (!secret || secret.length === 0) {
    return { valid: true };
  }
  if (secret.length < WEBHOOK_SECRET_MIN_LENGTH) {
    return {
      valid: false,
      error: `Webhook secret must be at least ${WEBHOOK_SECRET_MIN_LENGTH} characters`,
    };
  }
  return { valid: true };
}

interface WebhookEndpoint {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status: string;
  request_body: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  duration_ms: number;
  retry_count: number;
  next_retry_at: string | null;
  dead_letter: boolean;
  created_at: string;
}

export class WebhookService {
  async getChannelWorkspaceId(channelId: string): Promise<string | null> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("channels")
      .select("workspace_id")
      .eq("id", channelId)
      .single();
    return (data?.workspace_id as string) ?? null;
  }

  async listByWorkspace(workspaceId: string): Promise<WebhookEndpoint[]> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    return (data ?? []) as WebhookEndpoint[];
  }

  async getById(id: string): Promise<WebhookEndpoint | null> {
    const supabase = getSupabase();
    const { data } = await supabase.from("webhook_endpoints").select("*").eq("id", id).single();
    return data as WebhookEndpoint | null;
  }

  async create(input: {
    workspace_id: string;
    name: string;
    url: string;
    secret?: string;
    events: string[];
    created_by: string;
  }): Promise<WebhookEndpoint | null> {
    const validation = validateSecret(input.secret);
    if (!validation.valid) {
      logger.error("webhook create failed", { error: "invalid secret" });
      throw new Error(validation.error);
    }

    const encryptedSecret = input.secret ? encryptSecret(input.secret) : "";

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        workspace_id: input.workspace_id,
        name: input.name,
        url: input.url,
        secret: encryptedSecret,
        events: input.events,
        created_by: input.created_by,
      })
      .select("*")
      .single();
    if (error) {
      logger.error("webhook create failed", { error: error.message });
      return null;
    }
    return data as WebhookEndpoint;
  }

  async update(id: string, input: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | null> {
    const updateData = { ...input };
    if (updateData.secret) {
      updateData.secret = encryptSecret(updateData.secret);
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return null;
    return data as WebhookEndpoint;
  }

  async remove(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
    return !error;
  }

  async triggerEvent(event: string, workspaceId: string, payload: Record<string, unknown>) {
    const supabase = getSupabase();
    const { data: endpoints } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .contains("events", [event]);

    if (!endpoints || endpoints.length === 0) return;

    const admin = getSupabaseAdmin();
    for (const endpoint of endpoints as WebhookEndpoint[]) {
      this.deliver(admin, endpoint, event, payload).catch((err) =>
        logger.error("webhook delivery failed", { webhookId: endpoint.id, error: String(err) }),
      );
    }
  }

  private async deliver(
    admin: ReturnType<typeof getSupabaseAdmin>,
    endpoint: WebhookEndpoint,
    event: string,
    payload: Record<string, unknown>,
    retryCount = 0,
  ) {
    const start = Date.now();
    let status = "success";
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let error: string | null = null;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (endpoint.secret) {
        const decryptedSecret = decryptSecret(endpoint.secret);
        headers["X-Webhook-Signature"] = computeHmacSignature(decryptedSecret, payload, event);
      }

      const breakerName = `webhook:${endpoint.id}`;

      const idempotencyKey = randomUUID();

      const urlValidation = await validateWebhookUrl(endpoint.url);
      if (!urlValidation.valid) {
        logger.error("Webhook URL validation failed at delivery time", {
          webhookId: endpoint.id,
          error: urlValidation.error,
        });
        await admin
          .from("webhook_endpoints")
          .update({ last_failure_at: new Date().toISOString(), last_error: urlValidation.error })
          .eq("id", endpoint.id);
        return;
      }

      const body = buildWebhookPayload(event, payload);

      const res = await executeWithCircuitBreaker(
        breakerName,
        async () => {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              ...headers,
              "X-Idempotency-Key": idempotencyKey,
            },
            body,
            signal: AbortSignal.timeout(10000),
          });
          return response;
        },
        [],
        { timeout: 10000, errorThresholdPercentage: 50, resetTimeout: 30000 },
      );

      responseStatus = res.status;

      // Limit response body size to prevent memory issues (1MB)
      const MAX_RESPONSE_SIZE = 1024 * 1024;
      const reader = res.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let totalSize = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalSize += value.length;
          if (totalSize > MAX_RESPONSE_SIZE) {
            error = "Response size exceeds limit";
            status = "failed";
            break;
          }
          chunks.push(value);
        }
        if (status !== "failed") {
          const decoder = new TextDecoder();
          responseBody = decoder.decode(Buffer.concat(chunks));
        }
      } else {
        responseBody = await res.text().catch(() => null);
      }

      if (res.status >= 200 && res.status < 300) {
        await admin
          .from("webhook_endpoints")
          .update({ last_success_at: new Date().toISOString() })
          .eq("id", endpoint.id);
      } else {
        status = "failed";
        error = `HTTP ${res.status}`;
        await admin
          .from("webhook_endpoints")
          .update({ last_failure_at: new Date().toISOString(), last_error: error })
          .eq("id", endpoint.id);
      }
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      await admin
        .from("webhook_endpoints")
        .update({ last_failure_at: new Date().toISOString(), last_error: error })
        .eq("id", endpoint.id);
    }

    const durationMs = Date.now() - start;

    // Insert delivery record
    const { data: delivery } = await admin
      .from("webhook_deliveries")
      .insert({
        webhook_id: endpoint.id,
        event,
        status,
        request_body: payload,
        response_status: responseStatus,
        response_body: responseBody,
        error,
        duration_ms: durationMs,
        retry_count: retryCount,
        dead_letter: false,
      })
      .select("*")
      .single();

    // delivery.id serves as idempotency key for retries
    // Receiver should check X-Idempotency-Key header for deduplication

    recordWebhookDelivery(status === "success" ? "success" : "failed", event);

    // Schedule retry if failed and not exceeded max retries
    if (status === "failed" && retryCount < MAX_RETRIES) {
      const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount) + Math.random() * 30_000;
      const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

      await admin
        .from("webhook_deliveries")
        .update({
          retry_count: retryCount + 1,
          next_retry_at: nextRetryAt,
        })
        .eq("id", delivery!.id);

      // Schedule retry
      setTimeout(() => {
        this.retryDelivery(endpoint, event, payload, retryCount + 1).catch((err) =>
          logger.error("webhook retry failed", { webhookId: endpoint.id, error: String(err) }),
        );
      }, delayMs);
    } else if (status === "failed" && retryCount >= MAX_RETRIES) {
      // Move to dead letter queue
      await admin.from("webhook_dead_letters").insert({
        webhook_id: endpoint.id,
        event,
        request_body: payload,
        last_error: error,
        attempt_count: retryCount,
        last_attempt_at: new Date().toISOString(),
      });

      await admin.from("webhook_deliveries").update({ dead_letter: true }).eq("id", delivery!.id);

      logger.error("webhook moved to dead letter queue", {
        webhookId: endpoint.id,
        event,
        attempts: retryCount,
      });
    }
  }

  private async retryDelivery(
    endpoint: WebhookEndpoint,
    event: string,
    payload: Record<string, unknown>,
    retryCount: number,
  ) {
    const admin = getSupabaseAdmin();
    await this.deliver(admin, endpoint, event, payload, retryCount);
  }

  async listDeliveries(
    webhookId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    const supabase = getSupabase();
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;
    const { data, error, count } = await supabase
      .from("webhook_deliveries")
      .select("*", { count: "exact" })
      .eq("webhook_id", webhookId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      logger.error("Failed to list webhook deliveries", { webhookId, error });
      return { deliveries: [], total: 0 };
    }
    return { deliveries: (data ?? []) as WebhookDelivery[], total: count ?? 0 };
  }

  // Process pending retries (called by cron job or scheduler)
  async processPendingRetries(): Promise<number> {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: deliveries } = await admin
      .from("webhook_deliveries")
      .select("*")
      .eq("status", "failed")
      .eq("dead_letter", false)
      .lte("next_retry_at", now)
      .limit(100);

    if (!deliveries || deliveries.length === 0) return 0;

    let processed = 0;
    for (const delivery of deliveries as WebhookDelivery[]) {
      const { data: endpoint } = await admin
        .from("webhook_endpoints")
        .select("*")
        .eq("id", delivery.webhook_id)
        .eq("is_active", true)
        .single();

      if (!endpoint) continue;

      await this.retryDelivery(
        endpoint as WebhookEndpoint,
        delivery.event,
        delivery.request_body as Record<string, unknown>,
        delivery.retry_count,
      );
      processed++;
    }

    return processed;
  }

  // Retry a specific dead letter
  async retryDeadLetter(deadLetterId: string): Promise<boolean> {
    const admin = getSupabaseAdmin();

    const { data: deadLetter } = await admin
      .from("webhook_dead_letters")
      .select("*")
      .eq("id", deadLetterId)
      .single();

    if (!deadLetter) return false;

    const { data: endpoint } = await admin
      .from("webhook_endpoints")
      .select("*")
      .eq("id", deadLetter.webhook_id)
      .eq("is_active", true)
      .single();

    if (!endpoint) return false;

    // Reset dead letter status
    await admin.from("webhook_dead_letters").delete().eq("id", deadLetterId);

    // Retry delivery
    await this.deliver(
      admin,
      endpoint as WebhookEndpoint,
      deadLetter.event,
      deadLetter.request_body as Record<string, unknown>,
      0,
    );

    return true;
  }
}

export const webhookService = new WebhookService();
