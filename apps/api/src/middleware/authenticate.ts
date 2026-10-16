import type { Request, Response, NextFunction } from "express";
import { getSupabase, getSupabaseForUser } from "../lib/supabase.js";
import { isLocalAuthEnabled, verifyAccessToken } from "../lib/local-auth.js";
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

/**
 * Authenticates a bearer token and attaches a per-request, RLS-scoped Supabase
 * client.
 *
 * Two providers are supported (see docs/adr/0002-postgres-postgrest-custom-auth.md):
 *   - AUTH_PROVIDER=supabase (default): the token is verified by GoTrue.
 *   - AUTH_PROVIDER=local: the token is an HS256 JWT we issued, verified locally
 *     with JWT_SECRET — no network round trip.
 *
 * Both paths end in `getSupabaseForUser(token)`: because PostgREST trusts the
 * same JWT_SECRET, `auth.uid()` resolves from the token's `sub` claim and the
 * existing RLS policies apply unchanged either way.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid token" } });
    return;
  }

  const token = authHeader.slice(7);

  try {
    if (isLocalAuthEnabled()) {
      const claims = verifyAccessToken(token);
      if (!claims?.sub) {
        logger.warn("Auth token rejected (local)", { requestId: req.requestId });
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
        return;
      }

      req.supabase = getSupabaseForUser(token);
      req.userId = claims.sub;
      req.userEmail = typeof claims.email === "string" ? claims.email : undefined;
      next();
      return;
    }

    const supabase = getSupabase();
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
