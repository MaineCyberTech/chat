import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal HS256 JWT implementation for the self-hosted auth plane.
 *
 * Why hand-rolled rather than a library: the only algorithm needed is HS256 with
 * a symmetric secret, `node:crypto` already provides both primitives, and this
 * keeps the auth path free of another supply-chain dependency. Behaviour is
 * intentionally narrow — no `alg` negotiation, so `alg: none` and
 * algorithm-confusion attacks are structurally impossible.
 *
 * See docs/adr/0002-postgres-postgrest-custom-auth.md.
 */

export interface JwtClaims {
  /** Subject — the user id. */
  sub?: string;
  /** PostgREST switches the database role from this claim. */
  role?: string;
  email?: string;
  aud?: string;
  iss?: string;
  /** Expiry, seconds since epoch. */
  exp?: number;
  /** Issued at, seconds since epoch. */
  iat?: number;
  [claim: string]: unknown;
}

/** Roles this codebase issues. Mirrors the Postgres roles the bootstrap creates. */
export type JwtRole = "anon" | "authenticated" | "service_role";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour, matching auth.jwt_expiry
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signatureFor(signingInput: string, secret: string): string {
  return createHmac("sha256", secret).update(signingInput).digest("base64url");
}

/** Constant-time comparison that tolerates differing lengths without throwing. */
function secureEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function signJwt(
  claims: JwtClaims,
  secret: string,
  ttlSeconds: number = ACCESS_TOKEN_TTL_SECONDS,
): string {
  if (!secret || secret.length < 32) {
    throw new Error("JWT signing secret must be at least 32 characters");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = { iat: now, exp: now + ttlSeconds, ...claims };

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;

  return `${signingInput}.${signatureFor(signingInput, secret)}`;
}

export interface VerifyOptions {
  /** Reject the token unless its `role` claim is in this list. */
  allowedRoles?: JwtRole[];
  /** Clock skew tolerance in seconds when checking `exp`. Default 0. */
  clockToleranceSeconds?: number;
}

/**
 * Verifies an HS256 JWT. Returns the claims, or `null` for any problem —
 * malformed token, bad signature, or expired. Callers must not distinguish the
 * failure reasons to the client.
 */
export function verifyJwt(
  token: string,
  secret: string,
  options: VerifyOptions = {},
): JwtClaims | null {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  if (!header || !body || !signature) return null;

  const expected = signatureFor(`${header}.${body}`, secret);
  if (!secureEquals(signature, expected)) return null;

  let claims: JwtClaims;
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(body));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    claims = parsed as JwtClaims;
  } catch {
    return null;
  }

  const tolerance = options.clockToleranceSeconds ?? 0;
  if (typeof claims.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp + tolerance < now) return null;
  } else {
    // A token without an expiry would be valid forever; refuse it.
    return null;
  }

  if (options.allowedRoles && options.allowedRoles.length > 0) {
    if (typeof claims.role !== "string" || !options.allowedRoles.includes(claims.role as JwtRole)) {
      return null;
    }
  }

  return claims;
}

/** Reads a token's claims without verifying. Only for logging/diagnostics. */
export function decodeJwtUnsafe(token: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(parts[1]));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as JwtClaims;
  } catch {
    return null;
  }
}
