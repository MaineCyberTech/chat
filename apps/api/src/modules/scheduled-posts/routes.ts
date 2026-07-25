import { Router, type Request, type Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticate as requireAuth } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../lib/app-error.js";

const router = Router();

async function requireWorkspaceMember(workspaceId: string, req: Request): Promise<void> {
  const supabase = req.supabase as SupabaseClient;
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", req.userId)
    .single();
  if (error || !data) {
    throw new ForbiddenError("Not a member of this workspace");
  }
}

async function getChannelWorkspaceId(channelId: string, req: Request): Promise<string> {
  const supabase = req.supabase as SupabaseClient;
  const { data, error } = await supabase
    .from("channels")
    .select("workspace_id")
    .eq("id", channelId)
    .single();
  if (error || !data) {
    throw new NotFoundError("Channel not found");
  }
  return data.workspace_id;
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const workspace_id = req.query.workspace_id as string | undefined;
    if (!workspace_id) {
      throw new BadRequestError("workspace_id query parameter required");
    }
    await requireWorkspaceMember(workspace_id, req);
    const supabase = req.supabase as SupabaseClient;
    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .is("sent_at", null)
      .is("cancelled_at", null)
      .eq("user_id", req.userId)
      .order("scheduled_at", { ascending: true });
    if (error) throw new InternalServerError(error.message);
    res.json({ posts: data });
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { channel_id, content, scheduled_at } = req.body;
    if (!channel_id || !content || !scheduled_at) {
      throw new BadRequestError("channel_id, content, and scheduled_at required");
    }
    const workspaceId = await getChannelWorkspaceId(channel_id, req);
    await requireWorkspaceMember(workspaceId, req);
    const sched = new Date(scheduled_at);
    if (sched <= new Date()) {
      throw new BadRequestError("scheduled_at must be in the future");
    }
    const supabase = req.supabase as SupabaseClient;
    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({ user_id: req.userId, channel_id, content, scheduled_at: sched.toISOString() })
      .select()
      .single();
    if (error) throw new InternalServerError(error.message);
    res.status(201).json({ post: data });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const supabase = req.supabase as SupabaseClient;
    const { data: post, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("channel_id, user_id")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !post) {
      throw new NotFoundError("Scheduled post not found");
    }
    if (post.user_id !== req.userId) {
      throw new ForbiddenError("Not authorized to cancel this scheduled post");
    }
    const workspaceId = await getChannelWorkspaceId(post.channel_id, req);
    await requireWorkspaceMember(workspaceId, req);
    const { error } = await supabase
      .from("scheduled_posts")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("id", req.params.id);
    if (error) throw new InternalServerError(error.message);
    res.json({ success: true });
  }),
);

export default router;
