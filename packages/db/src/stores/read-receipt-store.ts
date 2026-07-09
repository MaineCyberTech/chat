import type { SupabaseClient } from "@supabase/supabase-js";

export interface UnreadCount {
  channelId: string;
  count: number;
  lastMessageAt: string | null;
}

export interface MessageReaders {
  messageId: string;
  readers: Array<{ user_id: string; read_at: string }>;
}

export interface IReadReceiptStore {
  markChannelRead(channelId: string, userId: string, supabase: SupabaseClient): Promise<void>;
  getLastViewed(channelId: string, userId: string, supabase: SupabaseClient): Promise<string>;
  markMessageRead(
    messageId: string,
    channelId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<void>;
  getMessageReaders(messageId: string, supabase: SupabaseClient): Promise<MessageReaders>;
  getBatchUnread(
    userId: string,
    channelIds: string[],
    supabase: SupabaseClient,
  ): Promise<UnreadCount[]>;
}

export class SupabaseReadReceiptStore implements IReadReceiptStore {
  async markChannelRead(
    channelId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<void> {
    await supabase
      .from("channel_members")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("channel_id", channelId)
      .eq("user_id", userId);
  }

  async getLastViewed(
    channelId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<string> {
    const { data } = await supabase
      .from("channel_members")
      .select("last_viewed_at")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();
    return (
      (data as unknown as { last_viewed_at: string })?.last_viewed_at ?? new Date(0).toISOString()
    );
  }

  async markMessageRead(
    messageId: string,
    channelId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<void> {
    await supabase
      .from("message_reads")
      .upsert(
        {
          message_id: messageId,
          channel_id: channelId,
          user_id: userId,
          read_at: new Date().toISOString(),
        },
        { onConflict: "message_id, user_id" },
      )
      .select()
      .single();
  }

  async getMessageReaders(messageId: string, supabase: SupabaseClient): Promise<MessageReaders> {
    const { data } = await supabase
      .from("message_reads")
      .select("user_id, read_at")
      .eq("message_id", messageId)
      .order("read_at", { ascending: true });
    return { messageId, readers: (data ?? []) as Array<{ user_id: string; read_at: string }> };
  }

  async getBatchUnread(
    userId: string,
    channelIds: string[],
    supabase: SupabaseClient,
  ): Promise<UnreadCount[]> {
    if (channelIds.length === 0) return [];

    const { data: memberships } = await supabase
      .from("channel_members")
      .select("channel_id, last_viewed_at")
      .eq("user_id", userId)
      .in("channel_id", channelIds);

    const memberMap = new Map(
      ((memberships ?? []) as Array<{ channel_id: string; last_viewed_at: string }>).map((m) => [
        m.channel_id,
        m.last_viewed_at,
      ]),
    );

    const { data: latestMessages } = await supabase
      .from("messages")
      .select("channel_id, created_at")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: false })
      .limit(channelIds.length * 5);

    const latestByChannel = new Map<string, string>();
    for (const msg of (latestMessages ?? []) as Array<{ channel_id: string; created_at: string }>) {
      const existing = latestByChannel.get(msg.channel_id);
      if (!existing || msg.created_at > existing) {
        latestByChannel.set(msg.channel_id, msg.created_at);
      }
    }

    return channelIds.map((channelId) => {
      const lastViewed = memberMap.get(channelId);
      const lastMessageAt = latestByChannel.get(channelId) ?? null;
      let count = 0;
      if (lastViewed && lastMessageAt && lastMessageAt > lastViewed) {
        count = 1;
      }
      return { channelId, count, lastMessageAt };
    });
  }
}

export const readReceiptStore = new SupabaseReadReceiptStore();
