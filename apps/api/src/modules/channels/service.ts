import { getSupabase } from "../../lib/supabase.js";
import { webhookService } from "../webhooks/service.js";
import { AppError } from "../../middleware/error-handler.js";
import type { Channel } from "@chat/db";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateChannelInput {
  name: string;
  workspace_id: string;
  created_by: string;
  topic?: string;
  is_private?: boolean;
}

interface UpdateChannelInput {
  name?: string;
  topic?: string;
}

export class ChannelService {
  private getClient(supabase?: SupabaseClient): SupabaseClient {
    return supabase ?? getSupabase();
  }

  async listByWorkspace(workspaceId: string, supabase?: SupabaseClient): Promise<Channel[]> {
    const client = this.getClient(supabase);
    const { data, error } = await client
      .from("channels")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as Channel[];
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

        return channel;
      }

      if (error.code === "23505" && error.message?.includes("channels_workspace_id_slug_key")) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
        continue;
      }

      throw new AppError(
        `Channel insert failed: code=${error.code} message=${error.message} details=${error.details} hint=${error.hint}`,
        500,
        "CREATE_FAILED",
      );
    }
    throw new AppError(
      `Channel slug dedup exhausted for "${baseSlug}" after ${MAX_ATTEMPTS} attempts`,
      500,
      "CREATE_FAILED",
    );
  }

  async update(channelId: string, input: UpdateChannelInput): Promise<Channel | null> {
    const supabase = getSupabase();
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.topic !== undefined) updates.topic = input.topic;

    const { data, error } = await supabase
      .from("channels")
      .update(updates)
      .eq("id", channelId)
      .select("*")
      .single();

    if (error) return null;

    webhookService
      .triggerEvent("channel.updated", data.workspace_id, {
        channel_id: data.id,
        name: data.name,
        slug: data.slug,
      })
      .catch(() => {});

    return data as Channel;
  }

  async remove(channelId: string): Promise<boolean> {
    const supabase = getSupabase();
    const channel = await this.getById(channelId);
    if (!channel) return false;

    const { error } = await supabase.from("channels").delete().eq("id", channelId);
    const success = !error;

    if (success) {
      webhookService
        .triggerEvent("channel.deleted", channel.workspace_id, {
          channel_id: channelId,
        })
        .catch(() => {});
    }

    return success;
  }

  async getMembers(channelId: string): Promise<{ user_id: string }[]> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", channelId);

    return (data ?? []) as { user_id: string }[];
  }

  async addMember(channelId: string, userId: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from("channel_members").insert({
      channel_id: channelId,
      user_id: userId,
    });
    return !error;
  }

  async removeMember(channelId: string, userId: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("channel_members")
      .delete()
      .eq("channel_id", channelId)
      .eq("user_id", userId);
    return !error;
  }
}

export const channelService = new ChannelService();
