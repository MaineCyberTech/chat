import type { SupabaseClient } from "@supabase/supabase-js";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export class ReactionService {
  async getByMessage(messageId: string, supabase: SupabaseClient): Promise<Reaction[]> {
    const { data } = await supabase.from("reactions").select("*").eq("message_id", messageId);
    return (data ?? []) as Reaction[];
  }

  async getByMessages(
    messageIds: string[],
    supabase: SupabaseClient,
  ): Promise<Record<string, Reaction[]>> {
    if (messageIds.length === 0) return {};
    const { data } = await supabase.from("reactions").select("*").in("message_id", messageIds);
    const rows = (data ?? []) as Reaction[];
    const map: Record<string, Reaction[]> = {};
    for (const row of rows) {
      if (!map[row.message_id]) map[row.message_id] = [];
      map[row.message_id].push(row);
    }
    return map;
  }

  async add(
    messageId: string,
    userId: string,
    emoji: string,
    supabase: SupabaseClient,
  ): Promise<Reaction | null> {
    const { data, error } = await supabase
      .from("reactions")
      .upsert(
        { message_id: messageId, user_id: userId, emoji },
        { onConflict: "message_id,user_id,emoji" },
      )
      .select("*")
      .single();
    if (error) return null;
    return data as Reaction;
  }

  async remove(
    messageId: string,
    userId: string,
    emoji: string,
    supabase: SupabaseClient,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    return !error;
  }
}

export const reactionService = new ReactionService();
