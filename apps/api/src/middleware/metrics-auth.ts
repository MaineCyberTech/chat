import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export const METRICS_TOKEN_HEADER = "x-metrics-token";

function safeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Guard against the length-mismatch throw in timingSafeEqual.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Restrict the Prometheus `/metrics` endpoint to a dedicated scraper/service
 * token (`METRICS_TOKEN`) instead of any authenticated user session.
 *
 * Fails closed: if the token is not configured the endpoint is hidden (404),
 * and a missing or incorrect token returns 401. This stops per-tenant metrics
 * from leaking to ordinary users.
 */
export function requireMetricsAccess(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.METRICS_TOKEN;
  if (!expected) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
    return;
  }

  const header = req.headers[METRICS_TOKEN_HEADER];
  const headerToken = Array.isArray(header) ? header[0] : header;
  const auth = req.headers.authorization;
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const candidate = headerToken ?? bearer;

  if (!candidate || !safeEqual(candidate, expected)) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid metrics token" } });
    return;
  }

  next();
}
