import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireMessageAccess } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { reactionService } from "./service.js";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from "../../lib/app-error.js";
import { getIO } from "../../lib/socket.js";

const router: RouterType = Router();
router.use(authenticate);

router.get(
  "/messages/:id/reactions",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const reactions = await reactionService.getByMessage(req.params.id as string, req.supabase!);
    res.json({ reactions });
  }),
);

// Batch reactions endpoint: GET /reactions/batch?message_ids=id1,id2,id3
router.get(
  "/reactions/batch",
  asyncHandler(async (req, res) => {
    const idsParam = req.query.message_ids as string;
    if (!idsParam) {
      throw new BadRequestError("message_ids query param required");
    }
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length > 100) {
      throw new BadRequestError("Maximum 100 message IDs");
    }

    // Verify user has access to all requested messages' channels
    const { data: messages } = await req
      .supabase!.from("messages")
      .select("id, channel_id")
      .in("id", ids);

    const accessibleIds = new Set((messages ?? []).map((m: { id: string }) => m.id));
    const missing = ids.filter((id) => !accessibleIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundError("Some messages not found");
    }

    const channelIds = [
      ...new Set((messages ?? []).map((m: { channel_id: string }) => m.channel_id)),
    ];
    const { data: channels } = await req
      .supabase!.from("channels")
      .select("id, workspace_id, is_private")
      .in("id", channelIds);

    for (const ch of channels ?? []) {
      const channel = ch as { id: string; workspace_id: string; is_private: boolean };
      const { data: member } = await req
        .supabase!.from("workspace_members")
        .select("role")
        .eq("workspace_id", channel.workspace_id)
        .eq("user_id", req.userId)
        .single();
      if (!member) {
        throw new ForbiddenError("Not a member of this workspace");
      }
      if (channel.is_private) {
        const { data: channelMember } = await req
          .supabase!.from("channel_members")
          .select("user_id")
          .eq("channel_id", channel.id)
          .eq("user_id", req.userId)
          .single();
        if (!channelMember) {
          throw new ForbiddenError("Not a member of this private channel");
        }
      }
    }

    const reactions = await reactionService.getByMessages(ids, req.supabase!);
    res.json({ reactions });
  }),
);

router.post(
  "/messages/:id/reactions",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const { emoji } = req.body;
    if (!emoji || typeof emoji !== "string" || emoji.length > 10) {
      throw new BadRequestError("Invalid emoji");
    }

    const reaction = await reactionService.add(
      req.params.id as string,
      req.userId!,
      emoji,
      req.supabase!,
    );
    if (!reaction) {
      throw new InternalServerError("Could not add reaction");
    }

    res.status(201).json({ reaction });

    (async () => {
      try {
        const { data: msg } = await req
          .supabase!.from("messages")
          .select("channel_id")
          .eq("id", req.params.id as string)
          .single();
        if (msg) {
          getIO()
            .to(`channel:${msg.channel_id}`)
            .emit("reaction:added", { messageId: req.params.id as string, reaction });
        }
      } catch {
        // Socket broadcast best-effort
      }
    })();
  }),
);

router.delete(
  "/messages/:id/reactions/:emoji",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const emoji = decodeURIComponent(req.params.emoji as string);
    const removed = await reactionService.remove(
      req.params.id as string,
      req.userId!,
      emoji,
      req.supabase!,
    );
    if (!removed) {
      throw new NotFoundError("Reaction not found");
    }
    res.status(204).send();

    (async () => {
      try {
        const { data: msg } = await req
          .supabase!.from("messages")
          .select("channel_id")
          .eq("id", req.params.id as string)
          .single();
        if (msg) {
          getIO()
            .to(`channel:${msg.channel_id}`)
            .emit("reaction:removed", { messageId: req.params.id as string, reactionId: emoji });
        }
      } catch {
        // Socket broadcast best-effort
      }
    })();
  }),
);

export default router;
