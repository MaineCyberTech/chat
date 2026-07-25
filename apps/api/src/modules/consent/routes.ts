import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, InternalServerError } from "../../lib/app-error.js";

const router = Router();

function maskIp(ip: string | undefined): string {
  if (!ip) return "unknown";
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.0";
  const v4 = ip.replace(/^::ffff:/, "");
  const v4Match = v4.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4Match) return v4Match[1] + ".0";
  const v6Match = ip.match(/^([0-9a-f:]+):[0-9a-f]+$/i);
  if (v6Match) return v6Match[1] + ":0";
  return "masked";
}

router.get(
  "/consent",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const supabase = req.supabase!;
    const { data, error } = await supabase
      .from("consent_logs")
      .select("*")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: false });

    if (error) {
      throw new InternalServerError("Failed to fetch consent records");
    }
    res.json({ consents: data ?? [] });
  }),
);

router.post(
  "/consent",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
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
        ip_address: maskIp(req.ip),
        user_agent: req.headers["user-agent"],
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerError("Failed to record consent");
    }
    res.status(201).json({ consent: data });
  }),
);

export default router;
