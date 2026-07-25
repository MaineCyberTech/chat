import { logger } from "@chat/config/logger.js";
import { createSupabaseClient } from "./lib/supabase.js";
import { dataRetentionQueue } from "./processors/data-retention.js";
import { cleanupQueue } from "./processors/cleanup.js";
import { complianceExportQueue } from "./processors/compliance-export.js";

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
  type: "old_deliveries" | "dead_letters" | "consent_logs" | "stale_sessions" | "expired_uploads" | "message_edit_history";
  olderThanDays?: number;
};

const RETENTION_SCHEDULE: { type: DataRetentionJobData["type"]; olderThanDays: number }[] = [
  { type: "messages", olderThanDays: 365 },
  { type: "audit_logs", olderThanDays: 90 },
  { type: "consent_logs", olderThanDays: 730 },
  { type: "soft_deleted_channels", olderThanDays: 30 },
  { type: "soft_deleted_workspaces", olderThanDays: 30 },
  { type: "notifications", olderThanDays: 30 },
];

const CLEANUP_SCHEDULE: { type: CleanupJobData["type"]; olderThanDays: number }[] = [
  { type: "old_deliveries", olderThanDays: 7 },
  { type: "dead_letters", olderThanDays: 14 },
  { type: "consent_logs", olderThanDays: 730 },
  { type: "stale_sessions", olderThanDays: 90 },
  { type: "expired_uploads", olderThanDays: 7 },
  { type: "message_edit_history", olderThanDays: 365 },
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

async function runComplianceExport() {
  logger.info("Running scheduled compliance export");
  const supabase = createSupabaseClient();

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  const types: ("messages" | "audit_logs")[] = ["messages", "audit_logs"];
  for (const type of types) {
    try {
      const { data: record, error } = await supabase
        .from("compliance_exports")
        .insert({
          type,
          date_from: startDate.toISOString(),
          date_to: endDate.toISOString(),
          status: "pending",
          row_count: 0,
        })
        .select("id")
        .single();

      if (error || !record) {
        logger.error({ type, error }, "Failed to create export record");
        continue;
      }

      await complianceExportQueue.add(
        "compliance-export",
        {
          type,
          dateFrom: startDate.toISOString(),
          dateTo: endDate.toISOString(),
          exportId: record.id,
        },
        {
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      );
      logger.debug({ type, exportId: record.id }, "Enqueued compliance export");
    } catch (err) {
      logger.error({ type, error: String(err) }, "Failed to enqueue compliance export");
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

  runComplianceExport().catch((err) =>
    logger.error({ error: String(err) }, "Initial compliance export run failed"),
  );

  setInterval(
    () => {
      runComplianceExport().catch((err) =>
        logger.error({ error: String(err) }, "Compliance export run failed"),
      );
    },
    24 * 60 * 60 * 1000,
  );

  logger.info(
    "Maintenance scheduler started (retention: 24h, cleanup: 6h, compliance export: 24h)",
  );
}
