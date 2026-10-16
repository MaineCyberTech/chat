import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabase.js";
import { loadEnv } from "../config/env.js";
import { logger } from "./logger.js";
import {
  signJwt,
  verifyJwt,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  type JwtClaims,
} from "./jwt.js";

/**
 * Self-hosted auth service — the GoTrue replacement.
 *
 * All state lives in the `auth` schema, which is deliberately not exposed to
 * PostgREST (it holds password hashes). The API therefore reaches it through
 * SECURITY DEFINER functions in `public` that only `service_role` may execute
 * (see supabase/bootstrap/10_auth_api.sql), using the same PostgREST transport
 * as every other data access in this codebase.
 *
 * Enabled with AUTH_PROVIDER=local; the default remains "supabase" so existing
 * deployments keep working while the migration is rolled out.
 *
 * See docs/adr/0002-postgres-postgrest-custom-auth.md.
 */

export interface LocalAuthUser {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function admin(): SupabaseClient {
  return getSupabaseAdmin();
}

function requireJwtSecret(): string {
  const env = loadEnv();
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required when AUTH_PROVIDER=local");
  }
  return env.JWT_SECRET;
}

/** True when the self-hosted auth plane should be used. */
export function isLocalAuthEnabled(): boolean {
  return loadEnv().AUTH_PROVIDER === "local";
}

// ---------------------------------------------------------------------------
// Access tokens
// ---------------------------------------------------------------------------

export function issueAccessToken(userId: string, email?: string): string {
  return signJwt(
    {
      sub: userId,
      role: "authenticated",
      aud: "authenticated",
      iss: "chat-api",
      ...(email ? { email } : {}),
    },
    requireJwtSecret(),
    ACCESS_TOKEN_TTL_SECONDS,
  );
}

/**
 * Verifies an access token locally (no network call). Only `authenticated` and
 * `service_role` tokens are accepted as API credentials — an `anon` token is
 * valid for PostgREST but must never authenticate a request.
 */
export function verifyAccessToken(token: string): JwtClaims | null {
  const env = loadEnv();
  if (!env.JWT_SECRET) return null;
  return verifyJwt(token, env.JWT_SECRET, {
    allowedRoles: ["authenticated", "service_role"],
  });
}

// ---------------------------------------------------------------------------
// Password auth
// ---------------------------------------------------------------------------

/** Returns the user id on success, or null. Never reveals which check failed. */
export async function verifyPassword(email: string, password: string): Promise<string | null> {
  const { data, error } = await admin().rpc("auth_verify_password", {
    p_email: email,
    p_password: password,
  });

  if (error) {
    logger.error("auth_verify_password failed", { error: error.message });
    return null;
  }
  return (data as string | null) ?? null;
}

/** Returns the new user id, or null when the email is already registered. */
export async function createUser(
  email: string,
  password: string | null,
  displayName?: string | null,
): Promise<string | null> {
  const { data, error } = await admin().rpc("auth_create_user", {
    p_email: email,
    p_password: password,
    p_display_name: displayName ?? null,
  });

  if (error) {
    // The function raises only for a malformed email; treat as a client error.
    logger.warn("auth_create_user rejected", { error: error.message });
    return null;
  }
  return (data as string | null) ?? null;
}

