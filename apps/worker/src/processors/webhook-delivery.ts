import { Worker, Job, Queue } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { randomUUID } from "node:crypto";

export interface WebhookDeliveryJobData {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  retryCount?: number;
  deliveryId?: string;
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 60_000;

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(hostname));
}

async function resolveHostname(url: string): Promise<string[]> {
  try {
    const { hostname } = new URL(url);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || /^\[.+\]$/.test(hostname)) {
      return [hostname.replace(/[[\]]/g, "")];
    }
    const dns = await import("node:dns/promises");
    const records = await dns.resolve4(hostname);
    return records;
  } catch {
    return [];
  }
}

async function validateWebhookUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs are allowed" };
    }
    if (isPrivateIp(parsed.hostname)) {
      return { valid: false, error: "Webhook URLs cannot point to private/internal IP addresses" };
    }
    const ips = await resolveHostname(url);
    for (const ip of ips) {
      if (isPrivateIp(ip)) {
        return { valid: false, error: "Webhook URL resolves to private/internal IP address" };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid webhook URL" };
  }
}

function createSupabaseClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export const webhookQueue = new Queue<WebhookDeliveryJobData>("webhook-delivery", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    attempts: MAX_RETRIES + 1,
    backoff: { type: "exponential", delay: BASE_DELAY_MS },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
  },
});

async function performWebhookDelivery(
  supabase: ReturnType<typeof createSupabaseClient>,
  webhookId: string,
  event: string,
  payload: Record<string, unknown>,
  retryCount: number,
): Promise<{ status: string; statusCode: number | null }> {
  const { data: endpoint } = await supabase
    .from("webhook_endpoints")
    .select("*")
    .eq("id", webhookId)
    .eq("is_active", true)
    .single();

  if (!endpoint) {
    logger.error({ webhookId }, "Webhook endpoint not found or inactive");
    return { status: "failed", statusCode: null };
  }

  const urlValidation = await validateWebhookUrl(endpoint.url);
  if (!urlValidation.valid) {
    logger.error({ webhookId, error: urlValidation.error }, "Webhook URL validation failed");
    await supabase
      .from("webhook_endpoints")
      .update({ last_failure_at: new Date().toISOString(), last_error: urlValidation.error })
      .eq("id", webhookId);
    return { status: "failed", statusCode: null };
  }

  const start = Date.now();
  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let deliveryError: string | null = null;
  let deliveryStatus = "success";

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (endpoint.secret) {
      const crypto = await import("node:crypto");
      const signature = crypto
        .createHmac("sha256", endpoint.secret)
        .update(JSON.stringify({ event, ...payload }))
        .digest("hex");
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    const body = JSON.stringify({ event, ...payload });
    const idempotencyKey = randomUUID();

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: { ...headers, "X-Idempotency-Key": idempotencyKey },
      body,
      signal: AbortSignal.timeout(10000),
    });

    responseStatus = response.status;
    responseBody = await response.text().catch(() => null);

    if (response.status >= 200 && response.status < 300) {
      await supabase
        .from("webhook_endpoints")
        .update({ last_success_at: new Date().toISOString() })
        .eq("id", webhookId);
    } else {
      deliveryStatus = "failed";
      deliveryError = `HTTP ${response.status}`;
      await supabase
        .from("webhook_endpoints")
        .update({ last_failure_at: new Date().toISOString(), last_error: deliveryError })
        .eq("id", webhookId);
    }
  } catch (err) {
    deliveryStatus = "failed";
    deliveryError = err instanceof Error ? err.message : String(err);
    await supabase
      .from("webhook_endpoints")
      .update({ last_failure_at: new Date().toISOString(), last_error: deliveryError })
      .eq("id", webhookId);
  }

  const durationMs = Date.now() - start;

  await supabase.from("webhook_deliveries").insert({
    webhook_id: webhookId,
    event,
    status: deliveryStatus,
    request_body: payload,
    response_status: responseStatus,
    response_body: responseBody,
    error: deliveryError,
    duration_ms: durationMs,
    retry_count: retryCount,
    dead_letter: false,
  });

  if (deliveryStatus === "failed" && retryCount >= MAX_RETRIES) {
    await supabase.from("webhook_dead_letters").insert({
      webhook_id: webhookId,
      event,
      request_body: payload,
      last_error: deliveryError,
      attempt_count: retryCount,
      last_attempt_at: new Date().toISOString(),
    });

    logger.error({ webhookId, event, attempts: retryCount }, "Webhook moved to dead letter queue");
  }

  return { status: deliveryStatus, statusCode: responseStatus };
}

export function registerWebhookProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const supabase = createSupabaseClient();

  const worker = new Worker<WebhookDeliveryJobData>(
    "webhook-delivery",
    async (job: Job<WebhookDeliveryJobData>) => {
      const { webhookId, event, payload, retryCount = 0 } = job.data;
      logger.info({ webhookId, event, retryCount }, "Processing webhook delivery");

      return performWebhookDelivery(supabase, webhookId, event, payload, retryCount);
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 10,
      limiter: { max: 100, duration: 60000 },
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, webhookId: job.data.webhookId }, "Webhook delivery job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, webhookId: job?.data.webhookId, error: String(err) },
      "Webhook delivery job failed",
    );
  });

  logger.info("Webhook delivery processor registered");
  return worker;
}
