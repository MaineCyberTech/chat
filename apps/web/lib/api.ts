/**
 * Legacy HTTP client for the chat API.
 *
 * Relationship with @chat/sdk:
 * - `packages/sdk/src/client.ts` (SDKClient) provides a generic base HTTP client
 *   with auth token injection and error handling — suitable for any consumer.
 * - This file (`api.ts`) wraps SDKClient patterns with Next.js-specific logic:
 *   Supabase session token acquisition, CSRF token handling, and 401 → sign-out.
 *
 * When to use which:
 * - Use `@chat/sdk` (SDKClient) in non-Next.js contexts (e.g. workers, scripts,
 *   packages) or when you don't need CSRF / automatic session refresh.
 * - Use `api.ts` in Next.js client components for full-featured API access.
 *
 * Goal: migrate shared functionality into SDKClient so this file becomes a thin
 * Next.js-specific adapter.
 */

const API_BASE = getApiBaseUrl();

import * as Sentry from "@sentry/nextjs";
import { applyCsrfHeader } from "@/lib/csrf";
import { getAccessToken, signOut as authSignOut } from "@/lib/auth/client";
import { getApiBaseUrl } from "@/lib/auth/config";

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return getAccessToken();
}

function apiPath(path: string): string {
  return path.startsWith("/v1") ? path : `/v1${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["x-request-id"] =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // Attaches x-csrf-token for mutating methods (bootstraps the cookie if needed).
  await applyCsrfHeader(options.method, headers);

  const res = await fetch(`${API_BASE}${apiPath(path)}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    authSignOut().catch(() => {});
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMsg = body?.error?.message ?? `Request failed: ${res.status}`;
    Sentry.captureException(new Error(errorMsg), {
      tags: { httpStatus: String(res.status), path },
    });
    throw new Error(errorMsg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
