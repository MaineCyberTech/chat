import { Worker, Job } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  channels?: ("push" | "email" | "in_app")[];
}

export function registerNotificationProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");

  const worker = new Worker<NotificationJobData>(
    "notification",
    async (job: Job<NotificationJobData>) => {
      const { userId, type, channels = ["in_app"] } = job.data;

      logger.info({ userId, type, channels }, "Processing notification");

      // TODO: Implement actual notification delivery
      // This would:
      // 1. Create in-app notification in database
      // 2. Send push notification if "push" in channels
      // 3. Send email if "email" in channels and user has email enabled

      logger.info({ userId, type }, "Notification processed");
      return { status: "sent", channels };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 20,
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, userId: job.data.userId }, "Notification job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, userId: job?.data.userId, error: String(err) },
      "Notification job failed",
    );
  });

  logger.info("Notification processor registered");
  return worker;
}
