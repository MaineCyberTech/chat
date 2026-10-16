/**
 * Browser auth client for the self-hosted auth service.
 *
 * Replaces the `supabase.auth.*` calls the web app used to make. The transport
 * is the API's `/v1/auth/*` endpoints (see
 * docs/adr/0002-postgres-postgrest-custom-auth.md); tokens are HS256 JWTs signed
 * by the API, and the same token is sent to PostgREST so RLS keeps applying.
 *
 * Session storage is localStorage, matching the previous supabase-js behaviour
 * (`persistSession: true`). A future hardening step is to move the refresh token
 * into an httpOnly cookie; that requires API-side cookie handling and is not a
 * regression from what shipped before.
 */
import { applyCsrfHeader } from "../csrf";
import { getApiBaseUrl } from "./config";

const STORAGE_KEY = "chat.auth.session";
/** Refresh slightly before expiry so a request never races the clock. */
const REFRESH_SKEW_SECONDS = 60;

export interface AuthUser {
  id: string;
  email: string;
  /** Kept in the supabase-js shape so existing consumers keep working. */
  user_metadata: {
    display_name?: string | null;
    avatar_url?: string | null;
  };
}

/** Shape returned by the API's /v1/auth/* endpoints. */
interface ApiUser {
  id?: string;
  email?: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

function toAuthUser(raw: ApiUser | undefined, fallbackEmail: string): AuthUser {
  return {
    id: raw?.id ?? "",
    email: raw?.email ?? fallbackEmail,
    user_metadata: {
      display_name: raw?.display_name ?? null,
      avatar_url: raw?.avatar_url ?? null,
    },
  };
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthResult {
  error?: string;
}

interface StoredSession extends AuthSession {
  /** Access-token expiry, seconds since epoch. */
  expiresAt: number;
}

let session: StoredSession | null = null;
let hydrated = false;
let refreshInFlight: Promise<AuthSession | null> | null = null;
const listeners = new Set<(session: AuthSession | null) => void>();

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

function decodeExpiry(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    // atob rather than Buffer: this runs in the browser.
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof claims.exp === "number" ? claims.exp : 0;
  } catch {
    return 0;
  }
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed?.accessToken && parsed?.refreshToken && parsed?.user) {
      session = parsed;
    }
  } catch {
    // Corrupt entry: drop it rather than failing every request.
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function persist(next: StoredSession | null): void {
  session = next;
  if (typeof window !== "undefined") {
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage disabled (private mode / quota): keep the in-memory session.
    }
  }
  const publicSession: AuthSession | null = next
    ? { accessToken: next.accessToken, refreshToken: next.refreshToken, user: next.user }
    : null;
  listeners.forEach((cb) => cb(publicSession));
}

function toStored(payload: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}): StoredSession {
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
    expiresAt: decodeExpiry(payload.accessToken),
  };
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function postJson<T>(path: string, body: unknown): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  await applyCsrfHeader("POST", headers);

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });

  let parsed: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  return { status: res.status, body: parsed as T };
}

function errorMessage(body: unknown, fallback: string): string {
  const message = (body as { error?: { message?: string } } | null)?.error?.message;
  return typeof message === "string" && message.length > 0 ? message : fallback;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSession(): AuthSession | null {
  hydrate();
  if (!session) return null;
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
  };
}

export function subscribe(callback: (session: AuthSession | null) => void): () => void {
  hydrate();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function setSessionFromTokens(accessToken: string, refreshToken: string): void {
  hydrate();
  const existingUser = session?.user;
  persist(
    toStored({
      accessToken,
      refreshToken,
      user: existingUser ?? toAuthUser(undefined, ""),
    }),
  );
}

/**
 * Returns a usable access token, refreshing it first when it is at or near
 * expiry. Returns null when there is no session or the refresh failed.
 */
export async function getAccessToken(): Promise<string | null> {
  hydrate();
  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt && session.expiresAt - REFRESH_SKEW_SECONDS > now) {
    return session.accessToken;
  }

  const refreshed = await refreshSession();
  return refreshed?.accessToken ?? null;
}

export async function refreshSession(): Promise<AuthSession | null> {
  hydrate();
  if (!session) return null;
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = session.refreshToken;

  refreshInFlight = (async () => {
    try {
      const { status, body } = await postJson<{
        accessToken?: string;
        refreshToken?: string;
        user?: ApiUser;
      }>("/v1/auth/token", { refreshToken });

      if (status !== 200 || !body?.accessToken || !body?.refreshToken) {
        // The token is dead (expired, revoked, or replayed). Drop the session.
        persist(null);
        return null;
      }

      persist(
        toStored({
          accessToken: body.accessToken,
          refreshToken: body.refreshToken,
          user: body.user ? toAuthUser(body.user, session!.user.email) : session!.user,
        }),
      );
      return getSession();
    } catch {
      // Network failure: keep the session so a later attempt can succeed.
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const { status, body } = await postJson<{
    accessToken?: string;
    refreshToken?: string;
    user?: ApiUser;
    error?: { message?: string };
  }>("/v1/auth/password", { email, password });

  if (status !== 200 || !body?.accessToken || !body?.refreshToken) {
    return { error: errorMessage(body, "Sign in failed. Please try again.") };
  }

  persist(
    toStored({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      user: toAuthUser(body.user, email),
    }),
  );
  return {};
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const { status, body } = await postJson<{
    accessToken?: string;
    refreshToken?: string;
    user?: ApiUser;
    error?: { message?: string };
  }>("/v1/auth/signup", { email, password, displayName });

  if (status !== 201 || !body?.accessToken || !body?.refreshToken) {
    return { error: errorMessage(body, "Sign up failed. Please try again.") };
  }

  persist(
    toStored({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      user: toAuthUser(body.user, email),
    }),
  );
  return {};
}

/** Requests a magic-link email. Delivery is handled server-side. */
export async function sendMagicLink(email: string): Promise<AuthResult> {
  const { status, body } = await postJson<{ error?: { message?: string } }>("/v1/auth/magic-link", {
    email,
  });

  if (status >= 400) {
    return { error: errorMessage(body, "Could not send the sign-in link.") };
  }
  return {};
}

/** Exchanges a magic-link token (from the emailed URL) for a session. */
export async function verifyMagicLink(token: string): Promise<AuthResult> {
  const { status, body } = await postJson<{
    accessToken?: string;
    refreshToken?: string;
    user?: ApiUser;
    error?: { message?: string };
  }>("/v1/auth/magic-link/verify", { token });

  if (status !== 200 || !body?.accessToken || !body?.refreshToken) {
    return { error: errorMessage(body, "This sign-in link is no longer valid.") };
  }

  persist(
    toStored({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      user: toAuthUser(body.user, ""),
    }),
  );
  return {};
}

/**
 * Starts an OAuth sign-in. Returns an error under the local auth provider, which
 * does not implement OAuth yet — surfaced to the user rather than silently
 * doing nothing.
 */
export async function signInWithOAuth(provider: "google" | "github"): Promise<AuthResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/v1/auth/oauth/${provider}`, {
      method: "GET",
      credentials: "include",
    });
    if (res.status === 501) {
      return { error: "Social sign-in is not available yet. Use email and password." };
    }
    return { error: "Social sign-in is unavailable right now." };
  } catch {
    return { error: "Social sign-in is unavailable right now." };
  }
}

export async function signOut(): Promise<void> {
  hydrate();
  const refreshToken = session?.refreshToken;
  persist(null);

  if (!refreshToken) return;
  try {
    await postJson("/v1/auth/signout", { refreshToken });
  } catch {
    // Best effort: the local session is already cleared.
  }
}
