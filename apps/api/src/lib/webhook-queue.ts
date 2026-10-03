import { Queue } from "bullmq";
import { loadEnv } from "../config/env.js";
import { logger } from "./logger.js";
import { BASE_DELAY_MS, MAX_RETRIES } from "@chat/config/webhook-utils.js";

/**
 * Durable webhook retry scheduling.
 *
 * Failed deliveries are not retried with an in-process `setTimeout` (which a
 * restart/pod eviction silently drops). Instead the first retry is added to the
 * shared BullMQ `webhook-delivery` queue with a deterministic `jobId` and a
 * delay; the worker owns the remaining attempts and the dead-letter transition.
 */
export interface WebhookRetryJobData {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  /** Cumulative retry number for the first attempt of the enqueued job. */
  retryCount: number;
  deliveryId: string;
  /** Stable per-delivery idempotency key, reused across every attempt. */
  idempotencyKey: string;
}

let queue: Queue<WebhookRetryJobData> | null = null;

export function getWebhookDeliveryQueue(): Queue<WebhookRetryJobData> | null {
  if (queue) return queue;

  const env = loadEnv();
  if (!env.REDIS_URL) {
    return null;
  }

  try {
    queue = new Queue<WebhookRetryJobData>("webhook-delivery", {
      connection: { url: env.REDIS_URL },
    });
    return queue;
  } catch (err) {
    logger.error("Failed to create webhook delivery queue", { error: String(err) });
    return null;
  }
}

export async function enqueueWebhookRetry(
  data: WebhookRetryJobData,
  delayMs: number,
): Promise<boolean> {
  const webhookQueue = getWebhookDeliveryQueue();
  if (!webhookQueue) {
    logger.error("Webhook retry not enqueued durably: REDIS_URL is not configured", {
      webhookId: data.webhookId,
      deliveryId: data.deliveryId,
    });
    return false;
  }

  // `data.retryCount` is the cumulative retry number for attemptsMade === 0.
  // Allow one BullMQ attempt per remaining retry so the worker's final attempt
  // lands on MAX_RETRIES and moves the delivery to the dead-letter queue.
  const remainingAttempts = Math.max(1, MAX_RETRIES - data.retryCount + 1);

  try {
    await webhookQueue.add("deliver", data, {
      delay: delayMs,
      jobId: `webhook-retry:${data.deliveryId}:${data.retryCount}`,
      attempts: remainingAttempts,
      backoff: { type: "exponential", delay: BASE_DELAY_MS },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 86400 },
    });
    return true;
  } catch (err) {
    logger.error("Failed to enqueue webhook retry", {
      webhookId: data.webhookId,
      deliveryId: data.deliveryId,
      error: String(err),
    });
    return false;
  }
}
