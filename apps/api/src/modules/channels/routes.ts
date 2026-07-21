import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import {
  requireWorkspaceMembership,
  requireChannelAccess,
} from "../../middleware/require-membership.js";
import { channelService } from "./service.js";
import {
  createChannelSchema,
  updateChannelSchema,
  addChannelMemberSchema,
} from "../../config/validators.js";
import { logAuditEvent } from "../../services/audit.js";
import { responseCache } from "../../middleware/cache.js";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../../lib/app-error.js";
import { checkIdempotencyKey, storeIdempotencyKey } from "../../lib/idempotency.js";
import { parsePaginationParams } from "../../lib/pagination.js";

const router: RouterType = Router();
router.use(authenticate);

router.get(
  "/workspaces/:workspaceId/channels",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  responseCache(30),
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaginationParams(
      req.query.limit as string,
      req.query.offset as string,
      50,
      100,
    );
    const channels = await channelService.listByWorkspace(
      req.params.workspaceId as string,
      req.supabase,
      limit,
      offset,
    );
    res.json({ channels });
  }),
);

router.post(
  "/workspaces/:workspaceId/channels",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (idempotencyKey) {
      const existingId = await checkIdempotencyKey(idempotencyKey);
      if (existingId) {
        throw new ConflictError("Idempotent request — channel already created");
      }
    }

    const parsed = createChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }
    const channel = await channelService.create(
      {
        name: parsed.data.name,
        workspace_id: req.params.workspaceId as string,
        created_by: req.userId!,
        topic: parsed.data.topic,
        is_private: parsed.data.is_private,
      },
      req.supabase,
    );
    if (!channel) {
      throw new InternalServerError("Could not create channel");
    }

    if (idempotencyKey) {
      await storeIdempotencyKey(idempotencyKey, channel.id);
      res.set("Idempotency-Key", idempotencyKey);
    }

    res.status(201).json({ channel });
    logAuditEvent({
      actorUserId: req.userId,
      action: "channel.create",
      entityType: "channel",
      entityId: channel.id,
      metadata: { name: channel.name, workspace_id: channel.workspace_id },
    });
  }),
);

router.get(
  "/channels/:id",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  responseCache(30),
  asyncHandler(async (req, res) => {
    const channel = await channelService.getById(req.params.id as string, req.supabase);
    if (!channel) {
      throw new NotFoundError("Channel not found");
    }
    res.json({ channel });
  }),
);

router.patch(
  "/channels/:id",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const parsed = updateChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }
    const channel = await channelService.update(req.params.id as string, parsed.data);
    if (!channel) {
      if (parsed.data.version !== undefined) {
        throw new ConflictError("Channel was modified by another user");
      }
      throw new NotFoundError("Channel not found");
    }
    res.json({ channel });
    logAuditEvent({
      actorUserId: req.userId,
      action: "channel.update",
      entityType: "channel",
      entityId: channel.id,
      metadata: { name: channel.name },
    });
  }),
);

router.delete(
  "/channels/:id",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const deleted = await channelService.remove(req.params.id as string);
    if (!deleted) {
      throw new NotFoundError("Channel not found");
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "channel.delete",
      entityType: "channel",
      entityId: req.params.id as string,
    });
    res.status(204).send();
  }),
);

router.get(
  "/channels/:id/members",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  responseCache(30),
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaginationParams(
      req.query.limit as string,
      req.query.offset as string,
      50,
      100,
    );
    const members = await channelService.getMembers(req.params.id as string, limit, offset);
    res.json({ members });
  }),
);

router.post(
  "/channels/:id/members",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const parsed = addChannelMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }

    const success = await channelService.addMember(req.params.id as string, parsed.data.user_id);
    if (!success) {
      throw new InternalServerError("Could not add member");
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "channel_member.add",
      entityType: "channel_member",
      entityId: parsed.data.user_id,
      metadata: { channel_id: req.params.id },
    });

    res.status(201).json({ success: true });
  }),
);

// DM/GM channel endpoints
router.post(
  "/workspaces/:workspaceId/dm",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      throw new BadRequestError("targetUserId required");
    }
    const channel = await channelService.createDmChannel(
      req.params.workspaceId as string,
      req.userId!,
      targetUserId,
      req.supabase,
    );
    if (!channel) {
      throw new InternalServerError("Could not create DM channel");
    }
    res.status(201).json({ channel });
  }),
);

