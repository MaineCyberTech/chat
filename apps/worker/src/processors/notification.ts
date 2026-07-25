import { Worker, Job, Queue } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createSupabaseClient } from "../lib/supabase.js";

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  channels?: ("push" | "email" | "in_app")[];
  workspaceId?: string;
  link?: string;
}

export const notificationQueue = new Queue<NotificationJobData>("notification", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
  },
});

async function deliverInApp(
  supabase: ReturnType<typeof createSupabaseClient>,
  data: NotificationJobData,
): Promise<boolean> {
  const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", data.userId)
    .eq("type", data.type)
    .eq("body", data.message)
    .gte("created_at", tenSecondsAgo)
    .limit(1);

  if (existing && existing.length > 0) {
    logger.debug({ userId: data.userId, type: data.type }, "Duplicate in-app notification suppressed");
    return true;
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: data.userId,
    workspace_id: data.workspaceId ?? null,
    type: data.type,
    title: data.title,
    body: data.message,
    link: data.link ?? null,
    read: false,
  });

  if (error) {
    logger.error({ error, userId: data.userId }, "Failed to create in-app notification");
    return false;
  }
  return true;
}

async function deliverPush(
  supabase: ReturnType<typeof createSupabaseClient>,
  data: NotificationJobData,
): Promise<boolean> {
  const env = loadEnv();
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    logger.warn("VAPID keys not configured, skipping push notification");
    return false;
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", data.userId);

  if (!subscriptions || subscriptions.length === 0) return false;

  let sentCount = 0;
  for (const sub of subscriptions) {
    try {
      const payload = JSON.stringify({
        title: data.title,
        body: data.message,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: `chat-${data.type}`,
        data: { url: data.link ?? "/", ...data.data },
      });

      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TTH-TTTP-Public-Key": env.VAPID_PUBLIC_KEY!,
          Authorization: `WebPush ${env.VAPID_PRIVATE_KEY}`,
        },
        body: payload,
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        logger.info({ userId: data.userId }, "Removed expired push subscription");
      } else if (response.ok) {
        sentCount++;
      }
    } catch (err) {
      logger.warn({ userId: data.userId, error: String(err) }, "Push delivery failed");
    }
  }

  return sentCount > 0;
}

async function withPerChannelRetry(
  channel: string,
  fn: () => Promise<boolean>,
  maxRetries = 2,
): Promise<boolean> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const ok = await fn();
      if (ok) return true;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      logger.warn(
        { channel, attempt, error: String(err) },
        "Channel delivery attempt failed",
      );
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function deliverEmail(
  supabase: ReturnType<typeof createSupabaseClient>,
  data: NotificationJobData,
): Promise<boolean> {
  const env = loadEnv();
  if (!env.SMTP_HOST || !env.SMTP_FROM) {
    logger.warn("SMTP not configured, skipping email notification");
    return false;
  }

  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", data.userId)
    .single();

  if (!user?.email) return false;

  if (!EMAIL_REGEX.test(user.email)) {
    logger.warn({ userId: data.userId, email: user.email }, "Invalid email address, skipping email notification");
    return false;
  }

  /*
   * Daily digest email template:
   *   Subject:  "Your Chat Digest — {{date}}"
   *   Template: Handlebars-based HTML email with:
   *     - Unread channel summaries (channel name + last message preview)
   *     - @mentions section (bold, with link to thread)
   *     - Top pinned messages
   *     - Footer with "View all notifications" link and
   *       "Unsubscribe from digest" link (one-click)
   *   Variables expected in `data.digest` when type="digest":
   *     { channels: {name, messageCount, lastMessage}[], mentions: {user, text, link}[], date: string }
   */
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });

    const templates = await import("../templates/email.js");
    let html: string;
    switch (data.type) {
      case "mention": {
        const mentionData = data.data as Record<string, unknown>;
        if (
          mentionData?.channelName &&
          mentionData?.mentionedBy &&
          mentionData?.messagePreview &&
          mentionData?.channelLink
        ) {
          html = templates.mentionTemplate({
            channelName: mentionData.channelName as string,
            mentionedBy: mentionData.mentionedBy as string,
            messagePreview: mentionData.messagePreview as string,
            channelLink: mentionData.channelLink as string,
          });
        } else {
          html = templates.notificationTemplate(data.title, data.message, data.link);
        }
        break;
      }
      case "dm": {
        const dmData = data.data as Record<string, unknown>;
        if (dmData?.senderName && dmData?.messagePreview && dmData?.dmLink) {
          html = templates.dmTemplate(
            dmData.senderName as string,
            dmData.messagePreview as string,
            dmData.dmLink as string,
          );
        } else {
          html = templates.notificationTemplate(data.title, data.message, data.link);
        }
        break;
      }
      case "digest": {
        const digestData = data.data as Record<string, unknown>;
        if (digestData?.date) {
          html = templates.digestTemplate({
            date: digestData.date as string,
            channels: (digestData.channels ?? []) as {
              name: string;
              messageCount: number;
              lastMessage: string;
            }[],
            mentions: (digestData.mentions ?? []) as { user: string; text: string; link: string }[],
            unsubLink: (digestData.unsubLink as string) ?? "",
          });
        } else {
          html = templates.notificationTemplate(data.title, data.message, data.link);
        }
        break;
      }
      default:
        html = templates.notificationTemplate(data.title, data.message, data.link);
    }

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: user.email,
      subject: data.title,
      text: `${data.message}\n\n${data.link ? `View: ${data.link}` : ""}`,
      html,
    });

    return true;
  } catch (err) {
    logger.error({ userId: data.userId, error: String(err) }, "Email delivery failed");
    return false;
  }
}

export function registerNotificationProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const supabase = createSupabaseClient();

  const worker = new Worker<NotificationJobData>(
    "notification",
    async (job: Job<NotificationJobData>) => {
      const { userId, type, channels = ["in_app"] } = job.data;
      logger.info({ userId, type, channels }, "Processing notification");

      const results: Record<string, boolean> = {};

      if (channels.includes("in_app")) {
        results.in_app = await withPerChannelRetry("in_app", () =>
          deliverInApp(supabase, job.data),
        );
      }
      if (channels.includes("push")) {
        results.push = await withPerChannelRetry("push", () =>
          deliverPush(supabase, job.data),
        );
      }
      if (channels.includes("email")) {
        results.email = await withPerChannelRetry("email", () =>
          deliverEmail(supabase, job.data),
        );
      }

      const allOk = Object.values(results).every((r) => r);
      logger.info({ userId, type, results }, "Notification processed");

      return { status: allOk ? "sent" : "partial", channels, results };
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
