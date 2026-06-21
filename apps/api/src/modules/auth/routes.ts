import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { authService } from "./service.js";
import { getOnlineUsers } from "../../lib/socket.js";
import { getSupabase } from "../../lib/supabase.js";
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

router.post("/avatar", authenticate, async (req, res) => {
  const parsed = uploadAvatarSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  try {
    const supabase = getSupabase();
    const fileExt = parsed.data.contentType.split("/")[1] ?? "png";
    const filePath = `avatars/${req.userId}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("chat-uploads")
      .createSignedUploadUrl(filePath);

    if (uploadError || !uploadData) {
      res
        .status(500)
        .json({
          error: {
            code: "UPLOAD_FAILED",
            message: uploadError?.message ?? "Could not create upload URL",
          },
        });
      return;
    }

    const publicUrl = supabase.storage.from("chat-uploads").getPublicUrl(filePath).data.publicUrl;

    const profile = await authService.updateProfile(req.userId!, { avatar_url: publicUrl });
    if (!profile) {
      res
        .status(500)
        .json({ error: { code: "UPDATE_FAILED", message: "Could not update profile" } });
      return;
    }

    res.json({ uploadUrl: uploadData.signedUrl, publicUrl, profile });
  } catch (err) {
    res.status(500).json({ error: { code: "UPLOAD_FAILED", message: "Avatar upload failed" } });
  }
});

export default router;
