import { Worker, Job, Queue } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createSupabaseClient } from "../lib/supabase.js";

export interface ReminderJobData {
  _scheduler: true;
}

export const reminderQueue = new Queue<ReminderJobData>("reminder", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

async function processDueReminders() {
  const supabase = createSupabaseClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const now = new Date().toISOString();
    const { data: due, error } = await supabase
      .from("message_reminders")
      .select("*, messages!inner(content, channel_id, user_id)")
      .eq("notified", false)
      .lte("remind_at", now);

    if (error) {
      logger.error({ error: error.message }, "Failed to fetch due reminders");
      return { processed: 0, error: error.message };
    }

    if (!due || due.length === 0) return { processed: 0 };

    for (const reminder of due) {
      try {
        await supabase.from("notifications").insert({
          user_id: reminder.user_id,
          type: "reminder",
          title: "Reminder",
          body: `You asked to be reminded: ${(reminder as Record<string, unknown>).messages ? ((reminder as Record<string, unknown>).messages as Record<string, unknown>).content : ""}`,
          data: {
            message_id: reminder.message_id,
            channel_id: ((reminder as Record<string, unknown>).messages as Record<string, unknown>)
              .channel_id,
          },
        });

        await supabase.from("message_reminders").update({ notified: true }).eq("id", reminder.id);
      } catch (err) {
        logger.error({ id: reminder.id, error: String(err) }, "Failed to process reminder");
      }
    }

    logger.info(`Processed ${due.length} reminders`);
    return { processed: due.length };
  } catch (err) {
    if (controller.signal.aborted) {
      logger.error("Reminder processor timed out after 30s");
    } else {
      logger.error({ error: String(err) }, "Reminder processor failed");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function registerReminderProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("REDIS_URL not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const worker = new Worker<ReminderJobData>(
    "reminder",
    async (job: Job<ReminderJobData>) => {
      logger.info("Processing due reminders");
      return await processDueReminders();
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id }, "Reminder job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, error: String(err) }, "Reminder job failed");
  });

  logger.info("Reminder processor registered");
  return worker;
}
