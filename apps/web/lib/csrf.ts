/**
 * CSRF double-submit cookie helpers.
 *
 * The API requires, on every non-GET request, that the `csrf_token` cookie and
 * the `x-csrf-token` header match. The cookie is issued by any GET to the API
 * root, so callers bootstrap it once and then attach the header.
 *
 * Shared by lib/api.ts and lib/auth/client.ts so the two do not drift.
 */
import { getApiBaseUrl } from "./auth/config";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

let csrfBootstrap: Promise<void> | null = null;

export function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

async function bootstrapCsrfToken(): Promise<void> {
  // Must be an API path: in production `/` is served by the web app, so fetching
  // the root returns no cookie and every mutating request then fails with 403.
  await fetch(`${getApiBaseUrl()}/v1/csrf-token`, {
    method: "GET",
    credentials: "include",
  });
}

/** Ensures a CSRF cookie exists. Safe to call before every mutating request. */
export async function ensureCsrfToken(): Promise<void> {
  if (typeof document === "undefined") return;
  if (getCsrfToken()) return;

  if (!csrfBootstrap) {
    csrfBootstrap = bootstrapCsrfToken().catch((err) => {
      // Allow a later call to retry rather than caching the failure forever.
      csrfBootstrap = null;
      throw err;
    });
  }
  await csrfBootstrap;
}

/**
 * Adds `x-csrf-token` to `headers` for mutating methods. No-op for GET/HEAD and
 * in server contexts.
 */
export async function applyCsrfHeader(
  method: string | undefined,
  headers: Record<string, string>,
): Promise<void> {
  if (typeof document === "undefined") return;
  const verb = (method ?? "GET").toUpperCase();
  if (verb === "GET" || verb === "HEAD") return;

  await ensureCsrfToken();
  const token = getCsrfToken();
  if (token) headers[CSRF_HEADER_NAME] = token;
}
