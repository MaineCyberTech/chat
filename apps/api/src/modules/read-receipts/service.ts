import type { SupabaseClient } from "@supabase/supabase-js";
import { readReceiptStore } from "@chat/db";
import { emitToChannel } from "../../lib/socket.js";

export async function markChannelRead(
  channelId: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<void> {
  await readReceiptStore.markChannelRead(channelId, userId, supabase);
  emitToChannel(channelId, "channel:read", {
    channelId,
    userId,
    timestamp: new Date().toISOString(),
  });
  emitToChannel(channelId, "unread:update", { channelId, count: 0, mentions: 0 });
}

export async function getLastViewed(
  channelId: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<string> {
  return readReceiptStore.getLastViewed(channelId, userId, supabase);
}

export async function markMessageRead(
  messageId: string,
  channelId: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<void> {
  await readReceiptStore.markMessageRead(messageId, channelId, userId, supabase);
}

export async function getMessageReaders(
  messageId: string,
  supabase: SupabaseClient,
): Promise<{ user_id: string; read_at: string }[]> {
  const result = await readReceiptStore.getMessageReaders(messageId, supabase);
  return result.readers;
}

export async function getUnreadCounts(
  userId: string,
  channelIds: string[],
  supabase: SupabaseClient,
): Promise<{ channelId: string; count: number; lastMessageAt: string | null }[]> {
  return readReceiptStore.getBatchUnread(userId, channelIds, supabase);
}