router.post(
  "/workspaces/:workspaceId/gm",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { targetUserIds } = req.body;
    if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length < 1) {
      throw new BadRequestError("targetUserIds array required");
    }
    const channel = await channelService.createGroupChannel(
      req.params.workspaceId as string,
      req.userId!,
      targetUserIds,
      req.supabase,
    );
    if (!channel) {
      throw new InternalServerError("Could not create group channel");
    }
    res.status(201).json({ channel });
  }),
);

// Get DM channels for current user (includes otherMembers with display names)
router.get(
  "/dm-channels",
  responseCache(30),
  asyncHandler(async (req, res) => {
    const channels = await channelService.listDmChannels(req.userId!, req.supabase);
    res.json({ channels });
  }),
);

// Reorder channels in a workspace
router.patch(
  "/workspaces/:workspaceId/channels/reorder",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { channelIds } = req.body;
    if (!Array.isArray(channelIds)) {
      throw new BadRequestError("channelIds array required");
    }
    const ok = await channelService.reorderChannel(req.params.workspaceId as string, channelIds);
    if (!ok) {
      throw new InternalServerError("Could not reorder channels");
    }
    res.json({ success: true });
  }),
);

// Get workspace channel IDs (for sidebar categorization)
router.get(
  "/workspaces/:workspaceId/channel-ids",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const ids = await channelService.listWorkspaceChannelIds(req.params.workspaceId as string);
    res.json({ channelIds: ids });
  }),
);

// Channel bookmarks
router.get(
  "/channels/:id/bookmarks",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  responseCache(30),
  asyncHandler(async (req, res) => {
    const { data: bookmarks } = await req
      .supabase!.from("channel_bookmarks")
      .select("*")
      .eq("channel_id", req.params.id as string)
      .order("sort_order", { ascending: true });
    res.json({ bookmarks: bookmarks ?? [] });
  }),
);

router.post(
  "/channels/:id/bookmarks",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const { title, messageId, url, emoji } = req.body;
    if (!title) {
      throw new BadRequestError("title required");
    }
    const { data: bookmark, error } = await req
      .supabase!.from("channel_bookmarks")
      .insert({
        channel_id: req.params.id as string,
        message_id: messageId ?? null,
        title,
        url: url ?? null,
        emoji: emoji ?? null,
        created_by: req.userId,
      })
      .select("*")
      .single();

    if (error || !bookmark) {
      throw new InternalServerError("Could not create bookmark");
    }
    res.status(201).json({ bookmark });
  }),
);

router.patch(
  "/channels/:id/bookmarks/:bookmarkId",
  validateUuidParam("id"),
  validateUuidParam("bookmarkId"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const { sort_order, title, url, emoji } = req.body;
    const updates: Record<string, unknown> = {};
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (title !== undefined) updates.title = title;
    if (url !== undefined) updates.url = url;
    if (emoji !== undefined) updates.emoji = emoji;
    updates.updated_at = new Date().toISOString();

    const { error } = await req
      .supabase!.from("channel_bookmarks")
      .update(updates)
      .eq("id", req.params.bookmarkId as string);
    if (error) {
      throw new InternalServerError("Could not update bookmark");
    }
    res.status(200).json({ success: true });
  }),
);

router.delete(
  "/channels/:id/bookmarks/:bookmarkId",
  validateUuidParam("id"),
  validateUuidParam("bookmarkId"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const { error } = await req
      .supabase!.from("channel_bookmarks")
      .delete()
      .eq("id", req.params.bookmarkId as string);
    if (error) {
      throw new NotFoundError("Bookmark not found");
    }
    res.status(204).send();
  }),
);

router.delete(
  "/channels/:id/members/:userId",
  validateUuidParam("id"),
  validateUuidParam("userId"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const success = await channelService.removeMember(
      req.params.id as string,
      req.params.userId as string,
    );
    if (!success) {
      throw new NotFoundError("Member not found");
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "channel_member.remove",
      entityType: "channel_member",
      entityId: req.params.userId as string,
      metadata: { channel_id: req.params.id },
    });

    res.status(204).send();
  }),
);

router.get(
  "/channels/:id/members/history",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const { data, error } = await req
      .supabase!.from("channel_member_history")
      .select("*, users!inner(display_name, email)")
      .eq("channel_id", req.params.id as string)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new InternalServerError(error.message);
    res.json({ history: data ?? [] });
  }),
);

export default router;
