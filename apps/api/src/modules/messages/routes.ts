import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { requireChannelAccess, requireMessageAccess } from "../../middleware/require-membership.js";
import { messageService } from "./service.js";
import { logger } from "../../lib/logger.js";
import { logAuditEvent } from "../../services/audit.js";
import {
  createMessageSchema,
  updateMessageSchema,
  searchQuerySchema,
  uploadRequestSchema,
} from "../../config/validators.js";
import { checkIdempotencyKey, storeIdempotencyKey } from "../../lib/idempotency.js";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

function sanitizeContent(content: string): string {
  return purify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

const router: RouterType = Router();
router.use(authenticate);

router.get("/messages/search", async (req, res) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  if (!req.supabase) {
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
    return;
  }
  const channelIds = parsed.data.channel_ids
    ? parsed.data.channel_ids.split(",").filter(Boolean)
    : null;
  const { data, error } = await req.supabase.rpc("search_messages", {
    workspace_id: parsed.data.workspace_id,
    query_text: parsed.data.q,
    result_limit: 20,
    date_from: parsed.data.date_from ?? null,
    date_to: parsed.data.date_to ?? null,
    author_id: parsed.data.author_id ?? null,
    channel_ids: channelIds,
  });

  if (error) {
    res.status(500).json({ error: { code: "SEARCH_FAILED", message: error.message } });
    return;
  }

  res.json({ messages: data ?? [] });
});

router.get(
  "/channels/:channelId/messages",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  async (req, res) => {
    const { cursor } = req.query;
    const result = await messageService.listByChannel(
      req.params.channelId as string,
      50,
      cursor as string | undefined,
      req.supabase,
    );
    res.json({ messages: result.messages, nextCursor: result.nextCursor });
  },
);

router.post(
  "/channels/:channelId/messages",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  async (req, res) => {
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    if (idempotencyKey) {
      const existingMessageId = await checkIdempotencyKey(idempotencyKey);
      if (existingMessageId) {
        const existingMessage = await messageService.getById(existingMessageId, req.supabase);
        if (existingMessage) {
          res.set("Idempotency-Key", idempotencyKey);
          return res.status(200).json({ message: existingMessage, idempotent: true });
        }
      }
    }

    const parsed = createMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }

    const sanitizedContent = sanitizeContent(parsed.data.content);

    const message = await messageService.create(
      {
        channel_id: req.params.channelId as string,
        user_id: req.userId!,
        content: sanitizedContent,
        parent_id: parsed.data.parent_id,
      },
      req.supabase,
    );

    if (!message) {
      res
        .status(500)
        .json({ error: { code: "CREATE_FAILED", message: "Could not create message" } });
      return;
    }

    if (idempotencyKey) {
      await storeIdempotencyKey(idempotencyKey, message.id);
      res.set("Idempotency-Key", idempotencyKey);
    }

    res.status(201).json({ message });
    logAuditEvent({
      actorUserId: req.userId,
      action: "message.create",
      entityType: "message",
      entityId: message.id,
      metadata: { channel_id: message.channel_id },
    });
  },
);

router.patch(
  "/messages/:id",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const parsed = updateMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }

    const sanitizedContent = sanitizeContent(parsed.data.content);
    const version = parsed.data.version;

    const message = await messageService.update(
      req.params.id as string,
      sanitizedContent,
      req.supabase,
      version,
    );
    if (!message) {
      if (version !== undefined) {
        res
          .status(409)
          .json({ error: { code: "CONFLICT", message: "Message was modified by another user" } });
        return;
      }
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Message not found" } });
      return;
    }

    res.json({ message });
    logAuditEvent({
      actorUserId: req.userId,
      action: "message.update",
      entityType: "message",
      entityId: message.id,
      metadata: { channel_id: message.channel_id },
    });
  },
);

router.delete(
  "/messages/:id",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const result = await messageService.remove(req.params.id as string, req.supabase);
    if (!result) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Message not found" } });
      return;
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "message.delete",
      entityType: "message",
      entityId: req.params.id as string,
    });
    res.status(204).send();
  },
);

router.post("/messages/upload", async (req, res) => {
  const parsed = uploadRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  try {
    if (!req.supabase) {
      res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
      return;
    }

    const safeFileName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${req.userId}/${Date.now()}-${safeFileName}`;

    const { data, error } = await req.supabase.storage
      .from("chat-uploads")
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      res.status(500).json({
        error: {
          code: "UPLOAD_FAILED",
          message: error?.message ?? "Could not create upload URL",
        },
      });
      return;
    }

    res.json({
      uploadUrl: data.signedUrl,
      filePath,
      publicUrl: req.supabase.storage.from("chat-uploads").getPublicUrl(filePath).data.publicUrl,
    });
  } catch (err) {
    logger.error("Upload URL generation failed", { error: String(err) });
    res.status(500).json({ error: { code: "UPLOAD_FAILED", message: "Upload failed" } });
  }
});

export default router;
