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
  const resultLimit = 20;
  const { data, error } = await req.supabase.rpc("search_messages", {
    workspace_id: parsed.data.workspace_id,
    query_text: parsed.data.q,
    result_limit: resultLimit,
    date_from: parsed.data.date_from ?? null,
    date_to: parsed.data.date_to ?? null,
    author_id: parsed.data.author_id ?? null,
    channel_ids: channelIds,
    result_offset: parsed.data.offset,
  });

  if (error) {
    res.status(500).json({ error: { code: "SEARCH_FAILED", message: error.message } });
    return;
  }

  const messages = data ?? [];
  const hasMore = messages.length === resultLimit;
  res.json({ messages, hasMore, offset: parsed.data.offset });
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
      req.userId,
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

// Pin/unpin messages
router.post(
  "/messages/:id/pin",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const success = await messageService.pin(req.params.id as string, req.supabase!);
    if (!success) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Message not found" } });
      return;
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "message.pin",
      entityType: "message",
      entityId: req.params.id as string,
    });
    res.json({ success: true });
  },
);

router.delete(
  "/messages/:id/pin",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const success = await messageService.unpin(req.params.id as string, req.supabase!);
    if (!success) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Message not found" } });
      return;
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "message.unpin",
      entityType: "message",
      entityId: req.params.id as string,
    });
    res.json({ success: true });
  },
);

// Get pinned messages for a channel
router.get(
  "/channels/:channelId/pinned",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  async (req, res) => {
    const messages = await messageService.getPinned(req.params.channelId as string, req.supabase!);
    res.json({ messages });
  },
);

// Flag/unflag messages
router.post(
  "/messages/:id/flag",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const success = await messageService.flag(req.params.id as string, req.userId!, req.supabase!);
    res.json({ success });
  },
);

router.delete(
  "/messages/:id/flag",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const success = await messageService.unflag(
      req.params.id as string,
      req.userId!,
      req.supabase!,
    );
    res.json({ success });
  },
);

// Get flagged messages
router.get("/messages/flagged", async (req, res) => {
  const messages = await messageService.getFlagged(req.userId!, req.supabase!);
  res.json({ messages });
});

// Forward message to another channel
router.post(
  "/messages/:id/forward",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const { targetChannelId } = req.body;
    if (!targetChannelId) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: "targetChannelId required" } });
      return;
    }

    const original = await messageService.getById(req.params.id as string, req.supabase!);
    if (!original) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Message not found" } });
      return;
    }

    const forwardContent = `> ${original.content.replace(/\n/g, "\n> ")}\n\n*Forwarded from ${req.params.id.slice(0, 8)}*`;

    const message = await messageService.create(
      {
        channel_id: targetChannelId,
        user_id: req.userId!,
        content: forwardContent,
      },
      req.supabase,
    );

    if (!message) {
      res
        .status(500)
        .json({ error: { code: "CREATE_FAILED", message: "Could not forward message" } });
      return;
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "message.forward",
      entityType: "message",
      entityId: message.id,
      metadata: { original_message_id: req.params.id, target_channel_id: targetChannelId },
    });

    res.status(201).json({ message });
  },
);

// Get message edit history
router.get(
  "/messages/:id/history",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  async (req, res) => {
    const history = await messageService.getEditHistory(req.params.id as string, req.supabase!);
    res.json({ history });
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

// Reminder endpoints
router.post("/messages/:id/remind", authenticate, validateUuidParam("id"), async (req, res) => {
  const { remindAt } = req.body;
  if (!remindAt) {
    res.status(400).json({ error: { code: "INVALID_INPUT", message: "remindAt required" } });
    return;
  }
  const { data, error } = await req
    .supabase!.from("message_reminders")
    .insert({
      user_id: req.userId,
      message_id: req.params.id as string,
      remind_at: remindAt,
    })
    .select("*")
    .single();
  if (error) {
    res.status(500).json({ error: { code: "CREATE_FAILED", message: error.message } });
    return;
  }
  res.status(201).json({ reminder: data });
});

router.get("/reminders", authenticate, async (req, res) => {
  const { data } = await req
    .supabase!.from("message_reminders")
    .select("*, messages!inner(content, channel_id)")
    .eq("user_id", req.userId)
    .eq("notified", false)
    .order("remind_at", { ascending: true });
  res.json({ reminders: data ?? [] });
});

router.delete("/reminders/:id", authenticate, async (req, res) => {
  const { error } = await req
    .supabase!.from("message_reminders")
    .delete()
    .eq("id", req.params.id as string)
    .eq("user_id", req.userId);
  if (error) {
    res.status(500).json({ error: { code: "DELETE_FAILED", message: error.message } });
    return;
  }
  res.status(204).send();
});

router.get(
  "/channels/:channelId/export",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  async (req, res) => {
    const format = (req.query.format as string) ?? "json";
    const { data: messages } = await req
      .supabase!.from("messages")
      .select("*, users!inner(display_name, email)")
      .eq("channel_id", req.params.channelId as string)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (!messages) {
      res
        .status(500)
        .json({ error: { code: "QUERY_FAILED", message: "Failed to fetch messages" } });
      return;
    }

    const rows = messages.map((m: Record<string, unknown>) => ({
      id: m.id,
      author:
        (m.users as Record<string, unknown>).display_name ??
        (m.users as Record<string, unknown>).email,
      content: typeof m.content === "string" ? m.content.replace(/[\n\r]+/g, " ") : "",
      created_at: m.created_at,
      edited_at: m.edited_at ?? "",
    }));

    if (format === "csv") {
      const header = "id,author,content,created_at,edited_at\n";
      const csv =
        header +
        rows
          .map(
            (r) =>
              `"${String(r.id)}","${String(r.author)}","${String(r.content).replace(/"/g, '""')}","${String(r.created_at)}","${String(r.edited_at)}"`,
          )
          .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="channel-${req.params.channelId}.csv"`,
      );
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="channel-${req.params.channelId}.json"`,
      );
      res.json({ messages: rows });
    }
  },
);

export default router;
