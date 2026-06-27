import type { Request, Response, NextFunction } from "express";
import { getSupabase, getSupabaseForUser } from "../lib/supabase.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      supabase?: SupabaseClient;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid token" } });
    return;
  }

  const token = authHeader.slice(7);
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      logger.warn("Auth token rejected", { requestId: req.requestId, error: error?.message });
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
      return;
    }

    // Create a per-request Supabase client with the user's JWT for RLS
    req.supabase = getSupabaseForUser(token);
    req.userId = data.user.id;
    req.userEmail = data.user.email;
    next();
  } catch (err) {
    logger.error("Auth middleware error", { requestId: req.requestId, error: String(err) });
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Authentication failed" } });
  }
}
