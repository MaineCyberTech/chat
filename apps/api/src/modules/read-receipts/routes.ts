import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { requireChannelAccess } from "../../middleware/require-membership.js";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  markChannelRead,
  getLastViewed,
  markMessageRead,
  getMessageReaders,
  getUnreadCounts,
} from "./service.js";

const router = Router();
router.use(authenticate);

router.post(
  "/channels/:id/read",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    await markChannelRead(req.params.id as string, req.userId!, req.supabase!);
    res.json({ ok: true });
  }),
);

router.get(
  "/channels/:id/last-viewed",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const lastViewed = await getLastViewed(req.params.id as string, req.userId!, req.supabase!);
    res.json({ lastViewed });
  }),
);

router.post(
  "/messages/:id/read",
  validateUuidParam("id"),
  asyncHandler(async (req, res) => {
    const { channelId } = req.body as { channelId?: string };
    if (!channelId) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "channelId required" } });
      return;
    }
    const { data: channel, error: chErr } = await req
      .supabase!.from("channels")
      .select("workspace_id")
      .eq("id", channelId)
      .single();
    if (chErr || !channel) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
      return;
    }
    const { data: member, error: memErr } = await req
      .supabase!.from("workspace_members")
      .select("role")
      .eq("workspace_id", channel.workspace_id)
      .eq("user_id", req.userId)
      .single();
    if (memErr || !member) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
      return;
    }
    await markMessageRead(req.params.id as string, channelId, req.userId!, req.supabase!);
    res.json({ ok: true });
  }),
);

router.get(
  "/messages/:id/readers",
  validateUuidParam("id"),
  asyncHandler(async (req, res) => {
    const supabase = req.supabase!;
    const { data: message, error: msgErr } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", req.params.id as string)
      .single();
    if (msgErr || !message) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Message not found" } });
      return;
    }
    const { data: channel, error: chErr } = await supabase
      .from("channels")
      .select("workspace_id")
      .eq("id", message.channel_id)
      .single();
    if (chErr || !channel) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
      return;
    }
    const { data: member, error: memErr } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", channel.workspace_id)
      .eq("user_id", req.userId)
      .single();
    if (memErr || !member) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
      return;
    }
    const readers = await getMessageReaders(req.params.id as string, req.supabase!);
    res.json({ readers });
  }),
);

router.get(
  "/unread/counts",
  asyncHandler(async (req, res) => {
    const channelIds = ((req.query.channel_ids as string) ?? "").split(",").filter(Boolean);
    const counts = await getUnreadCounts(req.userId!, channelIds, req.supabase!);
    res.json({ counts });
  }),
);

export default router;
