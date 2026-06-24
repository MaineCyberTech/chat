import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireWorkspaceMembership } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { featureFlagService } from "../../lib/feature-flags.js";
import { z } from "zod";

const router: RouterType = Router();
router.use(authenticate);
router.use(requireWorkspaceMembership("workspaceId"));

const createFlagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).default(0),
  targetRoles: z.array(z.string()).default([]),
  targetUserIds: z.array(z.string().uuid()).default([]),
});

const updateFlagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  targetRoles: z.array(z.string()).optional(),
  targetUserIds: z.array(z.string().uuid()).optional(),
});

const evaluateFlagSchema = z.object({
  userId: z.string().uuid().optional(),
  userRole: z.string().optional(),
});

router.get("/feature-flags", async (req, res) => {
  const flags = await featureFlagService.getAllFlags();
  res.json({ flags });
});

router.get("/feature-flags/:key", async (req, res) => {
  const flag = await featureFlagService.getFlag(req.params.key);
  if (!flag) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Feature flag not found" } });
    return;
  }
  res.json({ flag });
});

router.post("/feature-flags", async (req, res) => {
  const parsed = createFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const flag = await featureFlagService.createFlag({
    ...parsed.data,
    description: parsed.data.description ?? "",
  });
  if (!flag) {
    res
      .status(500)
      .json({ error: { code: "CREATE_FAILED", message: "Could not create feature flag" } });
    return;
  }
  res.status(201).json({ flag });
});

router.patch("/feature-flags/:key", validateUuidParam("key"), async (req, res) => {
  const parsed = updateFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const flag = await featureFlagService.updateFlag(req.params.key as string, parsed.data);
  if (!flag) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Feature flag not found" } });
    return;
  }
  res.json({ flag });
});

router.delete("/feature-flags/:key", validateUuidParam("key"), async (req, res) => {
  const deleted = await featureFlagService.deleteFlag(req.params.key as string);
  if (!deleted) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Feature flag not found" } });
    return;
  }
  res.status(204).send();
});

router.post("/feature-flags/:key/evaluate", async (req, res) => {
  const parsed = evaluateFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const result = await featureFlagService.evaluateFlag(req.params.key, {
    userId: parsed.data.userId ?? req.userId,
    userRole: parsed.data.userRole ?? (req as { workspaceRole?: string }).workspaceRole,
  });
  res.json({ evaluation: result });
});

export default router;
