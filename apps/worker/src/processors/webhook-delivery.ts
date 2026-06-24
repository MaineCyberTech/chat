import { Worker, Job } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

export interface WebhookDeliveryJobData {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  retryCount?: number;
  deliveryId?: string;
}

export function registerWebhookProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");

  const worker = new Worker<WebhookDeliveryJobData>(
    "webhook-delivery",
    async (job: Job<WebhookDeliveryJobData>) => {
      const { webhookId, event, payload, retryCount = 0 } = job.data;
      const start = Date.now();

      logger.info({ webhookId, event, retryCount }, "Processing webhook delivery");

      try {
        // TODO: Implement actual webhook delivery using the SDK or fetch
        // For now, this is a placeholder that would call the actual webhook delivery logic
        const response = await fetchWebhook(webhookId, event, payload);

        const durationMs = Date.now() - start;

        if (response.status >= 200 && response.status < 300) {
          logger.info({ webhookId, event, durationMs }, "Webhook delivery succeeded");
          return { status: "success", statusCode: response.status };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        const durationMs = Date.now() - start;
        logger.error(
          { webhookId, event, error: String(err), durationMs },
          "Webhook delivery failed",
        );
        throw err;
      }
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 60000,
      },
    },
  );

  worker.on("completed", (job) => {
    logger.debug(
      { jobId: job.id, webhookId: job.data.webhookId },
      "Webhook delivery job completed",
    );
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

async function fetchWebhook(
  _webhookId: string,
  _event: string,
  _payload: Record<string, unknown>,
): Promise<Response> {
  // TODO: Implement actual webhook fetching logic
  // This would typically:
  // 1. Fetch webhook endpoint from database
  // 2. Create HMAC signature
  // 3. Send HTTP request with proper headers
  // 4. Handle retries and dead letter queue
  // For now, return a mock success response
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
