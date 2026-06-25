import { type Request, type Response, type NextFunction } from "express";
import { getSupabaseForUser } from "../lib/supabase.js";

export function requireWorkspaceMembership(paramName = "workspaceId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params[paramName] || req.query[paramName];
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
