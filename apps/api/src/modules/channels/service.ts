import { getSupabase } from "../../lib/supabase.js";
import { webhookService } from "../webhooks/service.js";
import { logger } from "../../lib/logger.js";
import { getIO, removeAllFromRoom } from "../../lib/socket.js";
import type { Channel } from "@chat/db";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateChannelInput {
  name: string;
  workspace_id: string;
  created_by: string;
  topic?: string;
  is_private?: boolean;
  is_read_only?: boolean;
  channel_type?: "public" | "private" | "dm" | "group";
}

interface UpdateChannelInput {
  name?: string;
  topic?: string;
  version?: number;
}

export interface CreateResult {
  channel?: Channel;
  error?: string;
}

export class ChannelService {
  private getClient(supabase?: SupabaseClient): SupabaseClient {
    return supabase ?? getSupabase();
  }

  async listByWorkspace(
    workspaceId: string,
    supabase?: SupabaseClient,
    limit = 50,
    offset = 0,
  ): Promise<Channel[]> {
    const client = this.getClient(supabase);
    const { data, error } = await client
      .from("channels")
      .select(
        "id, name, slug, topic, workspace_id, created_by, is_private, is_read_only, channel_type, sort_order, created_at, updated_at, deleted_at",
      )
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return [];
    return (data ?? []) as unknown as Channel[];
  }

