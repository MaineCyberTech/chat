import Redis from "ioredis";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

let redisClient: Redis | null = null;

export function createRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const env = loadEnv();
  if (!env.REDIS_URL) {
    return null;
  }

  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });

    client.on("error", (err: Error) => logger.error({ error: err.message }, "Redis client error"));

    client
      .connect()
      .catch((err: Error) => logger.warn({ error: err.message }, "Redis connection failed"));

    redisClient = client;
    return client;
  } catch (err) {
    logger.warn({ error: String(err) }, "Failed to initialize Redis client");
    return null;
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}
