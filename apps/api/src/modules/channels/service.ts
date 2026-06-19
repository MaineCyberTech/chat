import { getSupabase } from "../../lib/supabase.js";
import type { Channel } from "@chat/db";

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
  async listByWorkspace(workspaceId: string): Promise<Channel[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as Channel[];
  }

  async getById(channelId: string): Promise<Channel | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();

    if (error) return null;
    return data as Channel;
  }

  async create(input: CreateChannelInput): Promise<Channel | null> {
    const supabase = getSupabase();
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error } = await supabase
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

    if (error) return null;
    return data as Channel;
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
    return data as Channel;
  }

  async remove(channelId: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from("channels").delete().eq("id", channelId);
    return !error;
  }
}

export const channelService = new ChannelService();
