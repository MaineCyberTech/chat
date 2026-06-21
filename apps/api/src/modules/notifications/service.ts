import { getSupabase, getSupabaseAdmin } from "../../lib/supabase.js";

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
  async list(userId: string, limit = 20): Promise<Notification[]> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Notification[];
  }

  async unreadCount(userId: string): Promise<number> {
    const supabase = getSupabase();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    return count ?? 0;
  }

  async markRead(notificationId: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    return !error;
  }

  async markAllRead(userId: string): Promise<boolean> {
    const supabase = getSupabase();
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
    return !error;
  }
}

export const notificationService = new NotificationService();
