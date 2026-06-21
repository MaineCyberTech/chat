import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { webhookService } from "./service.js";
import { logAuditEvent } from "../../services/audit.js";
import { z } from "zod";

const router: RouterType = Router();
router.use(authenticate);

const createWebhookSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  url: z.string().url().startsWith("https://"),
  secret: z.string().max(255).optional(),
  events: z.array(z.string()).min(1),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().startsWith("https://").optional(),
  secret: z.string().max(255).optional(),
  events: z.array(z.string()).min(1).optional(),
  is_active: z.boolean().optional(),
});

router.get("/webhooks", async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id || typeof workspace_id !== "string") {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: "workspace_id query param required" } });
    return;
  }
  const webhooks = await webhookService.listByWorkspace(workspace_id);
  res.json({ webhooks });
});

router.get("/webhooks/:id", validateUuidParam("id"), async (req, res) => {
  const webhook = await webhookService.getById(req.params.id as string);
  if (!webhook) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Webhook not found" } });
    return;
  }
  res.json({ webhook });
});

router.post("/webhooks", async (req, res) => {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const webhook = await webhookService.create({ ...parsed.data, created_by: req.userId! });
  if (!webhook) {
    res.status(500).json({ error: { code: "CREATE_FAILED", message: "Could not create webhook" } });
    return;
  }
  res.status(201).json({ webhook });
  logAuditEvent({
    actorUserId: req.userId,
    action: "webhook.create",
    entityType: "webhook_endpoint",
    entityId: webhook.id,
    metadata: { name: webhook.name, workspace_id: webhook.workspace_id },
  });
});

router.patch("/webhooks/:id", validateUuidParam("id"), async (req, res) => {
  const parsed = updateWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const webhook = await webhookService.update(req.params.id as string, parsed.data);
  if (!webhook) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Webhook not found" } });
    return;
  }
  res.json({ webhook });
  logAuditEvent({
    actorUserId: req.userId,
    action: "webhook.update",
    entityType: "webhook_endpoint",
    entityId: webhook.id,
    metadata: { name: webhook.name },
  });
});

router.delete("/webhooks/:id", validateUuidParam("id"), async (req, res) => {
  const webhook = await webhookService.getById(req.params.id as string);
  if (!webhook) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Webhook not found" } });
    return;
  }
  logAuditEvent({
    actorUserId: req.userId,
    action: "webhook.delete",
    entityType: "webhook_endpoint",
    entityId: req.params.id as string,
  });
  await webhookService.remove(req.params.id as string);
  res.status(204).send();
});

export default router;
