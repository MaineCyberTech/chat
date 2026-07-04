import { createServer } from "node:http";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createRedisClient } from "./lib/redis.js";
import { registerWebhookProcessor } from "./processors/webhook-delivery.js";
import { registerNotificationProcessor } from "./processors/notification.js";
import { registerSearchIndexer } from "./processors/search-indexer.js";
import { registerCleanupProcessor } from "./processors/cleanup.js";

loadEnv();

const HEALTH_PORT = parseInt(process.env.HEALTH_PORT ?? "4100", 10);

function startHealthServer(redis: ReturnType<typeof createRedisClient>) {
  const server = createServer(async (req, res) => {
    if (req.url === "/healthz" || req.url === "/health") {
      const redisOk = redis?.status === "ready";
      const status = redisOk ? "healthy" : "degraded";
      const body = JSON.stringify({
        status,
        service: "worker",
        redis: redisOk,
        timestamp: new Date().toISOString(),
      });
      res.writeHead(redisOk ? 200 : 503, { "Content-Type": "application/json" });
      res.end(body);
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "running", service: "worker" }));
    }
  });
  server.listen(HEALTH_PORT, () => logger.info({ port: HEALTH_PORT }, "Health server started"));
  return server;
}

async function main() {
  logger.info("Starting worker process");

  // Create Redis client
  const redis = createRedisClient();
  if (!redis) {
    logger.error("Failed to create Redis client, exiting");
    process.exit(1);
  }

  // Start health endpoint
  const healthServer = startHealthServer(redis);

  // Register processors (they create their own queues internally)
  registerWebhookProcessor();
  registerNotificationProcessor();
  registerSearchIndexer();
  registerCleanupProcessor();

  // Poll for due reminders every 30 seconds
  const { processReminders } = await import("./processors/reminder.js");
  setInterval(() => {
    processReminders().catch((err: unknown) =>
      logger.error({ error: String(err) }, "Reminder poll failed"),
    );
  }, 30_000);
  processReminders().catch((err: unknown) =>
    logger.error({ error: String(err) }, "Initial reminder poll failed"),
  );

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down worker");
    healthServer.close();
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
