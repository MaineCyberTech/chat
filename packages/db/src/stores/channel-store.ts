import type { SupabaseClient } from "@supabase/supabase-js";
import type { Channel, ChannelMember } from "../types.js";

export interface CreateChannelInput {
  workspace_id: string;
  name: string;
  slug: string;
  topic?: string;
  is_private?: boolean;
  created_by: string;
}

export interface IChannelStore {
  getById(channelId: string, supabase: SupabaseClient): Promise<Channel | null>;
  getByWorkspace(workspaceId: string, supabase: SupabaseClient): Promise<Channel[]>;
  create(input: CreateChannelInput, supabase: SupabaseClient): Promise<Channel | null>;
  update(
    channelId: string,
    input: Partial<Channel>,
    supabase: SupabaseClient,
  ): Promise<Channel | null>;
  delete(channelId: string, supabase: SupabaseClient): Promise<boolean>;
  listMembers(channelId: string, supabase: SupabaseClient): Promise<ChannelMember[]>;
  addMember(channelId: string, userId: string, supabase: SupabaseClient): Promise<boolean>;
  removeMember(channelId: string, userId: string, supabase: SupabaseClient): Promise<boolean>;
}

export class SupabaseChannelStore implements IChannelStore {
  async getById(channelId: string, supabase: SupabaseClient): Promise<Channel | null> {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();
    if (error) return null;
    return data as Channel;
  }

  async getByWorkspace(workspaceId: string, supabase: SupabaseClient): Promise<Channel[]> {
    const { data } = await supabase
      .from("channels")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    return (data ?? []) as Channel[];
  }

  async create(input: CreateChannelInput, supabase: SupabaseClient): Promise<Channel | null> {
    const { data, error } = await supabase
      .from("channels")
      .insert({
        workspace_id: input.workspace_id,
        name: input.name,
        slug: input.slug,
        topic: input.topic ?? null,
        is_private: input.is_private ?? false,
        created_by: input.created_by,
      })
      .select("*")
      .single();

    if (error || !data) return null;
    return data as Channel;
  }

  async update(
    channelId: string,
    input: Partial<Channel>,
    supabase: SupabaseClient,
  ): Promise<Channel | null> {
    const { data, error } = await supabase
      .from("channels")
      .update(input)
      .eq("id", channelId)
      .select("*")
      .single();

    if (error) return null;
    return data as Channel;
  }

  async delete(channelId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("channels")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", channelId);
    return !error;
  }

  async listMembers(channelId: string, supabase: SupabaseClient): Promise<ChannelMember[]> {
    const { data } = await supabase.from("channel_members").select("*").eq("channel_id", channelId);
    return (data ?? []) as ChannelMember[];
  }

  async addMember(channelId: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase
      .from("channel_members")
      .insert({ channel_id: channelId, user_id: userId });
    return !error;
  }

  async removeMember(
    channelId: string,
    userId: string,
    supabase: SupabaseClient,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("channel_members")
      .delete()
      .eq("channel_id", channelId)
      .eq("user_id", userId);
    return !error;
  }
}

export const channelStore = new SupabaseChannelStore();
