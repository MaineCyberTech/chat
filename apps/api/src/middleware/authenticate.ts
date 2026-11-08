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
      /** Time (epoch ms) of the most recent primary authentication for this token. */
      authenticatedAt?: number;
    }
  }
}

function getTokenAuthenticatedAt(token: string): number | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      amr?: Array<{ timestamp?: number }>;
      auth_time?: number;
      iat?: number;
    };
    const amrTimes = (claims.amr ?? [])
      .map((entry) => Number(entry.timestamp))
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0);
    if (amrTimes.length > 0) return Math.max(...amrTimes) * 1000;
    if (typeof claims.auth_time === "number") return claims.auth_time * 1000;
    // Do not fall back to `iat`: access tokens are silently refreshed, so `iat`
    // does not prove a recent primary authentication.
  } catch {
    // A malformed/opaque token is still validated by Supabase above; only the
    // optional re-auth timestamp is unavailable.
  }
  return undefined;
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
    req.authenticatedAt = getTokenAuthenticatedAt(token);
    next();
  } catch (err) {
    logger.error("Auth middleware error", { requestId: req.requestId, error: String(err) });
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Authentication failed" } });
  }
}
