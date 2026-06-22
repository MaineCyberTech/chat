import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { preferencesService } from "./service.js";
import { updatePreferencesSchema } from "../../config/validators.js";

const router: RouterType = Router();
router.use(authenticate);

router.get("/preferences", async (req, res) => {
  const prefs = await preferencesService.get(req.userId!);
  res.json({
    preferences: prefs ?? { user_id: req.userId, theme: "system", notification_prefs: {} },
  });
});

router.patch("/preferences", async (req, res) => {
  const parsed = updatePreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const prefs = await preferencesService.upsert(req.userId!, parsed.data);
  if (!prefs) {
    res
      .status(500)
      .json({ error: { code: "UPDATE_FAILED", message: "Could not update preferences" } });
    return;
  }
  res.json({ preferences: prefs });
});

export default router;
