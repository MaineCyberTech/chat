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

const router: RouterType = Router();
router.use(authenticate);

router.get(
  "/workspaces/:workspaceId/channels",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  async (req, res) => {
    const channels = await channelService.listByWorkspace(req.params.workspaceId as string);
    res.json({ channels });
  },
);

router.post(
  "/workspaces/:workspaceId/channels",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  async (req, res) => {
    const parsed = createChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }

    const channel = await channelService.create({
      name: parsed.data.name,
      workspace_id: req.params.workspaceId as string,
      created_by: req.userId!,
      topic: parsed.data.topic,
      is_private: parsed.data.is_private,
    });

    if (!channel) {
      res
        .status(500)
        .json({ error: { code: "CREATE_FAILED", message: "Could not create channel" } });
      return;
    }

    res.status(201).json({ channel });
    logAuditEvent({
      actorUserId: req.userId,
      action: "channel.create",
      entityType: "channel",
      entityId: channel.id,
      metadata: { name: channel.name, workspace_id: channel.workspace_id },
    });
  },
);

router.get(
  "/channels/:id",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  async (req, res) => {
    const channel = await channelService.getById(req.params.id as string);
    if (!channel) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
      return;
    }
    res.json({ channel });
  },
);

router.patch(
  "/channels/:id",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  async (req, res) => {
    const parsed = updateChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }
    const channel = await channelService.update(req.params.id as string, parsed.data);
    if (!channel) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
      return;
    }
    res.json({ channel });
    logAuditEvent({
      actorUserId: req.userId,
      action: "channel.update",
      entityType: "channel",
      entityId: channel.id,
      metadata: { name: channel.name },
    });
  },
);

router.delete(
  "/channels/:id",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  async (req, res) => {
    const deleted = await channelService.remove(req.params.id as string);
    if (!deleted) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
      return;
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "channel.delete",
      entityType: "channel",
      entityId: req.params.id as string,
    });
    res.status(204).send();
  },
);

router.get(
  "/channels/:id/members",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  async (req, res) => {
    const members = await channelService.getMembers(req.params.id as string);
    res.json({ members });
  },
);

router.post(
  "/channels/:id/members",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  async (req, res) => {
    const parsed = addChannelMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }

    const success = await channelService.addMember(req.params.id as string, parsed.data.user_id);
    if (!success) {
      res.status(500).json({ error: { code: "CREATE_FAILED", message: "Could not add member" } });
      return;
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "channel_member.add",
      entityType: "channel_member",
      entityId: parsed.data.user_id,
      metadata: { channel_id: req.params.id },
    });

    res.status(201).json({ success: true });
  },
);

router.delete(
  "/channels/:id/members/:userId",
  validateUuidParam("id"),
  validateUuidParam("userId"),
  requireChannelAccess("id"),
  async (req, res) => {
    const success = await channelService.removeMember(
      req.params.id as string,
      req.params.userId as string,
    );
    if (!success) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Member not found" } });
      return;
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "channel_member.remove",
      entityType: "channel_member",
      entityId: req.params.userId as string,
      metadata: { channel_id: req.params.id },
    });

    res.status(204).send();
  },
);

export default router;
