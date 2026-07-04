import { Worker, Job, Queue } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

export interface CleanupJobData {
  type: "old_deliveries" | "dead_letters" | "consent_logs" | "stale_sessions" | "expired_uploads";
  olderThanDays?: number;
}

function createSupabaseClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export const cleanupQueue = new Queue<CleanupJobData>("cleanup", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
  },
});

async function cleanupOldDeliveries(supabase: ReturnType<typeof createSupabaseClient>, olderThanDays: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: deliveries, error: selectError } = await supabase
    .from("webhook_deliveries")
    .select("id")
    .eq("status", "success")
    .lt("created_at", cutoff.toISOString())
    .limit(1000);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select old deliveries for cleanup");
    return 0;
  }

  if (!deliveries || deliveries.length === 0) return 0;

  const ids = deliveries.map((d: { id: string }) => d.id);
  const { error: deleteError } = await supabase
    .from("webhook_deliveries")
    .delete()
    .in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete old deliveries");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Cleaned up old webhook deliveries");
  return ids.length;
}

async function cleanupDeadLetters(supabase: ReturnType<typeof createSupabaseClient>, olderThanDays: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: letters, error: selectError } = await supabase
    .from("webhook_dead_letters")
    .select("id")
    .lt("created_at", cutoff.toISOString())
    .limit(500);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select dead letters for cleanup");
    return 0;
  }

  if (!letters || letters.length === 0) return 0;

  const ids = letters.map((d: { id: string }) => d.id);
  const { error: deleteError } = await supabase
    .from("webhook_dead_letters")
    .delete()
    .in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete dead letters");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Cleaned up old dead letters");
  return ids.length;
}

async function cleanupConsentLogs(supabase: ReturnType<typeof createSupabaseClient>, olderThanDays: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: logs, error: selectError } = await supabase
    .from("consent_logs")
    .select("id")
    .lt("created_at", cutoff.toISOString())
    .limit(500);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select consent logs for cleanup");
    return 0;
  }

  if (!logs || logs.length === 0) return 0;

  const ids = logs.map((l: { id: string }) => l.id);
  const { error: deleteError } = await supabase
    .from("consent_logs")
    .delete()
    .in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete consent logs");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Cleaned up old consent logs");
  return ids.length;
}

export function registerCleanupProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const supabase = createSupabaseClient();

  const worker = new Worker<CleanupJobData>(
    "cleanup",
    async (job: Job<CleanupJobData>) => {
      const { type, olderThanDays = 30 } = job.data;
      logger.info({ type, olderThanDays }, "Processing cleanup job");

      let cleaned = 0;
      switch (type) {
        case "old_deliveries":
          cleaned = await cleanupOldDeliveries(supabase, olderThanDays);
          break;
        case "dead_letters":
          cleaned = await cleanupDeadLetters(supabase, olderThanDays);
          break;
        case "consent_logs":
          cleaned = await cleanupConsentLogs(supabase, olderThanDays);
          break;
        case "expired_uploads":
          logger.info({ type }, "Expired upload cleanup not yet implemented");
          break;
        default:
          logger.warn({ type }, "Unknown cleanup job type");
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      logger.info({ type, cutoffDate: cutoffDate.toISOString(), cleaned }, "Cleanup job completed");
      return { status: "cleaned", type, cutoffDate: cutoffDate.toISOString(), cleaned };
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
