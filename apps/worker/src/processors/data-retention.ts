import { Worker, Job, Queue } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

export interface DataRetentionJobData {
  type:
    | "messages"
    | "audit_logs"
    | "consent_logs"
    | "notifications"
    | "soft_deleted_channels"
    | "soft_deleted_workspaces";
  olderThanDays?: number;
}

function createSupabaseClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export const dataRetentionQueue = new Queue<DataRetentionJobData>("data-retention", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
  },
});

async function retainMessages(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: messages, error: selectError } = await supabase
    .from("messages")
    .select("id")
    .neq("deleted_at", null)
    .lt("deleted_at", cutoff.toISOString())
    .limit(1000);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select old deleted messages for retention");
    return 0;
  }

  if (!messages || messages.length === 0) return 0;

  const ids = messages.map((m: { id: string }) => m.id);
  const { error: deleteError } = await supabase.from("messages").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete old messages");
    return 0;
  }

  logger.info(
    { count: ids.length, olderThanDays },
    "Data retention: cleaned up old deleted messages",
  );
  return ids.length;
}

async function retainAuditLogs(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: logs, error: selectError } = await supabase
    .from("audit_logs")
    .select("id")
    .lt("created_at", cutoff.toISOString())
    .limit(1000);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select old audit logs for retention");
    return 0;
  }

  if (!logs || logs.length === 0) return 0;

  const ids = logs.map((l: { id: string }) => l.id);
  const { error: deleteError } = await supabase.from("audit_logs").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete old audit logs");
    return 0;
  }

  logger.info({ count: ids.length, olderThanDays }, "Data retention: cleaned up old audit logs");
  return ids.length;
}

async function retainSoftDeletedChannels(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: channels, error: selectError } = await supabase
    .from("channels")
    .select("id")
    .neq("deleted_at", null)
    .lt("deleted_at", cutoff.toISOString())
    .limit(500);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select old deleted channels for retention");
    return 0;
  }

  if (!channels || channels.length === 0) return 0;

  const ids = channels.map((c: { id: string }) => c.id);
  const { error: deleteError } = await supabase.from("channels").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete old channels");
    return 0;
  }

  logger.info(
    { count: ids.length, olderThanDays },
    "Data retention: cleaned up old deleted channels",
  );
  return ids.length;
}

async function retainSoftDeletedWorkspaces(
  supabase: ReturnType<typeof createSupabaseClient>,
  olderThanDays: number,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data: workspaces, error: selectError } = await supabase
    .from("workspaces")
    .select("id")
    .neq("deleted_at", null)
    .lt("deleted_at", cutoff.toISOString())
    .limit(500);

  if (selectError) {
    logger.error({ error: selectError }, "Failed to select old deleted workspaces for retention");
    return 0;
  }

  if (!workspaces || workspaces.length === 0) return 0;

  const ids = workspaces.map((w: { id: string }) => w.id);
  const { error: deleteError } = await supabase.from("workspaces").delete().in("id", ids);

  if (deleteError) {
    logger.error({ error: deleteError }, "Failed to delete old workspaces");
    return 0;
  }

  logger.info(
    { count: ids.length, olderThanDays },
    "Data retention: cleaned up old deleted workspaces",
  );
  return ids.length;
}

export function registerDataRetentionProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const supabase = createSupabaseClient();

  const worker = new Worker<DataRetentionJobData>(
    "data-retention",
    async (job: Job<DataRetentionJobData>) => {
      const { type, olderThanDays = 90 } = job.data;
      logger.info({ type, olderThanDays }, "Processing data retention job");

      let cleaned = 0;
      switch (type) {
        case "messages":
          cleaned = await retainMessages(supabase, olderThanDays);
          break;
        case "audit_logs":
          cleaned = await retainAuditLogs(supabase, olderThanDays);
          break;
        case "soft_deleted_channels":
          cleaned = await retainSoftDeletedChannels(supabase, olderThanDays);
          break;
        case "soft_deleted_workspaces":
          cleaned = await retainSoftDeletedWorkspaces(supabase, olderThanDays);
          break;
        default:
          logger.warn({ type }, "Unknown data retention job type");
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      logger.info(
        { type, cutoffDate: cutoffDate.toISOString(), cleaned },
        "Data retention job completed",
      );
      return { status: "retained", type, cutoffDate: cutoffDate.toISOString(), cleaned };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, type: job.data.type }, "Data retention job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, type: job?.data.type, error: String(err) },
      "Data retention job failed",
    );
  });

  logger.info("Data retention processor registered");
  return worker;
}
