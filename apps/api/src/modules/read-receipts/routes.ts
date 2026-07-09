import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
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
  "/v1/channels/:id/read",
  asyncHandler(async (req, res) => {
    await markChannelRead(req.params.id as string, req.userId!, req.supabase!);
    res.json({ ok: true });
  }),
);

router.get(
  "/v1/channels/:id/last-viewed",
  asyncHandler(async (req, res) => {
    const lastViewed = await getLastViewed(req.params.id as string, req.userId!, req.supabase!);
    res.json({ lastViewed });
  }),
);

router.post(
  "/v1/messages/:id/read",
  asyncHandler(async (req, res) => {
    const { channelId } = req.body as { channelId?: string };
    if (!channelId) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "channelId required" } });
      return;
    }
    await markMessageRead(req.params.id as string, channelId, req.userId!, req.supabase!);
    res.json({ ok: true });
  }),
);

router.get(
  "/v1/messages/:id/readers",
  asyncHandler(async (req, res) => {
    const readers = await getMessageReaders(req.params.id as string, req.supabase!);
    res.json({ readers });
  }),
);

router.get(
  "/v1/unread/counts",
  asyncHandler(async (req, res) => {
    const channelIds = ((req.query.channel_ids as string) ?? "").split(",").filter(Boolean);
    const counts = await getUnreadCounts(req.userId!, channelIds, req.supabase!);
    res.json({ counts });
  }),
);

export default router;
