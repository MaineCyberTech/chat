#!/usr/bin/env node
/**
 * Mints the `anon` and `service_role` JWTs used by the self-hosted data plane.
 *
 * With hosted Supabase these are long-lived API keys issued by the platform.
 * Against our own PostgREST they are simply JWTs signed with JWT_SECRET whose
 * `role` claim tells PostgREST which database role to switch into — so the
 * existing env contract (`SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`) and
 * every `supabase.from(...)` call site keep working unchanged.
 *
 * Usage:
 *   JWT_SECRET=<32+ chars> node scripts/db/mint-keys.mjs
 *   JWT_SECRET=... node scripts/db/mint-keys.mjs --json
 *
 * See docs/adr/0002-postgres-postgrest-custom-auth.md.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 365 * 5; // 5 years, like hosted keys

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url").replace(/=+$/, "");
}

function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies an HS256 JWT and returns its claims, or null when invalid/expired.
 * Kept here so the script is self-contained; the API has its own copy in
 * apps/api/src/lib/jwt.ts.
 */
function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function main() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error(
      "JWT_SECRET is required and must be at least 32 characters.\n" +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"",
    );
    process.exit(1);
  }

  const now = Math.floor(Date.now() / 1000);
  const base = { iat: now, exp: now + DEFAULT_TTL_SECONDS, iss: "chat-local" };

  const anonKey = signJwt({ ...base, role: "anon" }, secret);
  const serviceKey = signJwt({ ...base, role: "service_role" }, secret);

  if (process.argv.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          SUPABASE_ANON_KEY: anonKey,
          SUPABASE_SERVICE_ROLE_KEY: serviceKey,
        },
        null,
        2,
      ),
    );
    return;
  }

  // Round-trip check: a mistyped secret or bad encoding would otherwise only
  // surface as a cryptic 401 from PostgREST at runtime.
  for (const [name, token, role] of [
    ["anon", anonKey, "anon"],
    ["service_role", serviceKey, "service_role"],
  ]) {
    const claims = verifyJwt(token, secret);
    if (!claims || claims.role !== role) {
      console.error(`Self-check failed for ${name}: minted token did not verify.`);
      process.exit(1);
    }
  }

  console.log("# Add these to your .env / GitHub secrets.");
  console.log("# SUPABASE_URL should point at the host proxying PostgREST (/rest/v1).\n");
  console.log(`SUPABASE_ANON_KEY=${anonKey}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`);
}

main();

export { signJwt, verifyJwt };
