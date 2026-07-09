import { logger } from "@chat/config/logger.js";
import { dataRetentionQueue } from "./processors/data-retention.js";
import { cleanupQueue } from "./processors/cleanup.js";

type DataRetentionJobData = {
  type:
    | "messages"
    | "audit_logs"
    | "consent_logs"
    | "notifications"
    | "soft_deleted_channels"
    | "soft_deleted_workspaces";
  olderThanDays?: number;
};

type CleanupJobData = {
  type: "old_deliveries" | "dead_letters" | "consent_logs" | "stale_sessions" | "expired_uploads";
  olderThanDays?: number;
};

const RETENTION_SCHEDULE: { type: DataRetentionJobData["type"]; olderThanDays: number }[] = [
  { type: "messages", olderThanDays: 365 },
  { type: "audit_logs", olderThanDays: 90 },
  { type: "consent_logs", olderThanDays: 730 },
  { type: "soft_deleted_channels", olderThanDays: 30 },
  { type: "soft_deleted_workspaces", olderThanDays: 30 },
];

const CLEANUP_SCHEDULE: { type: CleanupJobData["type"]; olderThanDays: number }[] = [
  { type: "old_deliveries", olderThanDays: 7 },
  { type: "dead_letters", olderThanDays: 14 },
  { type: "consent_logs", olderThanDays: 730 },
  { type: "stale_sessions", olderThanDays: 90 },
  { type: "expired_uploads", olderThanDays: 7 },
];

async function runDataRetention() {
  logger.info("Running scheduled data retention");
  for (const item of RETENTION_SCHEDULE) {
    try {
      await dataRetentionQueue.add("retention", item, {
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      });
      logger.debug({ type: item.type }, "Enqueued data retention job");
    } catch (err) {
      logger.error({ type: item.type, error: String(err) }, "Failed to enqueue data retention job");
    }
  }
}

async function runCleanup() {
  logger.info("Running scheduled cleanup");
  for (const item of CLEANUP_SCHEDULE) {
    try {
      await cleanupQueue.add("cleanup", item, {
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      });
      logger.debug({ type: item.type }, "Enqueued cleanup job");
    } catch (err) {
      logger.error({ type: item.type, error: String(err) }, "Failed to enqueue cleanup job");
    }
  }
}

export function startScheduler() {
  runDataRetention().catch((err) =>
    logger.error({ error: String(err) }, "Initial data retention run failed"),
  );
  runCleanup().catch((err) => logger.error({ error: String(err) }, "Initial cleanup run failed"));

  setInterval(
    () => {
      runDataRetention().catch((err) =>
        logger.error({ error: String(err) }, "Data retention run failed"),
      );
    },
    24 * 60 * 60 * 1000,
  );

  setInterval(
    () => {
      runCleanup().catch((err) => logger.error({ error: String(err) }, "Cleanup run failed"));
    },
    6 * 60 * 60 * 1000,
  );

  logger.info("Maintenance scheduler started (retention: 24h, cleanup: 6h)");
}
