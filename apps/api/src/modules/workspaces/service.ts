import { getSupabase } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import { webhookService } from "../webhooks/service.js";
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

    webhookService
      .triggerEvent("workspace.created", data.id, {
        workspace_id: data.id,
        name: data.name,
        slug: data.slug,
        owner_id: input.owner_id,
      })
      .catch(() => {});

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

    webhookService
      .triggerEvent("workspace.updated", workspaceId, {
        workspace_id: data.id,
        name: data.name,
        slug: data.slug,
      })
      .catch(() => {});

    return data as Workspace;
  }

  async remove(workspaceId: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from("workspaces").delete().eq("id", workspaceId);
    const success = !error;

    if (success) {
      webhookService
        .triggerEvent("workspace.deleted", workspaceId, {
          workspace_id: workspaceId,
        })
        .catch(() => {});
    }

    return success;
  }

  async getMembers(
    workspaceId: string,
  ): Promise<
    { user_id: string; display_name: string | null; email: string; avatar_url: string | null }[]
  > {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("workspace_members")
      .select("user_id, role, users!inner(display_name, email, avatar_url)")
      .eq("workspace_id", workspaceId);

    if (!data) return [];
    return (
      data as Array<{
        user_id: string;
        role: string;
        users: { display_name: string | null; email: string; avatar_url: string | null }[];
      }>
    ).map((row) => {
      const user = row.users[0] ?? { display_name: null, email: "", avatar_url: null };
      return {
        user_id: row.user_id,
        role: row.role,
        display_name: user.display_name,
        email: user.email,
        avatar_url: user.avatar_url,
      };
    });
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: "owner" | "admin" | "member" = "member",
  ): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
    });
    return !error;
  }

  async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    return !error;
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: "owner" | "admin" | "member",
  ): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    return !error;
  }
}

export const workspaceService = new WorkspaceService();
