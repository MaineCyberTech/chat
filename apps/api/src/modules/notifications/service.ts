import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { pushSubscriptionService } from "./push-subscription-service.js";
import { logger } from "../../lib/logger.js";

interface Notification {
  id: string;
  user_id: string;
  workspace_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export class NotificationService {
  async list(
    userId: string,
    workspaceId: string | undefined,
    limit: number,
    offset: number,
    supabase: SupabaseClient,
  ): Promise<Notification[]> {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }
    const { data } = await query;
    return (data ?? []) as Notification[];
  }

  async unreadCount(
    userId: string,
    workspaceId: string | undefined,
    supabase: SupabaseClient,
  ): Promise<number> {
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }
    const { count } = await query;
    return count ?? 0;
  }

  async markRead(
    userId: string,
    notificationId: string,
    supabase: SupabaseClient,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);
    return !error;
  }

  async markAllRead(userId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    return !error;
  }

  async create(input: {
    user_id: string;
    workspace_id?: string;
    type: string;
    title: string;
    body?: string;
    link?: string;
  }): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("notifications").insert({
      user_id: input.user_id,
      workspace_id: input.workspace_id ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });

    // Also send push notification (best-effort, non-blocking)
    if (!error) {
      pushSubscriptionService
        .sendPush(input.user_id, {
          title: input.title,
          body: input.body ?? "",
          data: { link: input.link ?? "/" },
          tag: `notification-${input.type}`,
          requireInteraction: true,
        })
        .catch((err) => {
          logger.error("Push notification failed", {
            error: String(err),
            userId: input.user_id,
            type: input.type,
          });
        });
    }

    return !error;
  }
}

export const notificationService = new NotificationService();
