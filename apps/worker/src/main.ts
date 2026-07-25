import { createServer } from "node:http";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createRedisClient } from "./lib/redis.js";
import { registerWebhookProcessor, webhookQueue } from "./processors/webhook-delivery.js";
import { registerNotificationProcessor, notificationQueue } from "./processors/notification.js";
import { registerSearchIndexer, searchQueue } from "./processors/search-indexer.js";
import { registerCleanupProcessor, cleanupQueue } from "./processors/cleanup.js";
import { registerDataRetentionProcessor, dataRetentionQueue } from "./processors/data-retention.js";
import { registerComplianceExportProcessor, complianceExportQueue } from "./processors/compliance-export.js";
import { registerReminderProcessor, reminderQueue } from "./processors/reminder.js";
import { startScheduler } from "./scheduler.js";

loadEnv();

const HEALTH_PORT = parseInt(process.env.HEALTH_PORT ?? "4100", 10);

async function gatherMetrics() {
  const queues = [
    { name: "webhook-delivery", queue: webhookQueue },
    { name: "notification", queue: notificationQueue },
    { name: "search-indexing", queue: searchQueue },
    { name: "cleanup", queue: cleanupQueue },
    { name: "data-retention", queue: dataRetentionQueue },
    { name: "compliance-export", queue: complianceExportQueue },
    { name: "reminder", queue: reminderQueue },
  ];

  const metrics: Record<string, unknown> = {};
  for (const { name, queue } of queues) {
    try {
      const counts = await queue.getJobCounts(
        "waiting", "active", "completed", "failed", "delayed", "paused",
      );
      const failed = await queue.getFailedCount();
      metrics[name] = {
        ...counts,
        failed_total: failed,
      };
    } catch {
      metrics[name] = { error: "unavailable" };
    }
  }

  return {
    timestamp: new Date().toISOString(),
    service: "worker",
    queues: metrics,
  };
}

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
    } else if (req.url === "/metrics") {
      try {
        const body = JSON.stringify(await gatherMetrics());
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(body);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "metrics unavailable" }));
      }
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
  registerDataRetentionProcessor();
  registerComplianceExportProcessor();
  registerReminderProcessor();

  const queues = [webhookQueue, notificationQueue, searchQueue, cleanupQueue, dataRetentionQueue, complianceExportQueue, reminderQueue];

  startScheduler();

  const forceExit = setTimeout(() => {
    logger.error("Worker forced shutdown after timeout");
    process.exit(1);
  }, 30_000).unref();

  const shutdown = async (signal: string) => {
    clearTimeout(forceExit);
    logger.info({ signal }, "Shutting down worker");
    await new Promise<void>((resolve) => healthServer.close(() => resolve()));

    for (const q of queues) {
      try {
        await q.pause();
        await q.close();
      } catch (err) {
        logger.error({ queue: q.name, error: String(err) }, "Failed to close queue");
      }
    }

    try {
      await redis.quit();
    } catch (err) {
      logger.error({ error: String(err) }, "Failed to quit Redis");
    }

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
