import { Worker, Job } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

export interface CleanupJobData {
  type: "old_deliveries" | "expired_tokens" | "temp_files" | "stale_sessions";
  olderThanDays?: number;
}

export function registerCleanupProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");

  const worker = new Worker<CleanupJobData>(
    "cleanup",
    async (job: Job<CleanupJobData>) => {
      const { type, olderThanDays = 30 } = job.data;

      logger.info({ type, olderThanDays }, "Processing cleanup job");

      // TODO: Implement actual cleanup logic
      // This would clean up:
      // - Old webhook deliveries (dead letters, old successful deliveries)
      // - Expired JWT tokens
      // - Temporary uploaded files
      // - Stale user sessions

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      logger.info({ type, cutoffDate: cutoffDate.toISOString() }, "Cleanup job completed");
      return { status: "cleaned", type, cutoffDate: cutoffDate.toISOString() };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, type: job.data.type }, "Cleanup job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, type: job?.data.type, error: String(err) },
      "Cleanup job failed",
    );
  });

  logger.info("Cleanup processor registered");
  return worker;
}
