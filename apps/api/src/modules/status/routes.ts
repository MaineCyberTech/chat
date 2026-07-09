import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { getSupabase } from "../../lib/supabase.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, InternalServerError } from "../../lib/app-error.js";

const router: RouterType = Router();
router.use(authenticate);

interface StatusBody {
  emoji?: string;
  text?: string;
  duration?: "30m" | "1h" | "4h" | "today" | "week";
}

function calcExpiry(duration: string): string | null {
  const now = new Date();
  switch (duration) {
    case "30m":
      return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case "4h":
      return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    case "today": {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return end.toISOString();
    }
    case "week": {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return end.toISOString();
    }
    default:
      return null;
  }
}

router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_statuses")
      .select("*")
      .eq("user_id", req.userId)
      .single();
    res.json({ status: data ?? null });
  }),
);

router.put(
  "/status",
  asyncHandler(async (req, res) => {
    const { emoji = "speech_balloon", text = "", duration } = req.body as StatusBody;
    if (text.length > 100) {
      throw new BadRequestError("Status text max 100 chars");
    }
    const supabase = getSupabase();
    const expiresAt = duration ? calcExpiry(duration) : null;
    const { data, error } = await supabase
      .from("user_statuses")
      .upsert(
        {
          user_id: req.userId,
          emoji,
          text,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ status: data });
  }),
);

router.delete(
  "/status",
  asyncHandler(async (req, res) => {
    const supabase = getSupabase();
    await supabase.from("user_statuses").delete().eq("user_id", req.userId);
    res.status(204).send();
  }),
);

// Get statuses for multiple users (used for display)
router.post(
  "/status/batch",
  asyncHandler(async (req, res) => {
    const { userIds } = req.body as { userIds: string[] };
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.json({ statuses: {} });
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_statuses")
      .select("*")
      .in("user_id", userIds)
      .is("expires_at", null)
      .or(`expires_at.gt.${new Date().toISOString()}`);
    const map: Record<string, { emoji: string; text: string }> = {};
    if (data) {
      for (const row of data) {
        map[row.user_id] = { emoji: row.emoji, text: row.text };
      }
    }
    res.json({ statuses: map });
  }),
);

// Get presence for multiple users (online/away/dnd/offline)
router.post(
  "/status/presence/batch",
  asyncHandler(async (req, res) => {
    const { userIds } = req.body as { userIds: string[] };
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.json({ presence: {} });
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_presence")
      .select("user_id, status, last_seen_at")
      .in("user_id", userIds);
    const presenceMap: Record<string, { status: string; last_seen_at: string | null }> = {};
    if (data) {
      for (const row of data) {
        presenceMap[row.user_id] = { status: row.status, last_seen_at: row.last_seen_at };
      }
    }
    // Default offline for any not found
    for (const uid of userIds) {
      if (!presenceMap[uid]) {
        presenceMap[uid] = { status: "offline", last_seen_at: null };
      }
    }
    res.json({ presence: presenceMap });
  }),
);

// Auto-responder

router.get(
  "/auto-responder",
  asyncHandler(async (req, res) => {
    const workspaceId = req.query.workspace_id as string;
    if (!workspaceId) {
      res.json({
        responder: {
          enabled: false,
          message: "I am currently away.",
          trigger_status: ["away", "dnd"],
        },
      });
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase
      .from("auto_responders")
      .select("*")
      .eq("user_id", req.userId)
      .eq("workspace_id", workspaceId)
      .single();
    res.json({
      responder: data ?? {
        enabled: false,
        message: "I am currently away.",
        trigger_status: ["away", "dnd"],
      },
    });
  }),
);

router.put(
  "/auto-responder",
  asyncHandler(async (req, res) => {
    const { workspace_id, message, enabled, trigger_status } = req.body as {
      workspace_id: string;
      message?: string;
      enabled?: boolean;
      trigger_status?: string[];
    };
    if (!workspace_id) {
      throw new BadRequestError("workspace_id required");
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("auto_responders")
      .upsert(
        {
          user_id: req.userId,
          workspace_id,
          message: message ?? "I am currently away.",
          enabled: enabled ?? false,
          trigger_status: trigger_status ?? ["away", "dnd"],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,workspace_id" },
      )
      .select("*")
      .single();
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ responder: data });
  }),
);

export default router;
