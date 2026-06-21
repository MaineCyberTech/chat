import { getSupabase, getAdminOrAnon } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import type { Workspace } from "@chat/db";

interface CreateWorkspaceInput {
  name: string;
  owner_id: string;
}

interface UpdateWorkspaceInput {
  name?: string;
}

export class WorkspaceService {
  // Returns all workspaces accessible to the current authenticated user.
  // Filtering is enforced by Row-Level Security (RLS) policies on the workspaces table,
  // which restrict results to workspaces where the user is a member.
  async listByUser(): Promise<Workspace[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as Workspace[];
  }

  async getById(workspaceId: string): Promise<Workspace | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (error) return null;
    return data as Workspace;
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace | null> {
    const supabase = getSupabase();
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name: input.name,
        slug,
        owner_id: input.owner_id,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Workspace insert error", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    if (!data) {
      logger.error("Workspace insert returned no data", { input, slug });
      return null;
    }

    // Add creator as a member
    const { error: memberError } = await supabase.from("workspace_members").insert({
      workspace_id: data.id,
      user_id: input.owner_id,
    });

    if (memberError) {
      logger.error("Workspace member insert error", {
        error: memberError.message,
        workspaceId: data.id,
        userId: input.owner_id,
      });
    }

    return data as Workspace;
  }

  async update(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace | null> {
    const supabase = getSupabase();
    const updates: Record<string, string> = {};
    if (input.name) {
      updates.name = input.name;
      updates.slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const { data, error } = await supabase
      .from("workspaces")
      .update(updates)
      .eq("id", workspaceId)
      .select("*")
      .single();

    if (error) return null;
    return data as Workspace;
  }

  async remove(workspaceId: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from("workspaces").delete().eq("id", workspaceId);
    return !error;
  }
}

export const workspaceService = new WorkspaceService();
