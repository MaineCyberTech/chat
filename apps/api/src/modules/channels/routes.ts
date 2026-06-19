import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { channelService } from "./service.js";
import { createChannelSchema, updateChannelSchema } from "../../config/validators.js";

const router: RouterType = Router();
router.use(authenticate);

router.get("/workspaces/:workspaceId/channels", async (req, res) => {
  const channels = await channelService.listByWorkspace(req.params.workspaceId);
  res.json({ channels });
});

router.post("/workspaces/:workspaceId/channels", async (req, res) => {
  const parsed = createChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const channel = await channelService.create({
    name: parsed.data.name,
    workspace_id: req.params.workspaceId,
    created_by: req.userId!,
    topic: parsed.data.topic,
    is_private: parsed.data.is_private,
  });

  if (!channel) {
    res.status(500).json({ error: { code: "CREATE_FAILED", message: "Could not create channel" } });
    return;
  }

  res.status(201).json({ channel });
});

router.get("/channels/:id", async (req, res) => {
  const channel = await channelService.getById(req.params.id);
  if (!channel) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
    return;
  }
  res.json({ channel });
});

router.patch("/channels/:id", async (req, res) => {
  const parsed = updateChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const channel = await channelService.update(req.params.id, parsed.data);
  if (!channel) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
    return;
  }
  res.json({ channel });
});

router.delete("/channels/:id", async (req, res) => {
  const deleted = await channelService.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Channel not found" } });
    return;
  }
  res.status(204).send();
});

export default router;
