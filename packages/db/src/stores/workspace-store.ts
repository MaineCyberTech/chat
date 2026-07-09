import type { SupabaseClient } from "@supabase/supabase-js";
import type { Workspace } from "../types.js";

export interface IWorkspaceStore {
  list(userId: string, supabase: SupabaseClient): Promise<Workspace[]>;
  getById(id: string, supabase: SupabaseClient): Promise<Workspace | null>;
  getBySlug(slug: string, supabase: SupabaseClient): Promise<Workspace | null>;
  create(data: Partial<Workspace>, supabase: SupabaseClient): Promise<Workspace>;
  update(id: string, data: Partial<Workspace>, supabase: SupabaseClient): Promise<Workspace>;
  delete(id: string, supabase: SupabaseClient): Promise<void>;
  addMember(
    workspaceId: string,
    userId: string,
    role: string,
    supabase: SupabaseClient,
  ): Promise<void>;
  removeMember(workspaceId: string, userId: string, supabase: SupabaseClient): Promise<void>;
  getMembers(
    workspaceId: string,
    supabase: SupabaseClient,
  ): Promise<Array<{ user_id: string; display_name: string; role: string }>>;
}

export class SupabaseWorkspaceStore implements IWorkspaceStore {
  async list(userId: string, supabase: SupabaseClient): Promise<Workspace[]> {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspaces(*)")
      .eq("user_id", userId);

    if (!data) return [];
    return data
      .map((r: Record<string, unknown>) => (r as { workspaces: Workspace }).workspaces)
      .filter((w: Workspace | null) => w && !w.deleted_at);
  }

  async getById(id: string, supabase: SupabaseClient): Promise<Workspace | null> {
    const { data, error } = await supabase.from("workspaces").select("*").eq("id", id).single();
    if (error) return null;
    return data as Workspace;
  }

  async getBySlug(slug: string, supabase: SupabaseClient): Promise<Workspace | null> {
    const { data, error } = await supabase.from("workspaces").select("*").eq("slug", slug).single();
    if (error) return null;
    return data as Workspace;
  }

  async create(data: Partial<Workspace>, supabase: SupabaseClient): Promise<Workspace> {
    const { data: created, error } = await supabase
      .from("workspaces")
      .insert({
        name: data.name,
        slug: data.slug,
        owner_id: data.owner_id,
      })
      .select("*")
      .single();

    if (error || !created)
      throw new Error(`Failed to create workspace: ${error?.message ?? "unknown"}`);
    return created as Workspace;
  }

  async update(id: string, data: Partial<Workspace>, supabase: SupabaseClient): Promise<Workspace> {
    const { data: updated, error } = await supabase
      .from("workspaces")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated)
      throw new Error(`Failed to update workspace: ${error?.message ?? "unknown"}`);
    return updated as Workspace;
  }

  async delete(id: string, supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("workspaces")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`Failed to delete workspace: ${error.message}`);
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: string,
    supabase: SupabaseClient,
  ): Promise<void> {
    const { error } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspaceId, user_id: userId, role });
    if (error) throw new Error(`Failed to add member: ${error.message}`);
  }

  async removeMember(workspaceId: string, userId: string, supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    if (error) throw new Error(`Failed to remove member: ${error.message}`);
  }

  async getMembers(
    workspaceId: string,
    supabase: SupabaseClient,
  ): Promise<Array<{ user_id: string; display_name: string; role: string }>> {
    const { data } = await supabase
      .from("workspace_members")
      .select("user_id, role, users!inner(display_name)")
      .eq("workspace_id", workspaceId);

    if (!data) return [];
    type MemberRow = { user_id: string; role: string; users: { display_name: string | null } };
    return (data as unknown as MemberRow[]).map((r) => ({
      user_id: r.user_id,
      display_name: r.users?.display_name ?? "Unknown",
      role: r.role,
    }));
  }
}

export const workspaceStore = new SupabaseWorkspaceStore();
