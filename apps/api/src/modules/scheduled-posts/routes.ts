import { Router, type Request, type Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticate as requireAuth } from "../../middleware/authenticate.js";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase as SupabaseClient;
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .is("sent_at", null)
    .is("cancelled_at", null)
    .order("scheduled_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ posts: data });
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { channel_id, content, scheduled_at } = req.body;
  if (!channel_id || !content || !scheduled_at) {
    return res.status(400).json({ error: "channel_id, content, and scheduled_at required" });
  }
  const sched = new Date(scheduled_at);
  if (sched <= new Date()) {
    return res.status(400).json({ error: "scheduled_at must be in the future" });
  }
  const supabase = req.supabase as SupabaseClient;
  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert({ user_id: req.userId, channel_id, content, scheduled_at: sched.toISOString() })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ post: data });
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase as SupabaseClient;
  const { error } = await supabase
    .from("scheduled_posts")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
