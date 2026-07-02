import { type Request, type Response, type NextFunction } from "express";
import { getSupabaseForUser, getSupabase } from "../lib/supabase.js";

export function requireWorkspaceMembership(paramName = "workspaceId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params[paramName];
    if (!workspaceId) {
      res.status(400).json({ error: { code: "INVALID_INPUT", message: `Missing ${paramName}` } });
      return;
    }

    const supabase = (req as Request & { supabase?: ReturnType<typeof getSupabaseForUser> })
      .supabase;
    if (!supabase) {
      res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
      return;
    }
    const { data, error } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", req.userId)
      .single();

    if (error || !data) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
      return;
    }

    (req as Request & { workspaceRole?: string }).workspaceRole = data.role;
    next();
  };
}

export function requireChannelAccess(paramName = "channelId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const channelId = req.params[paramName];
    if (!channelId) {
      res.status(400).json({ error: { code: "INVALID_INPUT", message: `Missing ${paramName}` } });
      return;
    }

    const supabase = (req as Request & { supabase?: ReturnType<typeof getSupabaseForUser> })
      .supabase;
    if (!supabase) {
      res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
      return;
    }
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("workspace_id, is_private")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", channel.workspace_id)
      .eq("user_id", req.userId)
      .single();

    if (memberError || !member) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
      return;
    }

    // Check for explicit deny override on this channel
    const { data: denyOverride } = await supabase
      .from("channel_role_overrides")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", req.userId)
      .eq("permission", "deny")
      .eq("scope", "read")
      .maybeSingle();

    if (denyOverride) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Access denied to this channel" } });
      return;
    }

    if (channel.is_private) {
      const { data: channelMember } = await supabase
        .from("channel_members")
        .select("user_id")
        .eq("channel_id", channelId)
        .eq("user_id", req.userId)
        .single();

      if (!channelMember) {
        res
          .status(403)
          .json({ error: { code: "FORBIDDEN", message: "Not a member of this private channel" } });
        return;
      }
    }

    (req as Request & { channelWorkspaceId?: string; workspaceRole?: string }).channelWorkspaceId =
      channel.workspace_id;
    (req as Request & { workspaceRole?: string }).workspaceRole = member.role;
    next();
  };
}

export function requireMessageAccess(messageParamName = "id") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const messageId = req.params[messageParamName];
    if (!messageId) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: `Missing ${messageParamName}` } });
      return;
    }

    const supabase = getSupabase();
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Message not found" } });
      return;
    }

    // Delegate to requireChannelAccess with the resolved channel_id
    const channelId = message.channel_id;
    const userSupabase = (req as Request & { supabase?: ReturnType<typeof getSupabaseForUser> })
      .supabase;
    if (!userSupabase) {
      res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
      return;
    }

    const { data: channel, error: channelError } = await userSupabase
      .from("channels")
      .select("workspace_id, is_private")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
      return;
    }

    const { data: member, error: memberError } = await userSupabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", channel.workspace_id)
      .eq("user_id", req.userId)
      .single();

    if (memberError || !member) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
      return;
    }

    if (channel.is_private) {
      const { data: channelMember } = await userSupabase
        .from("channel_members")
        .select("user_id")
        .eq("channel_id", channelId)
        .eq("user_id", req.userId)
        .single();

      if (!channelMember) {
        res
          .status(403)
          .json({ error: { code: "FORBIDDEN", message: "Not a member of this private channel" } });
        return;
      }
    }

    (req as Request & { channelWorkspaceId?: string; workspaceRole?: string }).channelWorkspaceId =
      channel.workspace_id;
    (req as Request & { workspaceRole?: string }).workspaceRole = member.role;
    next();
  };
}
