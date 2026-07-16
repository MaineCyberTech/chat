import { Worker, Job, Queue } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createSupabaseClient } from "../lib/supabase.js";

export interface SearchIndexingJobData {
  type: "message_created" | "message_updated" | "message_deleted";
  messageId: string;
  workspaceId: string;
  channelId: string;
  content?: string;
}

export const searchQueue = new Queue<SearchIndexingJobData>("search-indexing", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

async function updateMessageIndex(
  supabase: ReturnType<typeof createSupabaseClient>,
  messageId: string,
  content: string | undefined,
): Promise<boolean> {
  const contentToIndex = content ?? null;

  const { error } = await supabase.rpc("update_message_search_index", {
    p_message_id: messageId,
    p_content: contentToIndex,
  });

  if (error) {
    logger.warn({ messageId, error: error.message }, "RPC not available, using direct SQL update");

    if (contentToIndex) {
      const { error: updateError } = await supabase
        .from("messages")
        .update({
          search_vector: supabase.rpc("to_tsvector", {
            english: contentToIndex,
          }) as unknown as undefined,
        })
        .eq("id", messageId);

      if (updateError) {
        logger.error({ messageId, error: updateError }, "Failed to update search index");
        return false;
      }
    }
    return true;
  }

  return true;
}

async function removeMessageFromIndex(
  supabase: ReturnType<typeof createSupabaseClient>,
  messageId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("messages")
    .update({ search_vector: null })
    .eq("id", messageId);

  if (error) {
    logger.error({ messageId, error }, "Failed to remove message from search index");
    return false;
  }
  return true;
}

export function registerSearchIndexer() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const supabase = createSupabaseClient();

  const worker = new Worker<SearchIndexingJobData>(
    "search-indexing",
    async (job: Job<SearchIndexingJobData>) => {
      const signal = AbortSignal.timeout(30000);
      const { type, messageId, workspaceId, channelId, content } = job.data;
      logger.info({ type, messageId, workspaceId, channelId }, "Processing search indexing");

      const work = async () => {
        let success = false;

        switch (type) {
          case "message_created":
          case "message_updated":
            success = await updateMessageIndex(supabase, messageId, content);
            break;
          case "message_deleted":
            success = await removeMessageFromIndex(supabase, messageId);
            break;
        }

        logger.debug({ type, messageId, success }, "Search indexing job completed");
        return { status: success ? "indexed" : "failed", type };
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
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, type: job.data.type }, "Search indexing job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, type: job?.data.type, error: String(err) },
      "Search indexing job failed",
    );
  });

  logger.info("Search indexer processor registered");
  return worker;
}
