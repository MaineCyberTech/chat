import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { authLimiter, searchLimiter, magicLinkLimiter, gdprExportLimiter } from "../../middleware/rate-limit.js";
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

const emailSchema = z.object({
  email: z.string().email("Invalid email format").max(254),
});

const router: RouterType = Router();
router.use(authLimiter);

// Send magic link with email validation
router.post(
  "/magic-link",
  magicLinkLimiter,
  asyncHandler(async (req, res) => {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }
    res.json({ success: true, message: "Magic link sent if account exists" });
  }),
);

router.get(
  "/session",
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.userId!);
    if (!profile) {
      logger.warn("Session profile not found", { userId: req.userId });
      throw new NotFoundError("User profile not found");
    }
    res.json({ user: profile });
  }),
);

router.patch(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
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
  }),
);

router.get("/online", authenticate, (_req, res) => {
  res.json({ online: getOnlineUsers() });
});

router.post(
  "/profiles",
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = batchProfilesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }
    const profiles = await authService.getProfiles(parsed.data.userIds);
    res.json({ profiles });
  }),
);

router.get(
  "/search",
  authenticate,
  searchLimiter,
  asyncHandler(async (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 2 || query.length > 100) {
      throw new BadRequestError("Query must be at least 2 characters");
    }
    const profiles = await authService.searchUsers(query);
    res.json({ profiles });
  }),
);

router.post(
  "/avatar",
  authenticate,
  asyncHandler(async (req, res) => {
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
  }),
);

router.get(
  "/avatar/:userId",
  authenticate,
  asyncHandler(async (req, res) => {
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
  }),
);

// User status (presence)
router.get(
  "/status",
  authenticate,
  asyncHandler(async (req, res) => {
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
  }),
);

router.patch(
  "/status",
  authenticate,
  asyncHandler(async (req, res) => {
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
  }),
);

// GDPR Data Export
router.get(
  "/export",
  authenticate,
  gdprExportLimiter,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdmin();
    const userId = req.userId!;

    const [
      profile,
      workspaces,
      messages,
      notifications,
      preferences,
      pushSubscriptions,
      reactions,
      consentLogs,
      channelMemberships,
      bookmarks,
      messageFlags,
      editHistory,
      scheduledPosts,
      reminders,
      statuses,
      presence,
      triggerWords,
      autoResponders,
      sidebarCategories,
      sidebarAssignments,
    ] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("workspace_members").select("*, workspaces(*)").eq("user_id", userId),
      supabase.from("messages").select("*").eq("user_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId),
      supabase.from("user_preferences").select("*").eq("user_id", userId).single(),
      supabase.from("push_subscriptions").select("*").eq("user_id", userId),
      supabase.from("reactions").select("*").eq("user_id", userId),
      supabase.from("consent_logs").select("*").eq("user_id", userId),
      supabase.from("channel_members").select("*, channels!inner(name, workspace_id)").eq("user_id", userId),
      supabase.from("channel_bookmarks").select("*").eq("created_by", userId),
      supabase.from("message_flags").select("*").eq("user_id", userId),
      supabase.from("message_edit_history").select("*").eq("edited_by", userId),
      supabase.from("scheduled_posts").select("*").eq("user_id", userId),
      supabase.from("message_reminders").select("*").eq("user_id", userId),
      supabase.from("user_statuses").select("*").eq("user_id", userId),
      supabase.from("user_presence").select("*").eq("user_id", userId),
      supabase.from("trigger_words").select("*").eq("user_id", userId),
      supabase.from("auto_responders").select("*").eq("user_id", userId),
      supabase.from("sidebar_categories").select("*").eq("user_id", userId),
      supabase.from("sidebar_channel_assignments").select("*, sidebar_categories!inner(user_id, name)").eq("sidebar_categories.user_id", userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: profile.data,
      workspaces: workspaces.data ?? [],
      messages: messages.data ?? [],
      notifications: notifications.data ?? [],
      preferences: preferences.data,
      push_subscriptions: pushSubscriptions.data ?? [],
      reactions: reactions.data ?? [],
      consent_logs: consentLogs.data ?? [],
      channel_memberships: channelMemberships.data ?? [],
      channel_bookmarks: bookmarks.data ?? [],
      message_flags: messageFlags.data ?? [],
      message_edit_history: editHistory.data ?? [],
      scheduled_posts: scheduledPosts.data ?? [],
      message_reminders: reminders.data ?? [],
      user_statuses: statuses.data ?? [],
      user_presence: presence.data ?? [],
      trigger_words: triggerWords.data ?? [],
      auto_responders: autoResponders.data ?? [],
      sidebar_categories: sidebarCategories.data ?? [],
      sidebar_channel_assignments: sidebarAssignments.data ?? [],
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="user-data-export-${userId}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  }),
);

// GDPR Data Deletion
router.delete(
  "/account",
  authenticate,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdmin();
    const userId = req.userId!;

    const { password } = req.body ?? {};
    if (!password || typeof password !== "string" || password.length === 0) {
      throw new BadRequestError("Password is required to delete your account");
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.userEmail!,
      password,
    });

    if (verifyError) {
      throw new BadRequestError("Invalid password");
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc("gdpr_delete_user", {
      target_user_id: userId,
    });

    if (rpcError) {
      logger.error("GDPR RPC delete failed", { userId, error: String(rpcError) });
      throw new InternalServerError("Failed to delete user data");
    }

    const result = rpcResult as { success: boolean; user_id: string; error?: string };
    if (!result?.success) {
      logger.error("GDPR RPC delete returned failure", { userId, result });
      throw new InternalServerError(result?.error ?? "Failed to delete user data");
    }

    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (err) {
      logger.error("Failed to delete auth user during GDPR deletion", { userId, error: String(err) });
      throw new InternalServerError("Failed to complete account deletion. Auth user could not be removed.");
    }

    res.status(204).send();
  }),
);

export default router;
