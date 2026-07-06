import type { SupabaseClient } from "@supabase/supabase-js";
import type { Reaction } from "../types.js";

export interface IReactionStore {
  getByMessage(messageId: string, supabase: SupabaseClient): Promise<Reaction[]>;
  getBatch(messageIds: string[], supabase: SupabaseClient): Promise<Record<string, Reaction[]>>;
  add(reaction: Partial<Reaction>, supabase: SupabaseClient): Promise<Reaction>;
  remove(id: string, supabase: SupabaseClient): Promise<void>;
}

export class SupabaseReactionStore implements IReactionStore {
  async getByMessage(messageId: string, supabase: SupabaseClient): Promise<Reaction[]> {
    const { data } = await supabase
      .from("reactions")
      .select("*")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });
    return (data ?? []) as Reaction[];
  }

  async getBatch(messageIds: string[], supabase: SupabaseClient): Promise<Record<string, Reaction[]>> {
    if (messageIds.length === 0) return {};

    const { data } = await supabase
      .from("reactions")
      .select("*")
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });

    const grouped: Record<string, Reaction[]> = {};
    for (const msgId of messageIds) {
      grouped[msgId] = [];
    }
    for (const reaction of data ?? []) {
      const r = reaction as Reaction;
      if (grouped[r.message_id]) {
        grouped[r.message_id].push(r);
      }
    }
    return grouped;
  }

  async add(reaction: Partial<Reaction>, supabase: SupabaseClient): Promise<Reaction> {
    const { data, error } = await supabase
      .from("reactions")
      .insert({
        message_id: reaction.message_id,
        user_id: reaction.user_id,
        emoji: reaction.emoji,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error(`Failed to add reaction: ${error?.message ?? "unknown"}`);
    return data as Reaction;
  }

  async remove(id: string, supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", id);
    if (error) throw new Error(`Failed to remove reaction: ${error.message}`);
  }
}

export const reactionStore = new SupabaseReactionStore();