  async reorderChannel(
    workspaceId: string,
    channelIds: string[],
    supabase?: SupabaseClient,
  ): Promise<boolean> {
    const client = this.getClient(supabase);
    const updates = channelIds.map((id, index) => ({
      id,
      sort_order: index,
    }));
    // Update each channel's sort_order
    for (const update of updates) {
      const { error } = await client
        .from("channels")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id)
        .eq("workspace_id", workspaceId);
      if (error) return false;
    }
    return true;
  }

  async getById(channelId: string, supabase?: SupabaseClient): Promise<Channel | null> {
    const client = this.getClient(supabase);
    const { data, error } = await client.from("channels").select("*").eq("id", channelId).single();

    if (error) return null;
    return data as Channel;
  }

  async create(input: CreateChannelInput, supabase?: SupabaseClient): Promise<Channel | null> {
    const client = supabase ?? getSupabase();
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Handle duplicate slugs
    let attempt = 0;
    const MAX_ATTEMPTS = 100;
    let slug = baseSlug;
    while (attempt < MAX_ATTEMPTS) {
      const { data, error } = await client
        .from("channels")
        .insert({
          name: input.name,
          slug,
          workspace_id: input.workspace_id,
          created_by: input.created_by,
          topic: input.topic ?? null,
          is_private: input.is_private ?? false,
          is_read_only: input.is_read_only ?? false,
          channel_type: input.channel_type ?? (input.is_private ? "private" : "public"),
        })
        .select("*")
        .single();

      if (!error) {
        const channel = data as Channel;

        // Creator is auto-added as channel member via the on_channel_created trigger

        webhookService
          .triggerEvent("channel.created", input.workspace_id, {
            channel_id: channel.id,
            name: channel.name,
            slug: channel.slug,
            created_by: input.created_by,
          })
          .catch(() => {});

        try {
          getIO().emit("channel:created", { channel });
        } catch {
          // Socket not initialized
        }

        return channel;
      }

      if (error.code === "23505" && error.message.includes("channels_workspace_id_slug_key")) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
        continue;
      }

      const errMsg = `code=${error.code} message=${error.message} details=${error.details} hint=${error.hint}`;
      logger.error("Channel insert error", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        name: input.name,
        workspace_id: input.workspace_id,
      });
      throw new Error(errMsg);
    }
    throw new Error(
      `Channel slug dedup exhausted for "${baseSlug}" after ${MAX_ATTEMPTS} attempts`,
    );
  }

  async update(
    channelId: string,
    input: UpdateChannelInput,
    supabase?: SupabaseClient,
  ): Promise<Channel | null> {
    const client = this.getClient(supabase);
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.topic !== undefined) updates.topic = input.topic;

    let query = client.from("channels").update(updates).eq("id", channelId);

    if (input.version !== undefined) {
      query = query.eq("version", input.version);
    }

    const { data, error } = await query.select("*").single();

    if (error) return null;

    webhookService
      .triggerEvent("channel.updated", data.workspace_id, {
        channel_id: data.id,
        name: data.name,
        slug: data.slug,
      })
      .catch(() => {});

    try {
      getIO()
        .to(`channel:${channelId}`)
        .emit("channel:updated", { channel: data as Channel });
    } catch {
      // Socket not initialized
    }

    return data as Channel;
  }

  async remove(channelId: string, supabase?: SupabaseClient): Promise<boolean> {
    const client = this.getClient(supabase);
    const channel = await this.getById(channelId, client);
    if (!channel) return false;

    const { error } = await client.from("channels").delete().eq("id", channelId);
    const success = !error;

    if (success) {
      webhookService
        .triggerEvent("channel.deleted", channel.workspace_id, {
          channel_id: channelId,
        })
        .catch(() => {});

      try {
        const roomName = `channel:${channelId}`;
        getIO()
          .to(roomName)
          .emit("channel:deleted", { channelId, workspaceId: channel.workspace_id });
        removeAllFromRoom(roomName);
      } catch {
        // Socket not initialized
      }
    }

    return success;
  }

  async getMembers(
    channelId: string,
    supabase: SupabaseClient,
    limit = 50,
    offset = 0,
  ): Promise<{ user_id: string; display_name: string | null }[]> {
    const { data } = await supabase
      .from("channel_members")
      .select("user_id, users(display_name)")
      .eq("channel_id", channelId)
      .range(offset, offset + limit - 1);

    return (data ?? []).map((row: Record<string, unknown>) => ({
      user_id: row.user_id as string,
      display_name: (row.users as { display_name: string | null } | null)?.display_name ?? null,
    }));
  }

  async createDmChannel(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string,
    supabase?: SupabaseClient,
  ): Promise<Channel | null> {
    return this.createGroupChannel(workspaceId, currentUserId, [targetUserId], supabase);
  }

  async createGroupChannel(
    workspaceId: string,
    currentUserId: string,
    targetUserIds: string[],
    supabase?: SupabaseClient,
  ): Promise<Channel | null> {
    const client = this.getClient(supabase);
    const allUserIds = [currentUserId, ...targetUserIds.filter((id) => id !== currentUserId)];
    const isDm = allUserIds.length === 2;

    if (isDm) {
      // Check if 2-person DM already exists via dm_members
      const { data: existing } = await client
        .from("dm_members")
        .select("channel_id")
        .eq("user_id", allUserIds[0]);

      if (existing) {
        const existingIds = existing.map((r: { channel_id: string }) => r.channel_id);
        const { data: mutual } = await client
          .from("dm_members")
          .select("channel_id")
          .in("channel_id", existingIds)
          .eq("user_id", allUserIds[1]);

        if (mutual && mutual.length > 0) {
          const { data: existingChannel } = await client
            .from("channels")
            .select("*")
            .eq("id", mutual[0].channel_id)
            .single();
          if (existingChannel && existingChannel.channel_type !== "group") {
            return existingChannel as Channel;
          }
        }
      }
    }

    const channelName = isDm
      ? `dm-${currentUserId.slice(0, 8)}-${targetUserIds[0].slice(0, 8)}`
      : `gm-${allUserIds.map((id) => id.slice(0, 4)).join("-")}`;

    const channel = await this.create(
      {
        name: channelName,
        workspace_id: workspaceId,
        created_by: currentUserId,
        is_private: true,
        channel_type: isDm ? "dm" : "group",
      },
      client,
    );

    if (!channel) return null;

    // Add all users as channel members and dm_members
    for (const userId of allUserIds) {
      await this.addMember(channel.id, userId, client);
      await client
        .from("dm_members")
        .upsert({ channel_id: channel.id, user_id: userId }, { onConflict: "channel_id,user_id" });
    }

    return channel;
  }

  async listDmChannels(
    userId: string,
    supabase?: SupabaseClient,
  ): Promise<
    (Channel & {
      otherMembers: { user_id: string; display_name: string | null; avatar_url: string | null }[];
    })[]
  > {
    const client = this.getClient(supabase);

    const { data: dmRecords } = await client
      .from("dm_members")
      .select("channel_id")
      .eq("user_id", userId);

    if (!dmRecords || dmRecords.length === 0) return [];

    const channelIds = dmRecords.map((r: { channel_id: string }) => r.channel_id);
    const { data: channels } = await client
      .from("channels")
      .select(
        "id, name, slug, topic, workspace_id, channel_type, sort_order, created_at, updated_at",
      )
      .in("id", channelIds)
      .is("deleted_at", null)
      .in("channel_type", ["dm", "group"])
      .order("created_at", { ascending: false });

    if (!channels || channels.length === 0) return [];

    const allChannelIds = channels.map((c: { id: string }) => c.id);
    const { data: allMembers } = await client
      .from("dm_members")
      .select("channel_id, user_id")
      .in("channel_id", allChannelIds);

    const otherUserIds = new Set<string>();
    const memberMap = new Map<string, string[]>();
    for (const m of allMembers ?? []) {
      const rec = m as { channel_id: string; user_id: string };
      const members = memberMap.get(rec.channel_id) ?? [];
      members.push(rec.user_id);
      memberMap.set(rec.channel_id, members);
      if (rec.user_id !== userId) {
        otherUserIds.add(rec.user_id);
      }
    }

    const userNames = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    if (otherUserIds.size > 0) {
      const { data: users } = await client
        .from("users")
        .select("id, display_name, avatar_url")
        .in("id", Array.from(otherUserIds));
      for (const u of users ?? []) {
        const rec = u as { id: string; display_name: string | null; avatar_url: string | null };
        userNames.set(rec.id, { display_name: rec.display_name, avatar_url: rec.avatar_url });
      }
    }

    return (channels as unknown as Channel[]).map((ch) => {
      const members = memberMap.get(ch.id) ?? [];
      const otherMembers = members
        .filter((uid) => uid !== userId)
        .map((uid) => ({
          user_id: uid,
          display_name: userNames.get(uid)?.display_name ?? null,
          avatar_url: userNames.get(uid)?.avatar_url ?? null,
        }));
      return { ...ch, otherMembers };
    });
  }

  async listWorkspaceChannelIds(workspaceId: string, supabase?: SupabaseClient): Promise<string[]> {
    const client = this.getClient(supabase);
    const { data } = await client
      .from("channels")
      .select("id")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .in("channel_type", ["public", "private"]);
    return (data ?? []).map((d: { id: string }) => d.id);
  }

  async addMember(channelId: string, userId: string, supabase?: SupabaseClient): Promise<boolean> {
    const client = this.getClient(supabase);
    const { error } = await client.from("channel_members").insert({
      channel_id: channelId,
      user_id: userId,
    });
    const success = !error;
    if (success) {
      try {
        getIO().to(`channel:${channelId}`).emit("channel:member_added", { channelId, userId });
      } catch {
        // Socket not initialized
      }
    }
    return success;
  }

  async removeMember(channelId: string, userId: string, supabase?: SupabaseClient): Promise<boolean> {
    const client = this.getClient(supabase);
    const { error } = await client
      .from("channel_members")
      .delete()
      .eq("channel_id", channelId)
      .eq("user_id", userId);
    const success = !error;
    if (success) {
      try {
        getIO().to(`channel:${channelId}`).emit("channel:member_removed", { channelId, userId });
      } catch {
        // Socket not initialized
      }
    }
    return success;
  }
}

export const channelService = new ChannelService();
