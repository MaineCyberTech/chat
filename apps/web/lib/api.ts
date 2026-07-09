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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const CSRF_COOKIE_NAME = "csrf_token";

let csrfPromise: Promise<void> | null = null;

function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

async function ensureCsrfToken(): Promise<void> {
  if (typeof document === "undefined") return;
  if (getCsrfToken()) return;
  await fetch(`${API_BASE}/healthz`, { method: "GET", credentials: "include" });
}

import * as Sentry from "@sentry/nextjs";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
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
  headers["x-request-id"] = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  if (options.method && options.method !== "GET" && options.method !== "HEAD") {
    if (!csrfPromise) csrfPromise = ensureCsrfToken();
    await csrfPromise;
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;
  }

  const res = await fetch(`${API_BASE}${apiPath(path)}`, { ...options, headers, credentials: "include" });

  if (res.status === 401) {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.signOut().catch(() => {});
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMsg = body?.error?.message ?? `Request failed: ${res.status}`;
    Sentry.captureException(new Error(errorMsg), { tags: { httpStatus: String(res.status), path } });
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
