import { Queue } from "bullmq";
import Redis from "ioredis";
import { loadEnv } from "@chat/config/env-schema.js";

export const QUEUE_NAMES = {
  WEBHOOK_DELIVERY: "webhook-delivery",
  NOTIFICATION: "notification",
  SEARCH_INDEXING: "search-indexing",
  CLEANUP: "cleanup",
  DATA_RETENTION: "data-retention",
} as const;

function getRedisClient(): Redis | null {
  const env = loadEnv();
  if (!env.REDIS_URL) {
    return null;
  }
  try {
    return new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      enableReadyCheck: true,
      lazyConnect: false,
    });
  } catch {
    return null;
  }
}

function createQueue(name: string, defaultJobOptions: Record<string, unknown>): Queue | null {
  const connection = getRedisClient();
  if (!connection) {
    return null;
  }
  try {
    return new Queue(name, { connection, defaultJobOptions } as never);
  } catch {
    return null;
  }
}

export function createWebhookQueue(): Queue | null {
  return createQueue("webhook-delivery", {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 60000,
    },
  });
}

export function createNotificationQueue(): Queue | null {
  return createQueue("notification", {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30000,
    },
  });
}

export function createSearchQueue(): Queue | null {
  return createQueue("search-indexing", {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  });
}

export function createCleanupQueue(): Queue | null {
  return createQueue("cleanup", {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 1,
  });
}

export function createDataRetentionQueue(): Queue | null {
  return createQueue("data-retention", {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 1,
  });
}
