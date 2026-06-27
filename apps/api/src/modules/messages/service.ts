import { getSupabase } from "../../lib/supabase.js";
import { getIO } from "../../lib/socket.js";
import { webhookService } from "../webhooks/service.js";
import { notificationService } from "../notifications/service.js";
import type { Message } from "@chat/db";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateMessageInput {
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
}

export class MessageService {
  async listByChannel(
    channelId: string,
    limit = 50,
    cursor?: string,
    supabase?: SupabaseClient,
  ): Promise<{ messages: Message[]; nextCursor: string | null }> {
    const client = supabase ?? getSupabase();
    let query = client
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // Fetch one extra to determine if there's a next page

    if (cursor) {
      // cursor format: "created_at|id" for stable pagination
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
    const nextCursor = hasMore
      ? `${results[results.length - 1].created_at}|${results[results.length - 1].id}`
      : null;

    return { messages: results.reverse(), nextCursor };
  }

  async getById(messageId: string, supabase?: SupabaseClient): Promise<Message | null> {
    const client = supabase ?? getSupabase();
    const { data, error } = await client.from("messages").select("*").eq("id", messageId).single();

    if (error) return null;
    return data as Message;
  }

  async create(input: CreateMessageInput, supabase?: SupabaseClient): Promise<Message | null> {
    const client = supabase ?? getSupabase();
    const { data, error } = await client
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

    // Trigger webhooks (fire-and-forget)
    webhookService
      .getChannelWorkspaceId(input.channel_id)
      .then((workspaceId) => {
        if (workspaceId) {
          webhookService.triggerEvent("message.created", workspaceId, {
            message_id: message.id,
            channel_id: message.channel_id,
            user_id: message.user_id,
            content: message.content,
            created_at: message.created_at,
          });
        }
      })
      .catch(() => {});

    // Notify parent message author on reply
    if (input.parent_id) {
      this.getById(input.parent_id, client)
        .then((parent) => {
          if (parent && parent.user_id !== input.user_id) {
            notificationService.create({
              user_id: parent.user_id,
              type: "reply",
              title: "New reply to your message",
              body: input.content.slice(0, 200),
              link: `/channels/${input.channel_id}`,
            });
          }
        })
        .catch(() => {});
    }

    return message;
  }

  async update(
    messageId: string,
    content: string,
    supabase?: SupabaseClient,
  ): Promise<Message | null> {
    const client = supabase ?? getSupabase();
    const { data, error } = await client
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

    webhookService
      .getChannelWorkspaceId(message.channel_id)
      .then((workspaceId) => {
        if (workspaceId) {
          webhookService.triggerEvent("message.updated", workspaceId, {
            message_id: message.id,
            channel_id: message.channel_id,
            user_id: message.user_id,
            content: message.content,
            edited_at: message.edited_at,
          });
        }
      })
      .catch(() => {});

    return message;
  }

  async remove(
    messageId: string,
    supabase?: SupabaseClient,
  ): Promise<{ channel_id: string } | null> {
    const client = supabase ?? getSupabase();

    // Get channel_id before deleting for broadcast
    const existing = await this.getById(messageId, client);
    if (!existing) return null;

    const { error } = await client.from("messages").delete().eq("id", messageId);
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

    webhookService
      .getChannelWorkspaceId(existing.channel_id)
      .then((workspaceId) => {
        if (workspaceId) {
          webhookService.triggerEvent("message.deleted", workspaceId, {
            message_id: messageId,
            channel_id: existing.channel_id,
          });
        }
      })
      .catch(() => {});

    return { channel_id: existing.channel_id };
  }
}

export const messageService = new MessageService();
