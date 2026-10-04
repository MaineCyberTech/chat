import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export const METRICS_TOKEN_HEADER = "x-metrics-token";

function safeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Guard against the length-mismatch throw in timingSafeEqual.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type MetricsAccess = { ok: true } | { ok: false; status: 401 | 404 };

/**
 * Authorize a worker `/metrics` scrape using the shared `METRICS_TOKEN`.
 * Fails closed: unset token hides the endpoint (404), a bad token gets 401.
 *
 * @param expected Overrides the configured token (used by the health server,
 *   which may pass an explicit token); defaults to `process.env.METRICS_TOKEN`.
 */
export function checkMetricsAccess(
  req: IncomingMessage,
  expected: string | undefined = process.env.METRICS_TOKEN,
): MetricsAccess {
  if (!expected) return { ok: false, status: 404 };

  const header = req.headers[METRICS_TOKEN_HEADER];
  const headerToken = Array.isArray(header) ? header[0] : header;
  const auth = req.headers.authorization;
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const candidate = headerToken ?? bearer;

  if (!candidate || !safeEqual(candidate, expected)) return { ok: false, status: 401 };
  return { ok: true };
}
