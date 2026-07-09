import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

const env = loadEnv();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function processReminders() {
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
      return;
    }

    if (!due || due.length === 0) return;

    for (const reminder of due) {
      try {
        // Create a notification for the user
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

        // Mark as notified
        await supabase.from("message_reminders").update({ notified: true }).eq("id", reminder.id);
      } catch (err) {
        logger.error({ id: reminder.id, error: String(err) }, "Failed to process reminder");
      }
    }

    logger.info(`Processed ${due.length} reminders`);
  } catch (err) {
    if (controller.signal.aborted) {
      logger.error("Reminder processor timed out after 30s");
    } else {
      logger.error({ error: String(err) }, "Reminder processor failed");
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
