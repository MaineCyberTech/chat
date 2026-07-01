import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type Router as RouterType,
} from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { requireWorkspaceMembership } from "../../middleware/require-membership.js";
import { webhookService } from "./service.js";
import { validateWebhookUrl } from "./service.js";
import { logAuditEvent } from "../../services/audit.js";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

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

function requireWorkspaceQueryParam(req: Request, res: Response, next: NextFunction) {
  const workspaceId = req.query.workspace_id as string | undefined;
  if (!workspaceId) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: "workspace_id query param required" } });
    return;
  }
  const extReq = req as unknown as { supabase?: SupabaseClient; userId?: string };
  const supabase = extReq.supabase;
  if (!supabase) {
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
    return;
  }
  supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", extReq.userId ?? "")
    .single()
    .then(({ data, error }: { data: { role: string } | null; error: unknown }) => {
      if (error || !data) {
        res
          .status(403)
          .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
        return;
      }
      next();
    });
}

router.get("/webhooks", requireWorkspaceQueryParam, async (req, res) => {
  const workspace_id = req.query.workspace_id as string;
  const webhooks = await webhookService.listByWorkspace(workspace_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const masked = webhooks.map((w: any) => ({
    ...w,
    secret: w.secret ? `${w.secret.slice(0, 4)}...${w.secret.slice(-4)}` : "",
  }));
  res.json({ webhooks: masked });
});

router.get(
  "/webhooks/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  async (req, res) => {
    const webhook = await webhookService.getById(req.params.id as string);
    if (!webhook) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Webhook not found" } });
      return;
    }
    // Mask secret in response
    const masked = {
      ...webhook,
      secret: webhook.secret ? `${webhook.secret.slice(0, 4)}...${webhook.secret.slice(-4)}` : "",
    };
    res.json({ webhook: masked });
  },
);

router.post("/webhooks", requireWorkspaceMembership("workspace_id"), async (req, res) => {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  // SSRF protection: validate webhook URL
  const urlValidation = await validateWebhookUrl(parsed.data.url);
  if (!urlValidation.valid) {
    res.status(400).json({ error: { code: "INVALID_URL", message: urlValidation.error } });
    return;
  }

  const webhook = await webhookService.create({ ...parsed.data, created_by: req.userId! });
  if (!webhook) {
    res.status(500).json({ error: { code: "CREATE_FAILED", message: "Could not create webhook" } });
    return;
  }
  const masked = {
    ...webhook,
    secret: webhook.secret ? `${webhook.secret.slice(0, 4)}...${webhook.secret.slice(-4)}` : "",
  };
  res.status(201).json({ webhook: masked });
  logAuditEvent({
    actorUserId: req.userId,
    action: "webhook.create",
    entityType: "webhook_endpoint",
    entityId: webhook.id,
    metadata: { name: webhook.name, workspace_id: webhook.workspace_id },
  });
});

router.patch(
  "/webhooks/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  async (req, res) => {
    const parsed = updateWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }

    // SSRF protection: validate webhook URL if provided
    if (parsed.data.url) {
      const urlValidation = await validateWebhookUrl(parsed.data.url);
      if (!urlValidation.valid) {
        res.status(400).json({ error: { code: "INVALID_URL", message: urlValidation.error } });
        return;
      }
    }

    const webhook = await webhookService.update(req.params.id as string, parsed.data);
    if (!webhook) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Webhook not found" } });
      return;
    }
    const masked = {
      ...webhook,
      secret: webhook.secret ? `${webhook.secret.slice(0, 4)}...${webhook.secret.slice(-4)}` : "",
    };
    res.json({ webhook: masked });
    logAuditEvent({
      actorUserId: req.userId,
      action: "webhook.update",
      entityType: "webhook_endpoint",
      entityId: webhook.id,
      metadata: { name: webhook.name },
    });
  },
);

router.delete(
  "/webhooks/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  async (req, res) => {
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
  },
);

export default router;
