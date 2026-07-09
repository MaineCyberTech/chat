import { getSupabase } from "../../lib/supabase.js";
import { getIO } from "../../lib/socket.js";
import { webhookService } from "../webhooks/service.js";
import { notificationService } from "../notifications/service.js";
import { resolveMentions } from "../../lib/mentions/parser.js";
import { logger } from "../../lib/logger.js";
import { queryWithTimeout } from "../../lib/db-timeout.js";
import type { Message } from "@chat/db";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateMessageInput {
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  priority?: string;
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
      .select(
        "id, channel_id, user_id, content, created_at, edited_at, parent_id, is_pinned, deleted_at, archived_at, priority",
      )
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

    const { data, error } = await queryWithTimeout(query);
    if (error) return { messages: [], nextCursor: null };

    const messages = (data ?? []) as unknown as Message[];
    const hasMore = messages.length > limit;
    const results = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore
      ? `${results[results.length - 1].created_at}|${results[results.length - 1].id}`
      : null;

    return { messages: results.reverse(), nextCursor };
  }

  async getById(messageId: string, supabase?: SupabaseClient): Promise<Message | null> {
    const client = supabase ?? getSupabase();
    const { data, error } = await queryWithTimeout(
      client.from("messages").select("*").eq("id", messageId).single(),
    );

    if (error) return null;
    return data as unknown as Message;
  }

  async create(input: CreateMessageInput, supabase?: SupabaseClient): Promise<Message | null> {
    const client = supabase ?? getSupabase();
    const { data, error } = await queryWithTimeout(
      client
        .from("messages")
        .insert({
          channel_id: input.channel_id,
          user_id: input.user_id,
          content: input.content,
          parent_id: input.parent_id ?? null,
          priority: input.priority ?? "standard",
        })
        .select(
          "id, channel_id, user_id, content, created_at, edited_at, parent_id, is_pinned, deleted_at, archived_at, priority",
        )
        .single(),
    );

    if (error || !data) return null;

    const message = data as unknown as Message;

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

    // Parse and process @mentions (fire-and-forget)
    webhookService
      .getChannelWorkspaceId(input.channel_id)
      .then(async (workspaceId) => {
        if (!workspaceId || !input.content.includes("@")) return;
        const result = await resolveMentions(input.content, workspaceId, client);
        if (result.userIds.length === 0) return;
        const mentionType = result.hasEveryone ? "everyone" : result.hasHere ? "here" : "mention";
        for (const mentionedUserId of result.userIds) {
          if (mentionedUserId === input.user_id) continue; // Don't notify self
          notificationService.create({
            user_id: mentionedUserId,
            workspace_id: workspaceId,
            type: mentionType,
            title: result.hasEveryone
              ? `${input.user_id.slice(0, 8)} mentioned @everyone`
              : `${input.user_id.slice(0, 8)} mentioned you`,
            body: input.content.slice(0, 200),
            link: `/channels/${input.channel_id}`,
          });
        }
      })
      .catch((err) => logger.error("Mention processing failed", { error: String(err) }));

    // Auto-responder: if this is a DM, check if the recipient has auto-reply enabled
    try {
      const { data: ch } = await client
        .from("channels")
        .select("channel_type, name")
        .eq("id", input.channel_id)
        .single();
      if (ch?.channel_type === "dm") {
        const otherUserId = ch.name.replace(/^dm-/, "");
        if (otherUserId !== input.user_id) {
          const { data: responder } = await client
            .from("auto_responders")
            .select("message, enabled, trigger_status")
            .eq("user_id", otherUserId)
            .single();
          if (responder?.enabled) {
            const { data: presence } = await client
              .from("user_presence")
              .select("status")
              .eq("user_id", otherUserId)
              .single();
            if (presence && responder.trigger_status.includes(presence.status)) {
              const { data: autoReply } = await client
                .from("messages")
                .insert({
                  channel_id: input.channel_id,
                  user_id: otherUserId,
                  content: `_Auto-reply: ${responder.message}_`,
                  priority: "standard",
                })
                .select(
                  "id, channel_id, user_id, content, created_at, edited_at, parent_id, is_pinned, deleted_at, archived_at, priority",
                )
                .single();
              if (autoReply) {
                try {
                  const io = getIO();
                  io.to(`channel:${input.channel_id}`).emit("message:new", {
                    message: autoReply,
                  });
                } catch {
                  /* socket may not be available */
                }
              }
            }
          }
        }
      }
    } catch {
      /* auto-responder errors are non-critical */
    }

    return message;
  }

  async update(
    messageId: string,
    content: string,
    supabase?: SupabaseClient,
    version?: number,
    userId?: string,
  ): Promise<Message | null> {
    const client = supabase ?? getSupabase();

    // Save previous content to edit history
    const existing = await this.getById(messageId, client);
    if (existing && existing.content !== content) {
      await client.from("message_edit_history").insert({
        message_id: messageId,
        previous_content: existing.content,
        edited_by: userId ?? existing.user_id,
        edited_at: new Date().toISOString(),
      });
    }

    let query = client
      .from("messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", messageId);

    if (version !== undefined) {
      query = query.eq("version", version);
    }

    const { data, error } = await queryWithTimeout(
      query
        .select(
          "id, channel_id, user_id, content, created_at, edited_at, parent_id, is_pinned, deleted_at, archived_at, priority",
        )
        .single(),
    );

    if (error || !data) return null;

    const message = data as unknown as Message;

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

  async pin(messageId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: true })
      .eq("id", messageId);

    if (error) return false;

    const message = await this.getById(messageId, supabase);
    if (message) {
      try {
        const io = getIO();
        io.to(`channel:${message.channel_id}`).emit("message:updated", {
          message: { ...message, is_pinned: true },
        });
      } catch {
        logger.warn("Failed to emit pin update via socket");
      }
    }
    return true;
  }

  async unpin(messageId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: false })
      .eq("id", messageId);

    if (error) return false;

    const message = await this.getById(messageId, supabase);
    if (message) {
      try {
        const io = getIO();
        io.to(`channel:${message.channel_id}`).emit("message:updated", {
          message: { ...message, is_pinned: false },
        });
      } catch {
        logger.warn("Failed to emit unpin update via socket");
      }
    }
    return true;
  }

  async getPinned(channelId: string, supabase: SupabaseClient): Promise<Message[]> {
    const { data } = await queryWithTimeout(
      supabase
        .from("messages")
        .select(
          "id, channel_id, user_id, content, created_at, edited_at, parent_id, is_pinned, deleted_at, archived_at, priority",
        )
        .eq("channel_id", channelId)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false }),
    );

    return (data ?? []) as unknown as Message[];
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

  async getFlagged(
    userId: string,
    supabase: SupabaseClient,
    limit = 50,
    offset = 0,
  ): Promise<{ messages: Message[]; total: number }> {
    const countQuery = await queryWithTimeout(
      supabase
        .from("message_flags")
        .select("message_id", { count: "exact", head: true })
        .eq("user_id", userId),
    );

    const total = (countQuery as unknown as { count: number | null }).count ?? 0;

    const { data } = await queryWithTimeout(
      supabase
        .from("message_flags")
        .select("message_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
    );

    if (!data || data.length === 0) return { messages: [], total };

    const messageIds = data.map((f: { message_id: string }) => f.message_id);
    const { data: messages } = await queryWithTimeout(
      supabase
        .from("messages")
        .select(
          "id, channel_id, user_id, content, created_at, edited_at, parent_id, is_pinned, deleted_at, archived_at, priority",
        )
        .in("id", messageIds)
        .order("created_at", { ascending: false }),
    );

    return { messages: (messages ?? []) as unknown as Message[], total };
  }

  async getEditHistory(messageId: string, supabase: SupabaseClient) {
    const { data } = await supabase
      .from("message_edit_history")
      .select("*")
      .eq("message_id", messageId)
      .order("edited_at", { ascending: true });

    return data ?? [];
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
