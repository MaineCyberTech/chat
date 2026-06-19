import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { authService } from "./service.js";
import { getOnlineUsers } from "../../lib/socket.js";
import { updateProfileSchema, batchProfilesSchema } from "../../config/validators.js";

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

export default router;
