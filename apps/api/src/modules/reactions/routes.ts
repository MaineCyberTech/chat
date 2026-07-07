import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireMessageAccess } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { reactionService } from "./service.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, NotFoundError, InternalServerError } from "../../lib/app-error.js";

const router: RouterType = Router();
router.use(authenticate);

router.get(
  "/messages/:id/reactions",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const reactions = await reactionService.getByMessage(req.params.id as string, req.supabase!);
    res.json({ reactions });
  }),
);

// Batch reactions endpoint: GET /reactions/batch?message_ids=id1,id2,id3
router.get("/reactions/batch", asyncHandler(async (req, res) => {
  const idsParam = req.query.message_ids as string;
  if (!idsParam) {
    throw new BadRequestError("message_ids query param required");
  }
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length > 100) {
    throw new BadRequestError("Maximum 100 message IDs");
  }
  const reactions = await reactionService.getByMessages(ids, req.supabase!);
  res.json({ reactions });
}));

router.post(
  "/messages/:id/reactions",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const { emoji } = req.body;
    if (!emoji || typeof emoji !== "string" || emoji.length > 10) {
      throw new BadRequestError("Invalid emoji");
    }

    const reaction = await reactionService.add(
      req.params.id as string,
      req.userId!,
      emoji,
      req.supabase!,
    );
    if (!reaction) {
      throw new InternalServerError("Could not add reaction");
    }

    res.status(201).json({ reaction });
  }),
);

router.delete(
  "/messages/:id/reactions/:emoji",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const emoji = decodeURIComponent(req.params.emoji as string);
    const removed = await reactionService.remove(
      req.params.id as string,
      req.userId!,
      emoji,
      req.supabase!,
    );
    if (!removed) {
      throw new NotFoundError("Reaction not found");
    }
    res.status(204).send();
  }),
);

export default router;
