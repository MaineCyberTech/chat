import { getSupabase, getSupabaseAdmin } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import { webhookService } from "../webhooks/service.js";
import type { Workspace } from "@chat/db";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateWorkspaceInput {
  name: string;
  owner_id: string;
}

interface UpdateWorkspaceInput {
  name?: string;
}

export class WorkspaceService {
  private getClient(supabase?: SupabaseClient): SupabaseClient {
    return supabase ?? getSupabase();
  }

  // Returns all workspaces accessible to the current authenticated user.
  // Filtering is enforced by Row-Level Security (RLS) policies on the workspaces table,
  // which restrict results to workspaces where the user is a member.
  async listByUser(supabase?: SupabaseClient): Promise<Workspace[]> {
    const client = this.getClient(supabase);
    const { data, error } = await client
      .from("workspaces")
      .select("id, name, slug, owner_id, created_at, updated_at, deleted_at")
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as unknown as Workspace[];
  }

  async getById(workspaceId: string, supabase?: SupabaseClient): Promise<Workspace | null> {
    const client = this.getClient(supabase);
    const { data, error } = await client
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (error) return null;
    return data as Workspace;
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace | null> {
    const supabase = getSupabaseAdmin();
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Handle duplicate slugs
    let attempt = 0;
    const MAX_ATTEMPTS = 100;
    let finalSlug = slug;
    while (attempt < MAX_ATTEMPTS) {
      const { data, error } = await supabase
        .from("workspaces")
        .insert({
          name: input.name,
          slug: finalSlug,
          owner_id: input.owner_id,
        })
        .select("*")
        .single();

      if (!error) {
        logger.info("Workspace created", { workspaceId: data.id, slug: finalSlug });
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

      if (error.code === "23505" && error.message.includes("workspaces_slug_key")) {
        attempt++;
        finalSlug = `${slug}-${attempt}`;
        continue;
      }

      logger.error("Workspace insert error", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }
    logger.error("Workspace slug dedup exhausted", { slug, attempts: MAX_ATTEMPTS });
    return null;
  }

  async update(
    workspaceId: string,
    input: UpdateWorkspaceInput,
    supabase?: SupabaseClient,
  ): Promise<Workspace | null> {
    const client = this.getClient(supabase);
    const updates: Record<string, string> = {};
    if (input.name) {
      updates.name = input.name;
      updates.slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const { data, error } = await client
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

  async remove(workspaceId: string, supabase?: SupabaseClient): Promise<boolean> {
    const client = this.getClient(supabase);
    const { error } = await client.from("workspaces").delete().eq("id", workspaceId);
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
    supabase?: SupabaseClient,
  ): Promise<{ user_id: string; display_name: string | null; avatar_url: string | null }[]> {
    const client = this.getClient(supabase);
    const { data } = await client
      .from("workspace_members")
      .select("user_id, role, users!inner(display_name, avatar_url)")
      .eq("workspace_id", workspaceId);

    if (!data) return [];
    return (
      data as Array<{
        user_id: string;
        role: string;
        users: { display_name: string | null; avatar_url: string | null }[];
      }>
    ).map((row) => {
      const user = row.users[0] ?? { display_name: null, avatar_url: null };
      return {
        user_id: row.user_id,
        role: row.role,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      };
    });
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: "owner" | "admin" | "member" = "member",
    supabase?: SupabaseClient,
  ): Promise<boolean> {
    const client = this.getClient(supabase);
    const { error } = await client.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
    });
    return !error;
  }

  async removeMember(
    workspaceId: string,
    userId: string,
    supabase?: SupabaseClient,
  ): Promise<boolean> {
    const client = this.getClient(supabase);
    const { error } = await client
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
    supabase?: SupabaseClient,
  ): Promise<boolean> {
    const client = this.getClient(supabase);
    const { error } = await client
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    return !error;
  }
}

export const workspaceService = new WorkspaceService();
