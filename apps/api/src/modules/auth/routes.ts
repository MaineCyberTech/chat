import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authLimiter, searchLimiter } from "../../middleware/rate-limit.js";
import { authService } from "./service.js";
import { getOnlineUsers } from "../../lib/socket.js";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import {
  updateProfileSchema,
  batchProfilesSchema,
  uploadAvatarSchema,
} from "../../config/validators.js";

const router: RouterType = Router();
router.use(authLimiter);

router.get("/session", authenticate, async (req, res) => {
  const profile = await authService.getProfile(req.userId!);
  if (!profile) {
    logger.warn("Session profile not found", { userId: req.userId });
    res.status(404).json({ error: { code: "NOT_FOUND", message: "User profile not found" } });
    return;
  }
  res.json({ user: profile });
});

router.patch("/profile", authenticate, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const profile = await authService.updateProfile(req.userId!, parsed.data);
  if (!profile) {
    logger.warn("Profile update failed - user not found", { userId: req.userId });
    res.status(404).json({ error: { code: "NOT_FOUND", message: "User profile not found" } });
    return;
  }
  res.json({ user: profile });
});

router.get("/online", authenticate, (_req, res) => {
  res.json({ online: getOnlineUsers() });
});

router.post("/profiles", authenticate, async (req, res) => {
  const parsed = batchProfilesSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const profiles = await authService.getProfiles(parsed.data.userIds);
  res.json({ profiles });
});

router.get("/search", authenticate, searchLimiter, async (req, res) => {
  const query = req.query.q as string;
  if (!query || query.length < 2 || query.length > 100) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: "Query must be at least 2 characters" } });
    return;
  }
  const profiles = await authService.searchUsers(query);
  res.json({ profiles });
});

router.post("/avatar", authenticate, async (req, res) => {
  const parsed = uploadAvatarSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  try {
    if (!req.supabase) {
      res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
      return;
    }
    const fileExt = parsed.data.contentType.split("/")[1] ?? "png";
    const filePath = `avatars/${req.userId}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await req.supabase.storage
      .from("chat-uploads")
      .createSignedUploadUrl(filePath);

    if (uploadError || !uploadData) {
      res.status(500).json({
        error: {
          code: "UPLOAD_FAILED",
          message: uploadError?.message ?? "Could not create upload URL",
        },
      });
      return;
    }

    // Use signed URL for avatar access (expires in 1 hour, refreshed on demand)
    const { data: signedUrlData } = await req.supabase.storage
      .from("chat-uploads")
      .createSignedUrl(filePath, 3600);

    const avatarUrl =
      signedUrlData?.signedUrl ??
      req.supabase.storage.from("chat-uploads").getPublicUrl(filePath).data.publicUrl;

    const profile = await authService.updateProfile(req.userId!, { avatar_url: avatarUrl });
    if (!profile) {
      res
        .status(500)
        .json({ error: { code: "UPDATE_FAILED", message: "Could not update profile" } });
      return;
    }

    res.json({ uploadUrl: uploadData.signedUrl, avatarUrl, profile });
  } catch {
    res.status(500).json({ error: { code: "UPLOAD_FAILED", message: "Avatar upload failed" } });
  }
});

router.get("/avatar/:userId", authenticate, async (req, res) => {
  if (!req.supabase) {
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
    return;
  }
  const { userId } = req.params;
  const filePath = `avatars/${userId}.png`;

  const { data: signedUrlData, error } = await req.supabase.storage
    .from("chat-uploads")
    .createSignedUrl(filePath, 3600);

  if (error || !signedUrlData?.signedUrl) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Avatar not found" } });
    return;
  }

  res.json({ avatarUrl: signedUrlData.signedUrl });
});

// User status (presence)
router.get("/status", authenticate, async (req, res) => {
  const { data } = await req
    .supabase!.from("user_presence")
    .select("*")
    .eq("user_id", req.userId!)
    .single();
  res.json({
    status: data ?? {
      user_id: req.userId,
      status: "online",
      last_seen_at: new Date().toISOString(),
    },
  });
});

router.patch("/status", authenticate, async (req, res) => {
  const { status, customStatus } = req.body;
  if (status && !["online", "away", "dnd"].includes(status)) {
    res.status(400).json({ error: { code: "INVALID_INPUT", message: "Invalid status" } });
    return;
  }
  const { error } = await req.supabase!.from("user_presence").upsert(
    {
      user_id: req.userId!,
      status: status ?? "online",
      custom_status: customStatus ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    res.status(500).json({ error: { code: "UPDATE_FAILED", message: error.message } });
    return;
  }

  // Broadcast status change via Socket.io
  try {
    const { getIO } = await import("../../lib/socket.js");
    const io = getIO();
    io.emit("presence:update", { userId: req.userId, status: status ?? "online" });
  } catch (err) {
    logger.warn("Failed to broadcast status change", { error: String(err) });
  }

  res.json({ success: true });
});

// GDPR Data Export
router.get("/export", authenticate, async (req, res) => {
  const supabase = getSupabaseAdmin();
  const userId = req.userId!;

  try {
    // Collect all user data
    const [profile, workspaces, messages, notifications, preferences, pushSubscriptions] =
      await Promise.all([
        supabase.from("users").select("*").eq("id", userId).single(),
        supabase.from("workspace_members").select("*, workspaces(*)").eq("user_id", userId),
        supabase.from("messages").select("*").eq("user_id", userId),
        supabase.from("notifications").select("*").eq("user_id", userId),
        supabase.from("user_preferences").select("*").eq("user_id", userId).single(),
        supabase.from("push_subscriptions").select("*").eq("user_id", userId),
      ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: profile.data,
      workspaces: workspaces.data ?? [],
      messages: messages.data ?? [],
      notifications: notifications.data ?? [],
      preferences: preferences.data,
      push_subscriptions: pushSubscriptions.data ?? [],
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="user-data-export-${userId}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    logger.error("GDPR export failed", { userId, error: String(err) });
    res
      .status(500)
      .json({ error: { code: "EXPORT_FAILED", message: "Failed to export user data" } });
  }
});

// GDPR Data Deletion
router.delete("/account", authenticate, async (req, res) => {
  const supabase = getSupabaseAdmin();
  const userId = req.userId!;

  try {
    // Delete user data in order (respecting FK constraints)
    await supabase.from("notifications").delete().eq("user_id", userId);
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    await supabase.from("messages").delete().eq("user_id", userId);
    await supabase.from("reactions").delete().eq("user_id", userId);
    await supabase.from("channel_members").delete().eq("user_id", userId);
    await supabase.from("workspace_members").delete().eq("user_id", userId);
    await supabase.from("user_preferences").delete().eq("user_id", userId);
    await supabase.from("users").delete().eq("id", userId);

    // Delete auth user (requires service role)
    await supabase.auth.admin.deleteUser(userId);

    res.status(204).send();
  } catch (err) {
    logger.error("GDPR delete failed", { userId, error: String(err) });
    res
      .status(500)
      .json({ error: { code: "DELETE_FAILED", message: "Failed to delete user account" } });
  }
});

export default router;
