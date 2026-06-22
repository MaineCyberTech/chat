import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { reactionService } from "./service.js";

const router: RouterType = Router();
router.use(authenticate);

router.get("/messages/:id/reactions", validateUuidParam("id"), async (req, res) => {
  const reactions = await reactionService.getByMessage(req.params.id as string);
  res.json({ reactions });
});

router.post("/messages/:id/reactions", validateUuidParam("id"), async (req, res) => {
  const { emoji } = req.body;
  if (!emoji || typeof emoji !== "string" || emoji.length > 10) {
    res.status(400).json({ error: { code: "INVALID_INPUT", message: "Invalid emoji" } });
    return;
  }

  const reaction = await reactionService.add(req.params.id as string, req.userId!, emoji);
  if (!reaction) {
    res.status(500).json({ error: { code: "ADD_FAILED", message: "Could not add reaction" } });
    return;
  }

  res.status(201).json({ reaction });
});

router.delete("/messages/:id/reactions/:emoji", validateUuidParam("id"), async (req, res) => {
  const emoji = decodeURIComponent(req.params.emoji as string);
  const removed = await reactionService.remove(req.params.id as string, req.userId!, emoji);
  if (!removed) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Reaction not found" } });
    return;
  }
  res.status(204).send();
});

export default router;
