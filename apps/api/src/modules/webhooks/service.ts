import { getSupabase, getSupabaseAdmin } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import { recordWebhookDelivery } from "../../lib/metrics.js";
import { executeWithCircuitBreaker } from "../../lib/circuit-breaker.js";

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

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 60_000; // 1 minute

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
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        workspace_id: input.workspace_id,
        name: input.name,
        url: input.url,
        secret: input.secret ?? "",
        events: input.events,
        created_by: input.created_by,
      })
      .select("*")
      .single();
    if (error) {
      logger.error("webhook create failed", { error });
      return null;
    }
    return data as WebhookEndpoint;
  }

  async update(id: string, input: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .update(input)
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
        // Use HMAC-SHA256 for signature
        const crypto = await import("node:crypto");
        const signature = crypto
          .createHmac("sha256", endpoint.secret)
          .update(JSON.stringify({ event, ...payload }))
          .digest("hex");
        headers["X-Webhook-Signature"] = `sha256=${signature}`;
      }

      const breakerName = `webhook:${endpoint.id}`;

      const idempotencyKey = crypto.randomUUID();

      const res = await executeWithCircuitBreaker(
        breakerName,
        async () => {
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              ...headers,
              "X-Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify({ event, ...payload }),
            signal: AbortSignal.timeout(10000),
          });
          return response;
        },
        [],
        { timeout: 10000, errorThresholdPercentage: 50, resetTimeout: 30000 },
      );

      responseStatus = res.status;
      responseBody = await res.text().catch(() => null);

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
