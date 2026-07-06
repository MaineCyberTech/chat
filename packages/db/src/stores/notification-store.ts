import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "../types.js";

export interface INotificationStore {
  list(userId: string, supabase: SupabaseClient): Promise<Notification[]>;
  getPreferences(channelId: string, userId: string, supabase: SupabaseClient): Promise<{ notify: string; sound: boolean }>;
  upsertPreference(channelId: string, userId: string, prefs: { notify?: string; sound?: boolean }, supabase: SupabaseClient): Promise<void>;
  create(notification: Partial<Notification>, supabase: SupabaseClient): Promise<Notification>;
  markRead(id: string, supabase: SupabaseClient): Promise<void>;
  markAllRead(userId: string, supabase: SupabaseClient): Promise<void>;
}

export class SupabaseNotificationStore implements INotificationStore {
  async list(userId: string, supabase: SupabaseClient): Promise<Notification[]> {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as Notification[];
  }

  async getPreferences(
    channelId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<{ notify: string; sound: boolean }> {
    const { data } = await supabase
      .from("channel_notification_preferences")
      .select("notify, sound")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();

    if (!data) return { notify: "all", sound: true };
    return data as { notify: string; sound: boolean };
  }

  async upsertPreference(
    channelId: string,
    userId: string,
    prefs: { notify?: string; sound?: boolean },
    supabase: SupabaseClient,
  ): Promise<void> {
    const { error } = await supabase
      .from("channel_notification_preferences")
      .upsert(
        { channel_id: channelId, user_id: userId, ...prefs },
        { onConflict: "channel_id,user_id" },
      );
    if (error) throw new Error(`Failed to update notification preference: ${error.message}`);
  }

  async create(notification: Partial<Notification>, supabase: SupabaseClient): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: notification.user_id,
        workspace_id: notification.workspace_id ?? null,
        type: notification.type,
        title: notification.title,
        body: notification.body ?? null,
        link: notification.link ?? null,
        read: false,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(`Failed to create notification: ${error?.message ?? "unknown"}`);
    return data as Notification;
  }

  async markRead(id: string, supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) throw new Error(`Failed to mark notification read: ${error.message}`);
  }

  async markAllRead(userId: string, supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new Error(`Failed to mark all notifications read: ${error.message}`);
  }
}

export const notificationStore = new SupabaseNotificationStore();
