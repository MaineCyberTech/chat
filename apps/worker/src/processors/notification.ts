import { Worker, Job, Queue } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";

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

function createSupabaseClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
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

async function encryptVapid(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  publicKey: string,
  privateKey: string,
  subject: string,
): Promise<{ headers: Record<string, string>; body: Buffer | null }> {
  try {
    const webPush = await import("web-push");
    const vapidKeys = { publicKey, privateKey };
    const subscription = { endpoint, keys: { p256dh, auth } };

    const result = await webPush.sendNotification(
      { ...subscription, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
      payload,
      {
        vapidDetails: { subject, ...vapidKeys },
        TTL: 86400,
      },
    );

    return { headers: {}, body: null };
  } catch {
    return { headers: {}, body: null };
  }
}

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

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: user.email,
      subject: data.title,
      text: `${data.message}\n\n${data.link ? `View: ${data.link}` : ""}`,
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
        results.in_app = await deliverInApp(supabase, job.data);
      }
      if (channels.includes("push")) {
        results.push = await deliverPush(supabase, job.data);
      }
      if (channels.includes("email")) {
        results.email = await deliverEmail(supabase, job.data);
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
