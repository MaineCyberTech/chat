import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, InternalServerError } from "../../lib/app-error.js";

const router = Router();

router.get("/consent", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("consent_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new InternalServerError("Failed to fetch consent records");
  }
  res.json({ consents: data ?? [] });
}));

router.post("/consent/log", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { consent_type, granted } = req.body;
  if (!consent_type || typeof granted !== "boolean") {
    throw new BadRequestError("consent_type and granted are required");
  }
  if (!["analytics", "marketing", "cookies"].includes(consent_type)) {
    throw new BadRequestError("Invalid consent_type");
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
    throw new InternalServerError("Failed to record consent");
  }
  res.status(201).json({ consent: data });
}));

router.post("/consent", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { consent_type, granted } = req.body;
  if (!consent_type || typeof granted !== "boolean") {
    throw new BadRequestError("consent_type and granted are required");
  }
  if (!["analytics", "marketing", "cookies"].includes(consent_type)) {
    throw new BadRequestError("Invalid consent_type");
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
    throw new InternalServerError("Failed to record consent");
  }
  res.status(201).json({ consent: data });
}));

export default router;
