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
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, NotFoundError, ForbiddenError, InternalServerError } from "../../lib/app-error.js";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

function enforceBodyLimit(req: Request, res: Response, next: NextFunction) {
  const contentLength = parseInt(req.headers["content-length"] ?? "0", 10);
  if (contentLength > 262144) {
    res.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds 256KB limit" },
    });
    return;
  }
  next();
}

const router: RouterType = Router();
router.use(authenticate);
router.use(enforceBodyLimit);

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

router.get("/webhooks/deliveries", requireWorkspaceQueryParam, asyncHandler(async (req, res) => {
  const workspace_id = req.query.workspace_id as string;
  const webhookId = req.query.webhook_id as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!webhookId) {
    res.status(400).json({ error: { code: "INVALID_INPUT", message: "webhook_id query param required" } });
    return;
  }

  // Verify the webhook belongs to this workspace
  const webhook = await webhookService.getById(webhookId);
  if (!webhook || webhook.workspace_id !== workspace_id) {
    throw new NotFoundError("Webhook not found in this workspace");
  }

  const result = await webhookService.listDeliveries(webhookId, { limit, offset });
  res.json({ deliveries: result.deliveries, total: result.total, limit, offset });
}));

router.get("/webhooks", requireWorkspaceQueryParam, asyncHandler(async (req, res) => {
  const workspace_id = req.query.workspace_id as string;
  const webhooks = await webhookService.listByWorkspace(workspace_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const masked = webhooks.map((w: any) => ({
    ...w,
    secret: w.secret ? "••••••••" : "",
  }));
  res.json({ webhooks: masked });
}));

router.get(
  "/webhooks/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  asyncHandler(async (req, res) => {
    const webhook = await webhookService.getById(req.params.id as string);
    if (!webhook) {
      throw new NotFoundError("Webhook not found");
    }
    const masked = {
      ...webhook,
      secret: webhook.secret ? "••••••••" : "",
    };
    res.json({ webhook: masked });
  }),
);

router.post("/webhooks", requireWorkspaceMembership("workspace_id"), asyncHandler(async (req, res) => {
  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }

  // SSRF protection: validate webhook URL
  const urlValidation = await validateWebhookUrl(parsed.data.url);
  if (!urlValidation.valid) {
    throw new BadRequestError(urlValidation.error ?? "Invalid URL");
  }

  const webhook = await webhookService.create({ ...parsed.data, created_by: req.userId! });
  if (!webhook) {
    throw new InternalServerError("Could not create webhook");
  }
  // Show the original secret on create (one-time opportunity)
  const masked = {
    ...webhook,
    secret: parsed.data.secret ? `${parsed.data.secret.slice(0, 4)}...${parsed.data.secret.slice(-4)}` : "",
  };
  res.status(201).json({ webhook: masked });
  logAuditEvent({
    actorUserId: req.userId,
    action: "webhook.create",
    entityType: "webhook_endpoint",
    entityId: webhook.id,
    metadata: { name: webhook.name, workspace_id: webhook.workspace_id },
  });
}));

router.patch(
  "/webhooks/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  asyncHandler(async (req, res) => {
    const parsed = updateWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }

    // SSRF protection: validate webhook URL if provided
    if (parsed.data.url) {
      const urlValidation = await validateWebhookUrl(parsed.data.url);
      if (!urlValidation.valid) {
        throw new BadRequestError(urlValidation.error ?? "Invalid URL");
      }
    }

    const webhook = await webhookService.update(req.params.id as string, parsed.data);
    if (!webhook) {
      throw new NotFoundError("Webhook not found");
    }
    const masked = {
      ...webhook,
      secret: webhook.secret ? "••••••••" : "",
    };
    res.json({ webhook: masked });
    logAuditEvent({
      actorUserId: req.userId,
      action: "webhook.update",
      entityType: "webhook_endpoint",
      entityId: webhook.id,
      metadata: { name: webhook.name },
    });
  }),
);

router.delete(
  "/webhooks/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  asyncHandler(async (req, res) => {
    const webhook = await webhookService.getById(req.params.id as string);
    if (!webhook) {
      throw new NotFoundError("Webhook not found");
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "webhook.delete",
      entityType: "webhook_endpoint",
      entityId: req.params.id as string,
    });
    await webhookService.remove(req.params.id as string);
    res.status(204).send();
  }),
);

export default router;
