import { getSupabase, getSupabaseAdmin } from "../../lib/supabase.js";
import { loadEnv } from "../../config/env.js";
import webPush from "web-push";

const env = loadEnv();

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}

export interface PushPayload {
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
  tag?: string;
  requireInteraction?: boolean;
}

export class PushSubscriptionService {
  private vapidKeys: { publicKey: string; privateKey: string } | null = null;

  constructor() {
    if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
      this.vapidKeys = {
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
      };
      webPush.setVapidDetails(
        `mailto:${env.EMAIL_FROM || "admin@example.com"}`,
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey,
      );
    }
  }

  getVapidPublicKey(): string {
    if (!this.vapidKeys) {
      throw new Error("VAPID keys not configured");
    }
    return this.vapidKeys.publicKey;
  }

  async create(userId: string, input: PushSubscriptionInput): Promise<PushSubscription> {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          user_agent: input.user_agent ?? null,
        },
        { onConflict: "user_id,endpoint" },
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create push subscription");
    }
    return data as PushSubscription;
  }

  async list(userId: string): Promise<PushSubscription[]> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as PushSubscription[];
  }

  async delete(userId: string, subscriptionId: string): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .eq("id", subscriptionId)
      .eq("user_id", userId);
    return !error;
  }

  async sendPush(userId: string, payload: PushPayload): Promise<number> {
    if (!this.vapidKeys) {
      console.warn("VAPID keys not configured, skipping push notification");
      return 0;
    }

    const subscriptions = await this.list(userId);
    if (subscriptions.length === 0) {
      return 0;
    }

    let sentCount = 0;
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
        sentCount++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        // Remove invalid/expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.delete(userId, sub.id);
        }
        console.error("Push notification failed:", error.message);
      }
    });

    await Promise.allSettled(pushPromises);
    return sentCount;
  }
}

export const pushSubscriptionService = new PushSubscriptionService();
