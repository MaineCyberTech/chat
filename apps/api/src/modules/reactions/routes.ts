import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireMessageAccess } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { reactionService } from "./service.js";

const router: RouterType = Router();
router.use(authenticate);

router.get(
  "/messages/:id/reactions",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const reactions = await reactionService.getByMessage(req.params.id as string, req.supabase!);
    res.json({ reactions });
  },
);

// Batch reactions endpoint: GET /reactions/batch?message_ids=id1,id2,id3
router.get("/reactions/batch", async (req, res) => {
  const idsParam = req.query.message_ids as string;
  if (!idsParam) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: "message_ids query param required" } });
    return;
  }
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length > 100) {
    res.status(400).json({ error: { code: "INVALID_INPUT", message: "Maximum 100 message IDs" } });
    return;
  }
  const reactions = await reactionService.getByMessages(ids, req.supabase!);
  res.json({ reactions });
});

router.post(
  "/messages/:id/reactions",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const { emoji } = req.body;
    if (!emoji || typeof emoji !== "string" || emoji.length > 10) {
      res.status(400).json({ error: { code: "INVALID_INPUT", message: "Invalid emoji" } });
      return;
    }

    const reaction = await reactionService.add(
      req.params.id as string,
      req.userId!,
      emoji,
      req.supabase!,
    );
    if (!reaction) {
      res.status(500).json({ error: { code: "ADD_FAILED", message: "Could not add reaction" } });
      return;
    }

    res.status(201).json({ reaction });
  },
);

router.delete(
  "/messages/:id/reactions/:emoji",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const emoji = decodeURIComponent(req.params.emoji as string);
    const removed = await reactionService.remove(
      req.params.id as string,
      req.userId!,
      emoji,
      req.supabase!,
    );
    if (!removed) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Reaction not found" } });
      return;
    }
    res.status(204).send();
  },
);

export default router;
