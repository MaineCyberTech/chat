import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { isWorkspaceMember } from "../../lib/membership.js";
import { messageService } from "./service.js";
import { getSupabase } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import { logAuditEvent } from "../../services/audit.js";
import {
  createMessageSchema,
  updateMessageSchema,
  searchQuerySchema,
  uploadRequestSchema,
} from "../../config/validators.js";

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

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("search_messages", {
    workspace_id: parsed.data.workspace_id,
    query_text: parsed.data.q,
    result_limit: 20,
  });

  if (error) {
    res.status(500).json({ error: { code: "SEARCH_FAILED", message: error.message } });
    return;
  }

  res.json({ messages: data ?? [] });
});

router.get("/channels/:channelId/messages", validateUuidParam("channelId"), async (req, res) => {
  const { before } = req.query;
  const messages = await messageService.listByChannel(
    req.params.channelId as string,
    50,
    before as string | undefined,
  );
  res.json({ messages });
});

router.post("/channels/:channelId/messages", validateUuidParam("channelId"), async (req, res) => {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const message = await messageService.create({
    channel_id: req.params.channelId as string,
    user_id: req.userId!,
    content: parsed.data.content,
    parent_id: parsed.data.parent_id,
  });

  if (!message) {
    res.status(500).json({ error: { code: "CREATE_FAILED", message: "Could not create message" } });
    return;
  }

  res.status(201).json({ message });
  logAuditEvent({
    actorUserId: req.userId,
    action: "message.create",
    entityType: "message",
    entityId: message.id,
    metadata: { channel_id: message.channel_id },
  });
});

router.patch("/messages/:id", validateUuidParam("id"), async (req, res) => {
  const parsed = updateMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const message = await messageService.update(req.params.id as string, parsed.data.content);
  if (!message) {
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
});

router.delete("/messages/:id", validateUuidParam("id"), async (req, res) => {
  const result = await messageService.remove(req.params.id as string);
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
});

router.post("/messages/upload", async (req, res) => {
  const parsed = uploadRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  try {
    const supabase = getSupabase();
    const filePath = `${req.userId}/${Date.now()}-${parsed.data.fileName}`;

    const { data, error } = await supabase.storage
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
      publicUrl: supabase.storage.from("chat-uploads").getPublicUrl(filePath).data.publicUrl,
    });
  } catch (err) {
    logger.error("Upload URL generation failed", { error: String(err) });
    res.status(500).json({ error: { code: "UPLOAD_FAILED", message: "Upload failed" } });
  }
});

export default router;
