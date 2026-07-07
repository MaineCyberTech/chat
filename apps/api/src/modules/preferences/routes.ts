import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { preferencesService } from "./service.js";
import { updatePreferencesSchema } from "../../config/validators.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, InternalServerError } from "../../lib/app-error.js";

const router: RouterType = Router();
router.use(authenticate);

router.get("/preferences", asyncHandler(async (req, res) => {
  const prefs = await preferencesService.get(req.userId!);
  res.json({
    preferences: prefs ?? { user_id: req.userId, theme: "system", notification_prefs: {} },
  });
}));

router.patch("/preferences", asyncHandler(async (req, res) => {
  const parsed = updatePreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }

  const prefs = await preferencesService.upsert(req.userId!, parsed.data);
  if (!prefs) {
    throw new InternalServerError("Could not update preferences");
  }
  res.json({ preferences: prefs });
}));

export default router;
