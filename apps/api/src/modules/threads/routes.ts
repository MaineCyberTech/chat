import { Router, type Request, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireChannelAccess } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { threadService } from "./service.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { NotFoundError, InternalServerError, ForbiddenError } from "../../lib/app-error.js";

const router = Router();
router.use(authenticate);

// List all threads for current user
router.get(
  "/threads",
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await req
      .supabase!.from("thread_participants")
      .select(
        "thread_metadata!inner(messages!inner(id, content, user_id, created_at, channel_id), reply_count, last_reply_at), last_viewed_at",
      )
      .eq("user_id", req.userId)
      .order("last_reply_at", { ascending: false });
    if (error) throw new InternalServerError(error.message);
    res.json({ threads: data });
  }),
);

// Get thread metadata and replies for a message
router.get(
  "/messages/:id/thread",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const thread = await threadService.getThread(req.params.id as string, req.supabase!);
    if (!thread) {
      throw new NotFoundError("Thread not found");
    }
    res.json({ thread });
  }),
);

// Get thread participants
router.get(
  "/threads/:id/participants",
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const threadId = req.params.id as string;
    const supabase = req.supabase!;

    const { data: metadata } = await supabase
      .from("thread_metadata")
      .select("message_id")
      .eq("id", threadId)
      .single();

    if (!metadata) throw new NotFoundError("Thread not found");

    const { data: message } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", metadata.message_id)
      .single();

    if (!message) throw new NotFoundError("Parent message not found");

    const { data: channel } = await supabase
      .from("channels")
      .select("workspace_id, is_private")
      .eq("id", message.channel_id)
      .single();

    if (!channel) throw new NotFoundError("Channel not found");

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", channel.workspace_id)
      .eq("user_id", req.userId)
      .single();

    if (!member) throw new ForbiddenError("Not a member of this workspace");

    if (channel.is_private) {
      const { data: channelMember } = await supabase
        .from("channel_members")
        .select("user_id")
        .eq("channel_id", message.channel_id)
        .eq("user_id", req.userId)
        .single();
      if (!channelMember) throw new ForbiddenError("Not a member of this private channel");
    }

    const participants = await threadService.getParticipants(threadId, supabase);
    res.json({ participants });
  }),
);

// Join a thread
router.post(
  "/threads/:id/join",
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const success = await threadService.joinThread(
      req.params.id as string,
      req.userId!,
      req.supabase!,
    );
    if (!success) {
      throw new InternalServerError("Could not join thread");
    }
    res.json({ success: true });
  }),
);

// Leave a thread
router.post(
  "/threads/:id/leave",
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    await threadService.leaveThread(req.params.id as string, req.userId!, req.supabase!);
    res.json({ success: true });
  }),
);

// Get thread unread count
router.get(
  "/threads/:id/unread",
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const count = await threadService.getUnreadCount(
      req.params.id as string,
      req.userId!,
      req.supabase!,
    );
    res.json({ unread: count });
  }),
);

export default router;
