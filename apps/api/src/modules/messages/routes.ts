import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { requireChannelAccess, requireMessageAccess } from "../../middleware/require-membership.js";
import { messageService } from "./service.js";
import { logger } from "../../lib/logger.js";
import { logAuditEvent } from "../../services/audit.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, NotFoundError, ConflictError, InternalServerError } from "../../lib/app-error.js";
import {
  createMessageSchema,
  updateMessageSchema,
  searchQuerySchema,
  uploadRequestSchema,
} from "../../config/validators.js";
import { checkIdempotencyKey, storeIdempotencyKey } from "../../lib/idempotency.js";
import { responseCache } from "../../middleware/cache.js";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

function sanitizeContent(content: string): string {
  return purify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

const router: RouterType = Router();
router.use(authenticate);

router.get("/messages/search", responseCache(30), asyncHandler(async (req, res) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }

  if (!req.supabase) {
    throw new InternalServerError("Auth context missing");
  }
  // Sanitize search query: strip HTML tags and enforce 200 char limit
  const sanitizedQuery = parsed.data.q.replace(/<[^>]*>/g, "").slice(0, 200);
  const channelIds = parsed.data.channel_ids
    ? parsed.data.channel_ids.split(",").filter(Boolean)
    : null;
  const resultLimit = 20;
  const { data, error } = await req.supabase.rpc("search_messages", {
    workspace_id: parsed.data.workspace_id,
    query_text: sanitizedQuery,
    result_limit: resultLimit,
    date_from: parsed.data.date_from ?? null,
    date_to: parsed.data.date_to ?? null,
    author_id: parsed.data.author_id ?? null,
    channel_ids: channelIds,
    result_offset: parsed.data.offset,
  });

  if (error) {
    throw new InternalServerError(error.message);
  }

  let messages = data ?? [];

  // When type is "files", filter to messages with file/attachment content
  if (parsed.data.type === "files") {
    messages = messages.filter((m: { content?: string }) => {
      const c = m.content ?? "";
      return /!\[.*?\]\(|\[.*?\]\(.*?\.\w+\)|attachment|upload|\.(png|jpg|jpeg|gif|pdf|docx?|xlsx?|pptx?|txt|csv|svg|webp|mp[34]|mov|avi)/i.test(
        c,
      );
    });
  }

  const hasMore = messages.length === resultLimit;
  res.json({ messages, hasMore, offset: parsed.data.offset });
}));

router.get(
  "/channels/:channelId/messages",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  responseCache(15),
  asyncHandler(async (req, res) => {
    const { cursor } = req.query;
    const result = await messageService.listByChannel(
      req.params.channelId as string,
      50,
      cursor as string | undefined,
      req.supabase,
    );
    res.setHeader("Cache-Control", "private, max-age=15");
    res.json({ messages: result.messages, nextCursor: result.nextCursor });
  }),
);

router.post(
  "/channels/:channelId/messages",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  asyncHandler(async (req, res) => {
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    if (idempotencyKey) {
      const existingMessageId = await checkIdempotencyKey(idempotencyKey);
      if (existingMessageId) {
        const existingMessage = await messageService.getById(existingMessageId, req.supabase);
        if (existingMessage) {
          res.set("Idempotency-Key", idempotencyKey);
          res.status(200).json({ message: existingMessage, idempotent: true });
          return;
        }
      }
    }

    const parsed = createMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }

    const sanitizedContent = sanitizeContent(parsed.data.content);

    const message = await messageService.create(
      {
        channel_id: req.params.channelId as string,
        user_id: req.userId!,
        content: sanitizedContent,
        parent_id: parsed.data.parent_id,
        priority: parsed.data.priority,
      },
      req.supabase,
    );

    if (!message) {
      throw new InternalServerError("Could not create message");
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
  }),
);

router.patch(
  "/messages/:id",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const parsed = updateMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
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
        throw new ConflictError("Message was modified by another user");
      }
      throw new NotFoundError("Message not found");
    }

    res.json({ message });
    logAuditEvent({
      actorUserId: req.userId,
      action: "message.update",
      entityType: "message",
      entityId: message.id,
      metadata: { channel_id: message.channel_id },
    });
  }),
);

// Pin/unpin messages
router.post(
  "/messages/:id/pin",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const success = await messageService.pin(req.params.id as string, req.supabase!);
    if (!success) {
      throw new NotFoundError("Message not found");
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "message.pin",
      entityType: "message",
      entityId: req.params.id as string,
    });
    res.json({ success: true });
  }),
);

