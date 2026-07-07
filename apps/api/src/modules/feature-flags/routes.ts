import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateStringKeyParam } from "../../middleware/validate-string-key.js";
import { featureFlagService } from "../../lib/feature-flags.js";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, NotFoundError, InternalServerError } from "../../lib/app-error.js";

const router: RouterType = Router();
router.use(authenticate);

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

router.get("/feature-flags", asyncHandler(async (req, res) => {
  const flags = await featureFlagService.getAllFlags();
  res.json({ flags });
}));

router.get("/feature-flags/:key", asyncHandler(async (req, res) => {
  const flag = await featureFlagService.getFlag(req.params.key as string);
  if (!flag) {
    throw new NotFoundError("Feature flag not found");
  }
  res.json({ flag });
}));

router.post("/feature-flags", asyncHandler(async (req, res) => {
  const parsed = createFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }
  const flag = await featureFlagService.createFlag({
    ...parsed.data,
    description: parsed.data.description ?? "",
  });
  if (!flag) {
    throw new InternalServerError("Could not create feature flag");
  }
  res.status(201).json({ flag });
}));

router.patch("/feature-flags/:key", validateStringKeyParam("key"), asyncHandler(async (req, res) => {
  const parsed = updateFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }
  const flag = await featureFlagService.updateFlag(req.params.key as string, parsed.data);
  if (!flag) {
    throw new NotFoundError("Feature flag not found");
  }
  res.json({ flag });
}));

router.delete("/feature-flags/:key", validateStringKeyParam("key"), asyncHandler(async (req, res) => {
  const deleted = await featureFlagService.deleteFlag(req.params.key as string);
  if (!deleted) {
    throw new NotFoundError("Feature flag not found");
  }
  res.status(204).send();
}));

router.post("/feature-flags/:key/evaluate", asyncHandler(async (req, res) => {
  const parsed = evaluateFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }
  const result = await featureFlagService.evaluateFlag(req.params.key as string, {
    userId: parsed.data.userId ?? req.userId,
    userRole: parsed.data.userRole ?? (req as { workspaceRole?: string }).workspaceRole,
  });
  res.json({ evaluation: result });
}));

export default router;
