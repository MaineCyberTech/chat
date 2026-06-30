import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.get("/consent", authenticate, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("consent_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: { message: "Failed to fetch consent records" } });
    return;
  }
  res.json({ consents: data ?? [] });
});

router.post("/consent", authenticate, async (req: Request, res: Response) => {
  const { consent_type, granted } = req.body;
  if (!consent_type || typeof granted !== "boolean") {
    res.status(400).json({ error: { message: "consent_type and granted are required" } });
    return;
  }
  if (!["analytics", "marketing", "cookies"].includes(consent_type)) {
    res.status(400).json({ error: { message: "Invalid consent_type" } });
    return;
  }

  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("consent_logs")
    .insert({
      user_id: req.userId!,
      consent_type,
      granted,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: { message: "Failed to record consent" } });
    return;
  }
  res.status(201).json({ consent: data });
});

export default router;
