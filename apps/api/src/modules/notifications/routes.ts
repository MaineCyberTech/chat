import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireChannelAccess } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { getSupabase } from "../../lib/supabase.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { InternalServerError, ConflictError } from "../../lib/app-error.js";
import { checkIdempotencyKey, storeIdempotencyKey } from "../../lib/idempotency.js";

const router: RouterType = Router();
router.use(authenticate);

// Get notification preference for a channel
router.get(
  "/channels/:id/notification-preference",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("channel_notification_preferences")
      .select("notify, notify_sound")
      .eq("channel_id", req.params.id)
      .eq("user_id", req.userId)
      .single();
    res.json({ preference: data ?? { notify: true, notify_sound: true } });
  }),
);

// Upsert notification preference
router.put(
  "/channels/:id/notification-preference",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (idempotencyKey) {
      const existingId = await checkIdempotencyKey(idempotencyKey);
      if (existingId) {
        throw new ConflictError("Idempotent request — preference already updated");
      }
    }

    const { notify, notify_sound } = req.body as { notify?: boolean; notify_sound?: boolean };
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("channel_notification_preferences")
      .upsert(
        {
          user_id: req.userId,
          channel_id: req.params.id,
          notify: notify ?? true,
          notify_sound: notify_sound ?? true,
        },
        { onConflict: "user_id,channel_id" },
      )
      .select("*")
      .single();
    if (error) {
      throw new InternalServerError(error.message);
    }

    if (idempotencyKey) {
      await storeIdempotencyKey(idempotencyKey, `pref:${req.params.id}`);
      res.set("Idempotency-Key", idempotencyKey);
    }

    res.json({ preference: data });
  }),
);

// Delete notification preference (reset to defaults)
router.delete(
  "/channels/:id/notification-preference",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabase();
    await supabase
      .from("channel_notification_preferences")
      .delete()
      .eq("channel_id", req.params.id)
      .eq("user_id", req.userId);
    res.status(204).send();
  }),
);

export default router;
