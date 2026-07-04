import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { getSupabase } from "../../lib/supabase.js";

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

router.get("/status", async (req, res) => {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_statuses")
    .select("*")
    .eq("user_id", req.userId)
    .single();
  res.json({ status: data ?? null });
});

router.put("/status", async (req, res) => {
  const { emoji = "speech_balloon", text = "", duration } = req.body as StatusBody;
  if (text.length > 100) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: "Status text max 100 chars" } });
    return;
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
    res.status(500).json({ error: { code: "UPDATE_FAILED", message: error.message } });
    return;
  }
  res.json({ status: data });
});

router.delete("/status", async (req, res) => {
  const supabase = getSupabase();
  await supabase.from("user_statuses").delete().eq("user_id", req.userId);
  res.status(204).send();
});

// Get statuses for multiple users (used for display)
router.post("/status/batch", async (req, res) => {
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
});

export default router;
