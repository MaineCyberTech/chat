import { Worker, Job, Queue } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createSupabaseClient } from "../lib/supabase.js";

export interface CleanupJobData {
  type:
    | "old_deliveries"
    | "dead_letters"
    | "consent_logs"
    | "stale_sessions"
    | "expired_uploads"
    | "message_edit_history"
    | "stale_uploads"
    | "expired_tokens";
  olderThanDays?: number;
}

export const cleanupQueue = new Queue<CleanupJobData>("cleanup", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
  },
});

async function cleanupOldDeliveries(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
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
  const { error: deleteError } = await supabase.from("webhook_deliveries").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete old deliveries");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Cleaned up old webhook deliveries");
  return ids.length;
}

async function cleanupDeadLetters(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
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
  const { error: deleteError } = await supabase.from("webhook_dead_letters").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete dead letters");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Cleaned up old dead letters");
  return ids.length;
}

async function cleanupConsentLogs(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
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
  const { error: deleteError } = await supabase.from("consent_logs").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete consent logs");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Cleaned up old consent logs");
  return ids.length;
}

async function cleanupMessageEditHistory(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: edits, error: selectError } = await supabase
    .from("message_edit_history")
    .select("id")
    .lt("edited_at", cutoff.toISOString())
    .limit(1000);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select old message edit history for cleanup");
    return 0;
  }

  if (!edits || edits.length === 0) return 0;

  const ids = edits.map((e: { id: string }) => e.id);
  const { error: deleteError } = await supabase.from("message_edit_history").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete old message edit history");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Cleaned up old message edit history");
  return ids.length;
}

async function cleanupStaleUploads(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: objects, error: listError } = await supabase
    .schema("storage")
    .from("objects")
    .select("name")
    .eq("bucket_id", "chat-uploads")
    .lt("created_at", cutoff.toISOString())
    .limit(200)
    .abortSignal(AbortSignal.timeout(15000));

  if (listError) {
    logger.error({ error: listError }, "Failed to list stale uploads from storage");
    return 0;
  }

  if (!objects || objects.length === 0) return 0;

  const names: string[] = (objects as { name: string }[]).map((o) => o.name);
  const { error: delError } = await supabase.storage
    .from("chat-uploads")
    .remove(names);

  if (delError) {
    logger.error({ error: delError }, "Failed to delete stale uploads from storage");
    return 0;
  }

  logger.info({ count: names.length, olderThanDays }, "Cleaned up stale uploads");
  return names.length;
}

async function cleanupExpiredTokens(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { error: delError } = await supabase
    .schema("auth")
    .from("refresh_tokens")
    .delete({ count: "exact" })
    .lt("updated_at", cutoff.toISOString())
    .abortSignal(AbortSignal.timeout(15000));

  if (delError) {
    logger.error({ error: delError }, "Failed to clean up expired tokens");
    return 0;
  }

  logger.info({ olderThanDays }, "Cleaned up expired auth tokens");
  return 1;
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
      const signal = AbortSignal.timeout(30000);
      const { type, olderThanDays = 30 } = job.data;
      logger.info({ type, olderThanDays }, "Processing cleanup job");

      const work = async () => {
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
          case "message_edit_history":
            cleaned = await cleanupMessageEditHistory(supabase, olderThanDays);
            break;
          case "stale_sessions":
            logger.info({ type }, "Stale session cleanup handled by Supabase auth hooks");
            break;
          case "expired_uploads":
            logger.info({ type }, "Expired upload cleanup not implemented via DB (use stale_uploads)");
            break;
          case "stale_uploads":
            cleaned = await cleanupStaleUploads(supabase, olderThanDays);
            break;
          case "expired_tokens":
            cleaned = await cleanupExpiredTokens(supabase, olderThanDays);
            break;
          default:
            logger.warn({ type }, "Unknown cleanup job type");
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        logger.info(
          { type, cutoffDate: cutoffDate.toISOString(), cleaned },
          "Cleanup job completed",
        );
        return { status: "cleaned", type, cutoffDate: cutoffDate.toISOString(), cleaned };
      };

      return await Promise.race([
        work(),
        new Promise<never>((_, reject) => {
          signal.addEventListener("abort", () => reject(new Error("Job timed out after 30s")), {
            once: true,
          });
        }),
      ]);
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