router.delete(
  "/messages/:id/pin",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const success = await messageService.unpin(req.params.id as string, req.supabase!);
    if (!success) {
      throw new NotFoundError("Message not found");
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "message.unpin",
      entityType: "message",
      entityId: req.params.id as string,
    });
    res.json({ success: true });
  }),
);

// Get pinned messages for a channel
router.get(
  "/channels/:channelId/pinned",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  responseCache(30),
  asyncHandler(async (req, res) => {
    const messages = await messageService.getPinned(req.params.channelId as string, req.supabase!);
    res.json({ messages });
  }),
);

// Flag/unflag messages
router.post(
  "/messages/:id/flag",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const success = await messageService.flag(req.params.id as string, req.userId!, req.supabase!);
    res.json({ success });
  }),
);

router.delete(
  "/messages/:id/flag",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const success = await messageService.unflag(
      req.params.id as string,
      req.userId!,
      req.supabase!,
    );
    res.json({ success });
  }),
);

// Get flagged messages
router.get("/messages/flagged", responseCache(15), asyncHandler(async (req, res) => {
  const messages = await messageService.getFlagged(req.userId!, req.supabase!);
  res.json({ messages });
}));

// Forward message to another channel
router.post(
  "/messages/:id/forward",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const { targetChannelId } = req.body;
    if (!targetChannelId) {
      throw new BadRequestError("targetChannelId required");
    }

    const original = await messageService.getById(req.params.id as string, req.supabase!);
    if (!original) {
      throw new NotFoundError("Message not found");
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
      throw new InternalServerError("Could not forward message");
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "message.forward",
      entityType: "message",
      entityId: message.id,
      metadata: { original_message_id: req.params.id, target_channel_id: targetChannelId },
    });

    res.status(201).json({ message });
  }),
);

// Get message edit history
router.get(
  "/messages/:id/history",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const history = await messageService.getEditHistory(req.params.id as string, req.supabase!);
    res.json({ history });
  }),
);

router.delete(
  "/messages/:id",
  validateUuidParam("id"),
  requireMessageAccess("id"),
  asyncHandler(async (req, res) => {
    const result = await messageService.remove(req.params.id as string, req.supabase);
    if (!result) {
      throw new NotFoundError("Message not found");
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "message.delete",
      entityType: "message",
      entityId: req.params.id as string,
    });
    res.status(204).send();
  }),
);

router.post("/messages/upload", asyncHandler(async (req, res) => {
  const parsed = uploadRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }

  if (!req.supabase) {
    throw new InternalServerError("Auth context missing");
  }

  const safeFileName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${req.userId}/${Date.now()}-${safeFileName}`;

  const { data, error } = await req.supabase.storage
    .from("chat-uploads")
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw new InternalServerError(error?.message ?? "Could not create upload URL");
  }

  res.json({
    uploadUrl: data.signedUrl,
    filePath,
    publicUrl: req.supabase.storage.from("chat-uploads").getPublicUrl(filePath).data.publicUrl,
  });
}));

// Reminder endpoints
router.post("/messages/:id/remind", authenticate, validateUuidParam("id"), asyncHandler(async (req, res) => {
  const { remindAt } = req.body;
  if (!remindAt) {
    throw new BadRequestError("remindAt required");
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
    throw new InternalServerError(error.message);
  }
  res.status(201).json({ reminder: data });
}));

router.get("/reminders", authenticate, asyncHandler(async (req, res) => {
  const { data } = await req
    .supabase!.from("message_reminders")
    .select("*, messages!inner(content, channel_id)")
    .eq("user_id", req.userId)
    .eq("notified", false)
    .order("remind_at", { ascending: true });
  res.json({ reminders: data ?? [] });
}));

router.delete("/reminders/:id", authenticate, asyncHandler(async (req, res) => {
  const { error } = await req
    .supabase!.from("message_reminders")
    .delete()
    .eq("id", req.params.id as string)
    .eq("user_id", req.userId);
  if (error) {
    throw new InternalServerError(error.message);
  }
  res.status(204).send();
}));

router.get(
  "/channels/:channelId/export",
  validateUuidParam("channelId"),
  requireChannelAccess("channelId"),
  asyncHandler(async (req, res) => {
    const format = (req.query.format as string) ?? "json";
    const { data: messages } = await req
      .supabase!.from("messages")
      .select("*, users!inner(display_name, email)")
      .eq("channel_id", req.params.channelId as string)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (!messages) {
      throw new InternalServerError("Failed to fetch messages");
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
  }),
);

export default router;
