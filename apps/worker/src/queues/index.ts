import { Queue } from "bullmq";
import Redis from "ioredis";
import { loadEnv } from "@chat/config/env-schema.js";

export const QUEUE_NAMES = {
  WEBHOOK_DELIVERY: "webhook-delivery",
  NOTIFICATION: "notification",
  SEARCH_INDEXING: "search-indexing",
  CLEANUP: "cleanup",
} as const;

function getRedisClient(): Redis {
  const env = loadEnv();
  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL not configured");
  }
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

export function createWebhookQueue(): Queue {
  return new Queue("webhook-delivery", {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 60000,
      },
    },
  });
}

export function createNotificationQueue(): Queue {
  return new Queue("notification", {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30000,
      },
    },
  });
}

export function createSearchQueue(): Queue {
  return new Queue("search-indexing", {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 10000,
      },
    },
  });
}

export function createCleanupQueue(): Queue {
  return new Queue("cleanup", {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 1,
    },
  });
}
