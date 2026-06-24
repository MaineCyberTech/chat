import { Worker, Job } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

export interface SearchIndexingJobData {
  type: "message_created" | "message_updated" | "message_deleted";
  messageId: string;
  workspaceId: string;
  channelId: string;
  content?: string;
}

export function registerSearchIndexer() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");

  const worker = new Worker<SearchIndexingJobData>(
    "search-indexing",
    async (job: Job<SearchIndexingJobData>) => {
      const { type, messageId, workspaceId, channelId } = job.data;

      logger.info({ type, messageId, workspaceId, channelId }, "Processing search indexing");

      // TODO: Implement actual search indexing
      // This would update the full-text search index (tsvector in PostgreSQL)
      // using the search_messages RPC or directly updating the tsvector column

      logger.debug({ type, messageId }, "Search indexing job completed");
      return { status: "indexed", type };
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
