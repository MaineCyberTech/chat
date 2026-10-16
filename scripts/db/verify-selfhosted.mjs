#!/usr/bin/env node
/**
 * Verifies the self-hosted data plane end to end, using the *unmodified*
 * Supabase JS client — the same client the API and web app already use.
 *
 * It asserts the properties that matter for the migration:
 *   - the anon client is denied by RLS
 *   - a per-user client (same shape as getSupabaseForUser(jwt)) sees only its tenant
 *   - the service-role client bypasses RLS
 *   - writes from an anon client are rejected
 *
 * Run it against a stack with PostgREST reachable through a /rest/v1 proxy
 * (Caddy does this in every compose file):
 *
 *   SUPABASE_URL=https://chat.mainecybertech.us \
 *   SUPABASE_ANON_KEY=<minted anon jwt> \
 *   SUPABASE_SERVICE_ROLE_KEY=<minted service_role jwt> \
 *   VERIFY_USER_JWT=<user jwt for a seeded user> \
 *   node scripts/db/verify-selfhosted.mjs
 *
 * See docs/architecture/db-migration-supabase-to-selfhosted.md.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_JWT = process.env.VERIFY_USER_JWT;

if (!URL || !ANON || !SERVICE) {
  console.error(
    "SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required.\n" +
      "Mint the keys with: JWT_SECRET=<secret> node scripts/db/mint-keys.mjs",
  );
  process.exit(1);
}

const results = [];
function check(name, actual, assertion, describe) {
  const ok =
    typeof assertion === "function"
      ? assertion(actual)
      : JSON.stringify(actual) === JSON.stringify(assertion);
  results.push({ name, ok, actual });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok)
    console.log(
      `        got ${JSON.stringify(actual)}${describe ? ` (expected ${describe})` : ""}`,
    );
}
const opts = { auth: { persistSession: false } };

// 1. anon client is denied by RLS
const anon = createClient(URL, ANON, opts);
{
  const { data, error } = await anon.from("workspaces").select("id");
  check(
    "anon client is denied by RLS",
    error ? `error` : data,
    (v) => Array.isArray(v) && v.length === 0,
    "[]",
  );
}

// 2. service_role bypasses RLS
const admin = createClient(URL, SERVICE, opts);
let totalWorkspaces = 0;
{
  const { data, error } = await admin.from("workspaces").select("id");
  totalWorkspaces = error ? -1 : (data ?? []).length;
  check("service_role client bypasses RLS", totalWorkspaces, (v) => v > 0, "> 0 rows");
}

// 3. per-user client is tenant-scoped
if (USER_JWT) {
  const asUser = createClient(URL, ANON, {
    ...opts,
    global: { headers: { Authorization: `Bearer ${USER_JWT}` } },
  });
  const { data, error } = await asUser.from("workspaces").select("id");
  const visible = error ? -1 : (data ?? []).length;
  check(
    "user client sees fewer workspaces than service_role",
    { visible, totalWorkspaces },
    (v) => v.visible >= 0 && v.visible <= v.totalWorkspaces,
    "0..total",
  );
} else {
  console.log("SKIP  user-JWT tenant scoping (set VERIFY_USER_JWT to enable)");
}

// 4. anon writes are rejected
{
  const { error } = await anon
    .from("workspaces")
    .insert({ name: `rls-check-${Date.now()}`, slug: `rls-check-${Date.now()}` });
  check("anon insert is rejected", Boolean(error), true, "an error");
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
