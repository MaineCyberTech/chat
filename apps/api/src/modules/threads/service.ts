import type { SupabaseClient } from "@supabase/supabase-js";

interface ThreadParticipant {
  thread_id: string;
  user_id: string;
  last_read_at: string | null;
  joined_at: string;
}

export class ThreadService {
  async getThread(threadId: string, supabase: SupabaseClient) {
    const { data: metadata } = await supabase
      .from("thread_metadata")
      .select("*")
      .eq("message_id", threadId)
      .single();

    if (!metadata) return null;

    const { data: replies } = await supabase
      .from("messages")
      .select("*")
      .eq("parent_id", threadId)
      .order("created_at", { ascending: true });

    const { data: participants } = await supabase
      .from("thread_participants")
      .select("user_id, last_read_at, joined_at")
      .eq("thread_id", metadata.id);

    return { metadata, replies: replies ?? [], participants: participants ?? [] };
  }

  async getParticipants(threadId: string, supabase: SupabaseClient): Promise<ThreadParticipant[]> {
    const { data } = await supabase
      .from("thread_participants")
      .select("*")
      .eq("thread_id", threadId);
    return (data ?? []) as ThreadParticipant[];
  }

  async joinThread(threadId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("thread_participants")
      .upsert(
        { thread_id: threadId, user_id: userId, last_read_at: new Date().toISOString() },
        { onConflict: "thread_id,user_id" },
      );
    return !error;
  }

  async leaveThread(threadId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("thread_participants")
      .delete()
      .eq("thread_id", threadId)
      .eq("user_id", userId);
    return !error;
  }

  async getUnreadCount(
    threadId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<number> {
    const { data: participant } = await supabase
      .from("thread_participants")
      .select("last_read_at")
      .eq("thread_id", threadId)
      .eq("user_id", userId)
      .single();

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", threadId)
      .gt("created_at", participant?.last_read_at ?? "1970-01-01");

    return count ?? 0;
  }
}

export const threadService = new ThreadService();
