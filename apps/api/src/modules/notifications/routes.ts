import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireChannelAccess } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";

import { asyncHandler } from "../../lib/async-handler.js";
import {
  BadRequestError,
  InternalServerError,
  ConflictError,
  NotFoundError,
} from "../../lib/app-error.js";
import { checkIdempotencyKey, storeIdempotencyKey } from "../../lib/idempotency.js";
import { parsePaginationParams } from "../../lib/pagination.js";
import { notificationService } from "./service.js";

const router: RouterType = Router();
router.use(authenticate);

// List notifications with pagination
router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaginationParams(
      req.query.limit as string,
      req.query.offset as string,
      20,
      100,
    );
    const workspaceId = req.query.workspace_id as string | undefined;
    const notifications = await notificationService.list(
      req.userId!,
      workspaceId,
      limit,
      offset,
      req.supabase!,
    );
    res.json({ notifications, limit, offset });
  }),
);

// Get unread notification count
router.get(
  "/notifications/unread",
  asyncHandler(async (req, res) => {
    const workspaceId = req.query.workspace_id as string | undefined;
    const unread = await notificationService.unreadCount(req.userId!, workspaceId, req.supabase!);
    res.json({ unread });
  }),
);

// List all channel notification preferences for the current user
router.get(
  "/notifications/preferences",
  asyncHandler(async (req, res) => {
    const supabase = req.supabase!;
    const { data, error } = await supabase
      .from("channel_notification_preferences")
      .select("channel_id, notify")
      .eq("user_id", req.userId);
    if (error) throw new InternalServerError(error.message);
    res.json({ preferences: data ?? [] });
  }),
);

// Get notification preference for a channel
router.get(
  "/channels/:id/notification-preference",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  asyncHandler(async (req, res) => {
    const supabase = req.supabase!;
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

    const { notify, notify_sound, notify_everyone } = req.body as {
      notify?: boolean;
      notify_sound?: boolean;
      notify_everyone?: boolean;
    };
    const supabase = req.supabase!;
    const { data, error } = await supabase
      .from("channel_notification_preferences")
      .upsert(
        {
          user_id: req.userId,
          channel_id: req.params.id,
          notify: notify ?? true,
          notify_sound: notify_sound ?? true,
          notify_everyone: notify_everyone ?? true,
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
    const supabase = req.supabase!;
    await supabase
      .from("channel_notification_preferences")
      .delete()
      .eq("channel_id", req.params.id)
      .eq("user_id", req.userId);
    res.status(204).send();
  }),
);

// List trigger words for the current user
router.get(
  "/trigger-words",
  asyncHandler(async (req, res) => {
    const supabase = req.supabase!;
    const { data, error } = await supabase
      .from("trigger_words")
      .select("id, word, created_at")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ trigger_words: data });
  }),
);

// Alias: /notifications/trigger-words
router.get(
  "/notifications/trigger-words",
  asyncHandler(async (req, res) => {
    const supabase = req.supabase!;
    const { data, error } = await supabase
      .from("trigger_words")
      .select("id, word, created_at")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: true });
    if (error) throw new InternalServerError(error.message);
    res.json({ trigger_words: data });
  }),
);

// Add a trigger word
router.post(
  "/trigger-words",
  asyncHandler(async (req, res) => {
    const { word } = req.body as { word?: string };
    if (!word || !word.trim()) {
      throw new BadRequestError("Word is required");
    }
    const trimmed = word.trim().toLowerCase();
    if (trimmed.length > 100) {
      throw new BadRequestError("Word must be 100 characters or less");
    }
    const supabase = req.supabase!;
    const { data, error } = await supabase
      .from("trigger_words")
      .insert({ user_id: req.userId, word: trimmed })
      .select("id, word, created_at")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new ConflictError("Trigger word already exists");
      }
      throw new InternalServerError(error.message);
    }
    res.status(201).json({ trigger_word: data });
  }),
);

// Delete a trigger word
router.delete(
  "/trigger-words/:id",
  validateUuidParam("id"),
  asyncHandler(async (req, res) => {
    const supabase = req.supabase!;
    const { data: _data, error } = await supabase
      .from("trigger_words")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .select("id")
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Trigger word not found");
      }
      throw new InternalServerError(error.message);
    }
    res.status(204).send();
  }),
);

export default router;
