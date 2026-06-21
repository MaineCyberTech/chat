import { getSupabase, getAdminOrAnon } from "../../lib/supabase.js";
import { getIO } from "../../lib/socket.js";
import type { Message } from "@chat/db";

interface CreateMessageInput {
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
}

export class MessageService {
  async listByChannel(channelId: string, limit = 50, before?: string): Promise<Message[]> {
    const supabase = getSupabase();
    let query = supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    if (error) return [];
    return ((data ?? []) as Message[]).reverse();
  }

  async getById(messageId: string): Promise<Message | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error) return null;
    return data as Message;
  }

  async create(input: CreateMessageInput): Promise<Message | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        channel_id: input.channel_id,
        user_id: input.user_id,
        content: input.content,
        parent_id: input.parent_id ?? null,
      })
      .select("*")
      .single();

    if (error || !data) return null;

    const message = data as Message;

    // Broadcast to channel room
    try {
      const io = getIO();
      io.to(`channel:${input.channel_id}`).emit("message:new", { message });
    } catch {
      // Socket.io may not be initialized in test env
    }

    return message;
  }

  async update(messageId: string, content: string): Promise<Message | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", messageId)
      .select("*")
      .single();

    if (error || !data) return null;

    const message = data as Message;

    try {
      const io = getIO();
      io.to(`channel:${message.channel_id}`).emit("message:updated", { message });
    } catch {
      // Socket.io not initialized
    }

    return message;
  }

  async remove(messageId: string): Promise<{ channel_id: string } | null> {
    const supabase = getSupabase();

    // Get channel_id before deleting for broadcast
    const existing = await this.getById(messageId);
    if (!existing) return null;

    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) return null;

    try {
      const io = getIO();
      io.to(`channel:${existing.channel_id}`).emit("message:deleted", {
        id: messageId,
        channel_id: existing.channel_id,
      });
    } catch {
      // Socket.io not initialized
    }

    return { channel_id: existing.channel_id };
  }
}

export const messageService = new MessageService();
