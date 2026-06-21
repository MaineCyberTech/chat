import { getSupabase } from "./supabase.js";

export async function isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && data !== null;
}