export async function setPassword(userId: string, password: string): Promise<boolean> {
  const { data, error } = await admin().rpc("auth_set_password", {
    p_user_id: userId,
    p_password: password,
  });
  if (error) {
    logger.error("auth_set_password failed", { error: error.message });
    return false;
  }
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Magic links
// ---------------------------------------------------------------------------

/** Returns the raw token to embed in the emailed link. */
export async function createMagicLink(
  email: string,
  ttlSeconds = 60 * 60,
  purpose = "magiclink",
): Promise<string | null> {
  const { data, error } = await admin().rpc("auth_create_magic_link", {
    p_email: email,
    p_ttl_seconds: ttlSeconds,
    p_purpose: purpose,
  });

  if (error) {
    logger.error("auth_create_magic_link failed", { error: error.message });
    return null;
  }
  return (data as string | null) ?? null;
}

/** Single-use. Returns the user id, or null when invalid/expired/already used. */
export async function consumeMagicLink(token: string): Promise<string | null> {
  const { data, error } = await admin().rpc("auth_consume_magic_link", { p_token: token });
  if (error) {
    logger.error("auth_consume_magic_link failed", { error: error.message });
    return null;
  }
  return (data as string | null) ?? null;
}

// ---------------------------------------------------------------------------
// Refresh tokens
// ---------------------------------------------------------------------------

export async function issueRefreshToken(
  userId: string,
  ttlSeconds = REFRESH_TOKEN_TTL_SECONDS,
): Promise<string | null> {
  const { data, error } = await admin().rpc("auth_issue_refresh_token", {
    p_user_id: userId,
    p_ttl_seconds: ttlSeconds,
  });
  if (error) {
    logger.error("auth_issue_refresh_token failed", { error: error.message });
    return null;
  }
  return (data as string | null) ?? null;
}

/**
 * Rotates a refresh token. Returns null if the token is unknown, expired, or
 * was already rotated (replay is treated as compromise and revokes the family).
 */
export async function rotateRefreshToken(
  token: string,
  ttlSeconds = REFRESH_TOKEN_TTL_SECONDS,
): Promise<{ userId: string; refreshToken: string } | null> {
  const { data, error } = await admin().rpc("auth_rotate_refresh_token", {
    p_token: token,
    p_ttl_seconds: ttlSeconds,
  });

  if (error) {
    logger.error("auth_rotate_refresh_token failed", { error: error.message });
    return null;
  }

  // Returns a table, so PostgREST yields an array with zero or one row.
  const rows = (data as Array<{ user_id: string; token: string }> | null) ?? [];
  const row = rows[0];
  if (!row?.token || !row?.user_id) return null;

  return { userId: row.user_id, refreshToken: row.token };
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  const { data, error } = await admin().rpc("auth_revoke_refresh_token", { p_token: token });
  if (error) {
    logger.error("auth_revoke_refresh_token failed", { error: error.message });
    return false;
  }
  return Boolean(data);
}

export async function revokeAllUserTokens(userId: string): Promise<number> {
  const { data, error } = await admin().rpc("auth_revoke_all_user_tokens", { p_user_id: userId });
  if (error) {
    logger.error("auth_revoke_all_user_tokens failed", { error: error.message });
    return 0;
  }
  return Number(data ?? 0);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getAuthUser(userId: string): Promise<LocalAuthUser | null> {
  const { data, error } = await admin().rpc("auth_get_user", { p_user_id: userId });
  if (error) {
    logger.error("auth_get_user failed", { error: error.message });
    return null;
  }

  const rows = (data as Array<Record<string, unknown>> | null) ?? [];
  const row = rows[0];
  if (!row) return null;

  const meta = (row.raw_user_meta_data as Record<string, unknown> | null) ?? {};
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    emailConfirmedAt: (row.email_confirmed_at as string | null) ?? null,
    displayName: (meta.display_name as string | undefined) ?? null,
    avatarUrl: (meta.avatar_url as string | undefined) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Composite helpers used by the routes
// ---------------------------------------------------------------------------

/** Issues a fresh access + refresh token pair for a user. */
export async function startSession(userId: string, email?: string): Promise<AuthTokens | null> {
  const refreshToken = await issueRefreshToken(userId);
  if (!refreshToken) return null;

  return {
    accessToken: issueAccessToken(userId, email),
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

/** Signs in with email + password, returning a session or null. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ userId: string; tokens: AuthTokens } | null> {
  const userId = await verifyPassword(email, password);
  if (!userId) return null;

  const tokens = await startSession(userId, email);
  if (!tokens) return null;

  return { userId, tokens };
}
