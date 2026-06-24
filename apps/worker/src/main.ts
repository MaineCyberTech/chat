import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createRedisClient } from "./lib/redis.js";
import { registerWebhookProcessor } from "./processors/webhook-delivery.js";
import { registerNotificationProcessor } from "./processors/notification.js";
import { registerSearchIndexer } from "./processors/search-indexer.js";
import { registerCleanupProcessor } from "./processors/cleanup.js";

loadEnv();

async function main() {
  logger.info("Starting worker process");

  // Create Redis client
  const redis = createRedisClient();
  if (!redis) {
    logger.error("Failed to create Redis client, exiting");
    process.exit(1);
  }

  // Register processors (they create their own queues internally)
  registerWebhookProcessor();
  registerNotificationProcessor();
  registerSearchIndexer();
  registerCleanupProcessor();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down worker");

    // Note: In a production setup, you'd want to properly close all workers
    // For now, we just close the Redis connection
    await redis.quit();
    logger.info("Worker shut down complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  logger.info("Worker started successfully");
}

main().catch((err) => {
  logger.error({ error: String(err) }, "Worker failed to start");
  process.exit(1);
});
