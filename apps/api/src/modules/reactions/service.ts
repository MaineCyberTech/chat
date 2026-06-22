import { getSupabase } from "../../lib/supabase.js";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export class ReactionService {
  async getByMessage(messageId: string): Promise<Reaction[]> {
    const supabase = getSupabase();
    const { data } = await supabase.from("reactions").select("*").eq("message_id", messageId);
    return (data ?? []) as Reaction[];
  }

  async add(messageId: string, userId: string, emoji: string): Promise<Reaction | null> {
    const supabase = getSupabase();
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

  async remove(messageId: string, userId: string, emoji: string): Promise<boolean> {
    const supabase = getSupabase();
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
