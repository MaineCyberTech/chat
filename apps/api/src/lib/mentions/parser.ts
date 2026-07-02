import type { SupabaseClient } from "@supabase/supabase-js";

interface MentionResult {
  userIds: string[];
  hasEveryone: boolean;
  hasHere: boolean;
  roleMentions: string[];
}

/**
 * Parse message content for @mentions.
 * Supports: @username, @everyone, @here, @role
 */
export function parseMentions(content: string): {
  hasEveryone: boolean;
  hasHere: boolean;
  roleMentions: string[];
} {
  const hasEveryone = /\B@everyone\b/.test(content);
  const hasHere = /\B@here\b/.test(content);

  const roleRegex = /\B@(admin|moderator|member|owner)\b/gi;
  const roleMentions = [...content.matchAll(roleRegex)].map((m) => m[1].toLowerCase());

  return { hasEveryone, hasHere, roleMentions };
}

/**
 * Resolve mention patterns to actual user IDs based on workspace membership.
 */
export async function resolveMentions(
  content: string,
  workspaceId: string,
  supabase: SupabaseClient,
): Promise<MentionResult> {
  const { hasEveryone, hasHere, roleMentions } = parseMentions(content);

  // Extract @username patterns (alphanumeric, hyphens, underscores)
  const usernameRegex = /\B@([a-zA-Z0-9][a-zA-Z0-9_-]{1,30})\b/g;
  const usernames = [...content.matchAll(usernameRegex)]
    .map((m) => m[1].toLowerCase())
    .filter(
      (name) => !["everyone", "here", "admin", "moderator", "member", "owner"].includes(name),
    );

  const userIds = new Set<string>();

  // Resolve @username mentions via workspace member lookup
  if (usernames.length > 0) {
    const { data: members } = await supabase
      .from("workspace_members")
      .select("user_id, users!inner(display_name)")
      .eq("workspace_id", workspaceId);

    if (members) {
      for (const member of members) {
        const displayName = (
          member as { user_id: string; users: { display_name: string | null }[] }
        ).users?.[0]?.display_name?.toLowerCase();
        if (displayName && usernames.includes(displayName)) {
          userIds.add((member as { user_id: string }).user_id);
        }
      }
    }
  }

  // Resolve @role mentions
  if (roleMentions.length > 0) {
    const { data: roleMembers } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .in("role", roleMentions);

    if (roleMembers) {
      for (const m of roleMembers) userIds.add(m.user_id);
    }
  }

  // Resolve @everyone: get all workspace members
  if (hasEveryone || hasHere) {
    const { data: allMembers } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId);

    if (allMembers) {
      for (const m of allMembers) userIds.add(m.user_id);
    }
  }

  return {
    userIds: Array.from(userIds),
    hasEveryone,
    hasHere,
    roleMentions,
  };
}
