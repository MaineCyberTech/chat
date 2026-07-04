import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, MessageEditHistory } from "../types.js";

export interface ListByChannelOptions {
  channelId: string;
  limit?: number;
  cursor?: string;
}

export interface ListByChannelResult {
  messages: Message[];
  nextCursor: string | null;
}

export interface CreateMessageInput {
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
}

export interface IMessageStore {
  listByChannel(opts: ListByChannelOptions, supabase: SupabaseClient): Promise<ListByChannelResult>;
  getById(messageId: string, supabase: SupabaseClient): Promise<Message | null>;
  create(input: CreateMessageInput, supabase: SupabaseClient): Promise<Message | null>;
  update(
    messageId: string,
    content: string,
    supabase: SupabaseClient,
    version?: number,
    userId?: string,
  ): Promise<Message | null>;
  remove(messageId: string, supabase: SupabaseClient): Promise<{ channel_id: string } | null>;
  pin(messageId: string, supabase: SupabaseClient): Promise<boolean>;
  unpin(messageId: string, supabase: SupabaseClient): Promise<boolean>;
  getPinned(channelId: string, supabase: SupabaseClient): Promise<Message[]>;
  flag(messageId: string, userId: string, supabase: SupabaseClient): Promise<boolean>;
  unflag(messageId: string, userId: string, supabase: SupabaseClient): Promise<boolean>;
  getFlagged(userId: string, supabase: SupabaseClient): Promise<Message[]>;
  getEditHistory(messageId: string, supabase: SupabaseClient): Promise<MessageEditHistory[]>;
}

export class SupabaseMessageStore implements IMessageStore {
  async listByChannel(
    opts: ListByChannelOptions,
    supabase: SupabaseClient,
  ): Promise<ListByChannelResult> {
    const { channelId, limit = 50, cursor } = opts;
    let query = supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      const [cursorCreatedAt, cursorId] = cursor.split("|");
      if (cursorCreatedAt && cursorId) {
        query = query.or(
          `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`,
        );
      }
    }

    const { data, error } = await query;
    if (error) return { messages: [], nextCursor: null };

    const messages = (data ?? []) as Message[];
    const hasMore = messages.length > limit;
    const results = hasMore ? messages.slice(0, limit) : messages;
    const lastResult = results[results.length - 1];
    const nextCursor: string | null =
      hasMore && lastResult ? `${lastResult.created_at}|${lastResult.id}` : null;

    return { messages: results.reverse(), nextCursor };
  }

  async getById(messageId: string, supabase: SupabaseClient): Promise<Message | null> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();
    if (error) return null;
    return data as Message;
  }

  async create(input: CreateMessageInput, supabase: SupabaseClient): Promise<Message | null> {
    const result = await supabase
      .from("messages")
      .insert({
        channel_id: input.channel_id,
        user_id: input.user_id,
        content: input.content,
        parent_id: input.parent_id ?? null,
      })
      .select("*")
      .single();

    if (result.error || !result.data) return null;
    return result.data as Message;
  }

  async update(
    messageId: string,
    content: string,
    supabase: SupabaseClient,
    version?: number,
    userId?: string,
  ): Promise<Message | null> {
    const existing = await this.getById(messageId, supabase);
    if (existing && existing.content !== content) {
      await supabase.from("message_edit_history").insert({
        message_id: messageId,
        previous_content: existing.content,
        edited_by: userId ?? existing.user_id,
        edited_at: new Date().toISOString(),
      });
    }

    let query = supabase
      .from("messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", messageId);

    if (version !== undefined) {
      query = query.eq("version", version);
    }

    const { data, error } = await query.select("*").single();
    if (error || !data) return null;
    return data as Message;
  }

  async remove(
    messageId: string,
    supabase: SupabaseClient,
  ): Promise<{ channel_id: string } | null> {
    const existing = await this.getById(messageId, supabase);
    if (!existing) return null;

    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) return null;

    return { channel_id: existing.channel_id };
  }

  async pin(messageId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: true })
      .eq("id", messageId);
    return !error;
  }

  async unpin(messageId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: false })
      .eq("id", messageId);
    return !error;
  }

  async getPinned(channelId: string, supabase: SupabaseClient): Promise<Message[]> {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false });
    return (data ?? []) as Message[];
  }

  async flag(messageId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("message_flags")
      .upsert({ user_id: userId, message_id: messageId }, { onConflict: "user_id,message_id" });
    return !error;
  }

  async unflag(messageId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("message_flags")
      .delete()
      .eq("user_id", userId)
      .eq("message_id", messageId);
    return !error;
  }

  async getFlagged(userId: string, supabase: SupabaseClient): Promise<Message[]> {
    const { data } = await supabase
      .from("message_flags")
      .select("message_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) return [];

    const messageIds = data.map((f: { message_id: string }) => f.message_id);
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .in("id", messageIds)
      .order("created_at", { ascending: false });

    return (messages ?? []) as Message[];
  }

  async getEditHistory(messageId: string, supabase: SupabaseClient): Promise<MessageEditHistory[]> {
    const { data } = await supabase
      .from("message_edit_history")
      .select("*")
      .eq("message_id", messageId)
      .order("edited_at", { ascending: true });
    return data ?? [];
  }
}

export const messageStore = new SupabaseMessageStore();
