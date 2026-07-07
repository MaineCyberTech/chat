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
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, NotFoundError, InternalServerError } from "../../lib/app-error.js";

const router: RouterType = Router();
router.use(authLimiter);

router.get("/session", authenticate, asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.userId!);
  if (!profile) {
    logger.warn("Session profile not found", { userId: req.userId });
    throw new NotFoundError("User profile not found");
  }
  res.json({ user: profile });
}));

router.patch("/profile", authenticate, asyncHandler(async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }

  const profile = await authService.updateProfile(req.userId!, parsed.data);
  if (!profile) {
    logger.warn("Profile update failed - user not found", { userId: req.userId });
    throw new NotFoundError("User profile not found");
  }
  res.json({ user: profile });
}));

router.get("/online", authenticate, (_req, res) => {
  res.json({ online: getOnlineUsers() });
});

router.post("/profiles", authenticate, asyncHandler(async (req, res) => {
  const parsed = batchProfilesSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }
  const profiles = await authService.getProfiles(parsed.data.userIds);
  res.json({ profiles });
}));

router.get("/search", authenticate, searchLimiter, asyncHandler(async (req, res) => {
  const query = req.query.q as string;
  if (!query || query.length < 2 || query.length > 100) {
    throw new BadRequestError("Query must be at least 2 characters");
  }
  const profiles = await authService.searchUsers(query);
  res.json({ profiles });
}));

router.post("/avatar", authenticate, asyncHandler(async (req, res) => {
  const parsed = uploadAvatarSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }

  if (!req.supabase) {
    throw new InternalServerError("Auth context missing");
  }
  const fileExt = parsed.data.contentType.split("/")[1] ?? "png";
  const filePath = `avatars/${req.userId}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await req.supabase.storage
    .from("chat-uploads")
    .createSignedUploadUrl(filePath);

  if (uploadError || !uploadData) {
    throw new InternalServerError(uploadError?.message ?? "Could not create upload URL");
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
    throw new InternalServerError("Could not update profile");
  }

  res.json({ uploadUrl: uploadData.signedUrl, avatarUrl, profile });
}));

router.get("/avatar/:userId", authenticate, asyncHandler(async (req, res) => {
  if (!req.supabase) {
    throw new InternalServerError("Auth context missing");
  }
  const { userId } = req.params;
  const filePath = `avatars/${userId}.png`;

  const { data: signedUrlData, error } = await req.supabase.storage
    .from("chat-uploads")
    .createSignedUrl(filePath, 3600);

  if (error || !signedUrlData?.signedUrl) {
    throw new NotFoundError("Avatar not found");
  }

  res.json({ avatarUrl: signedUrlData.signedUrl });
}));

// User status (presence)
router.get("/status", authenticate, asyncHandler(async (req, res) => {
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
}));

router.patch("/status", authenticate, asyncHandler(async (req, res) => {
  const { status, customStatus } = req.body;
  if (status && !["online", "away", "dnd"].includes(status)) {
    throw new BadRequestError("Invalid status");
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
    throw new InternalServerError(error.message);
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
}));

// GDPR Data Export
router.get("/export", authenticate, asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const userId = req.userId!;

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
}));

// GDPR Data Deletion
router.delete("/account", authenticate, asyncHandler(async (req, res) => {
  const supabase = getSupabaseAdmin();
  const userId = req.userId!;

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
}));

export default router;
