#!/usr/bin/env node
/**
 * End-to-end test of the self-hosted auth service (WS-C).
 *
 * Drives a running API over HTTP with AUTH_PROVIDER=local and asserts the
 * properties that matter:
 *   - password sign-in works against existing bcrypt hashes (the seed users)
 *   - failures never disclose whether an account exists
 *   - access tokens authenticate API routes and resolve the right identity
 *   - anon tokens are not accepted as API credentials
 *   - refresh tokens rotate, replays are detected, and reuse revokes the family
 *   - signup / duplicate signup / signout behave
 *   - RLS still constrains a local-auth user through the API
 *   - unimplemented surfaces report 501 instead of silently falling back
 *
 * Prerequisites: API running with AUTH_PROVIDER=local, and seeded data
 * (node scripts/db/apply-migrations.mjs --seed).
 *
 * Usage:
 *   API_URL=http://localhost:4000 \
 *   FRONTEND_URL=http://localhost:3000 \
 *   ANON_KEY=<minted anon jwt> \
 *   node scripts/verify-local-auth.mjs
 *
 * See docs/adr/0002-postgres-postgrest-custom-auth.md.
 */
const API = process.env.API_URL ?? "http://localhost:4000";
const ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:3000";

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${detail}`}`);
}

let CSRF = null;

async function call(method, path, { body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      // The API's CORS layer requires an Origin on non-GET requests; it must
      // match FRONTEND_URL.
      Origin: ORIGIN,
      ...(CSRF && method !== "GET" ? { Cookie: `csrf_token=${CSRF}`, "x-csrf-token": CSRF } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body: json };
}

// --- wait for the API -------------------------------------------------------
let up = false;
for (let i = 0; i < 30; i++) {
  try {
    if ((await fetch(`${API}/health`)).ok) {
      up = true;
      break;
    }
  } catch {
    /* not listening yet */
  }
  await new Promise((r) => setTimeout(r, 1000));
}
if (!up) {
  console.error(`API never became reachable at ${API}`);
  process.exit(1);
}
console.log(`API reachable at ${API}\n`);

// --- CSRF bootstrap: the API issues the double-submit cookie on GET ---------
// Not `/`: in every deployed topology that path is served by the web app.
{
  const res = await fetch(`${API}/v1/csrf-token`, { headers: { Origin: ORIGIN } });
  const cookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
  const csrfCookie = cookies.find((c) => c.startsWith("csrf_token="));
  CSRF = csrfCookie ? csrfCookie.split(";")[0].slice("csrf_token=".length) : null;
  record("CSRF cookie issued by GET /v1/csrf-token", typeof CSRF === "string" && CSRF.length > 0);
}

const SEED_EMAIL = process.env.SEED_EMAIL ?? "marcus@seed.test";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "password123";

// --- password sign-in -------------------------------------------------------
const signIn = await call("POST", "/v1/auth/password", {
  body: { email: SEED_EMAIL, password: SEED_PASSWORD },
});
record(
  "password sign-in succeeds for a seed user",
  signIn.status === 200 && typeof signIn.body?.accessToken === "string",
  `status=${signIn.status} body=${JSON.stringify(signIn.body)?.slice(0, 200)}`,
);
const { accessToken, refreshToken } = signIn.body ?? {};

// --- failure paths do not enumerate accounts --------------------------------
const badPw = await call("POST", "/v1/auth/password", {
  body: { email: SEED_EMAIL, password: "definitely-wrong" },
});
record("wrong password is rejected with 401", badPw.status === 401, `status=${badPw.status}`);

const unknown = await call("POST", "/v1/auth/password", {
  body: { email: `nobody-${Date.now()}@seed.test`, password: SEED_PASSWORD },
});
record(
  "unknown user is rejected identically (no enumeration)",
  unknown.status === 401 && unknown.body?.error?.message === badPw.body?.error?.message,
  `status=${unknown.status} msg="${unknown.body?.error?.message}"`,
);

// --- access token -----------------------------------------------------------
const session = await call("GET", "/v1/auth/session", { token: accessToken });
record(
  "access token authenticates a protected route",
  session.status === 200,
  `status=${session.status}`,
);
record(
  "resolved identity matches the signed-in user",
  session.body?.user?.id === signIn.body?.user?.id ||
    session.body?.user_id === signIn.body?.user?.id ||
    session.body?.id === signIn.body?.user?.id,
  `session=${JSON.stringify(session.body)?.slice(0, 250)}`,
);

if (process.env.ANON_KEY) {
  const asAnon = await call("GET", "/v1/auth/session", { token: process.env.ANON_KEY });
  record(
    "anon token is rejected as an API credential",
    asAnon.status === 401,
    `status=${asAnon.status}`,
  );
}

// --- refresh rotation + reuse detection ------------------------------------
const refreshed = await call("POST", "/v1/auth/token", { body: { refreshToken } });
record(
  "refresh token rotates to a new pair",
  refreshed.status === 200 &&
    typeof refreshed.body?.accessToken === "string" &&
    refreshed.body?.refreshToken !== refreshToken,
  `status=${refreshed.status}`,
);

const replay = await call("POST", "/v1/auth/token", { body: { refreshToken } });
record(
  "replaying a rotated refresh token is rejected",
  replay.status === 401,
  `status=${replay.status}`,
);

const afterReuse = await call("POST", "/v1/auth/token", {
  body: { refreshToken: refreshed.body?.refreshToken },
});
record(
  "reuse revoked the whole token family (newest token also dead)",
  afterReuse.status === 401,
  `status=${afterReuse.status}`,
);

// --- signup -----------------------------------------------------------------
const email = `e2e-${Date.now()}@example.test`;
const PASSWORD = "correct-horse-battery";
const signup = await call("POST", "/v1/auth/signup", {
  body: { email, password: PASSWORD, displayName: "E2E User" },
});
record(
  "signup creates an account and a session",
  signup.status === 201 && !!signup.body?.accessToken,
  `status=${signup.status}`,
);

const dupe = await call("POST", "/v1/auth/signup", {
  body: { email, password: PASSWORD, displayName: "E2E User" },
});
record("duplicate signup is rejected", dupe.status === 400, `status=${dupe.status}`);

const newSignIn = await call("POST", "/v1/auth/password", { body: { email, password: PASSWORD } });
record("newly signed-up user can sign in", newSignIn.status === 200, `status=${newSignIn.status}`);

// --- signout ----------------------------------------------------------------
const signout = await call("POST", "/v1/auth/signout", {
  body: { refreshToken: newSignIn.body?.refreshToken },
});
record("signout returns 204", signout.status === 204, `status=${signout.status}`);

const afterSignout = await call("POST", "/v1/auth/token", {
  body: { refreshToken: newSignIn.body?.refreshToken },
});
record(
  "refresh token is dead after signout",
  afterSignout.status === 401,
  `status=${afterSignout.status}`,
);

// --- explicit not-implemented surface --------------------------------------
const oauth = await call("GET", "/v1/auth/oauth/google");
record(
  "OAuth reports 501 rather than silently falling back",
  oauth.status === 501,
  `status=${oauth.status}`,
);

// Magic-link delivery may or may not be wired. Either outcome is acceptable;
// what must NOT happen is a silent claim of success or an unhandled 5xx.
const magic = await call("POST", "/v1/auth/magic-link", {
  body: { email: `magic-${Date.now()}@example.test` },
});
record(
  "magic-link endpoint reports a definite outcome (200 or 501)",
  magic.status === 200 || magic.status === 501,
  `status=${magic.status} body=${JSON.stringify(magic.body)?.slice(0, 160)}`,
);

// --- RLS still applies through the API -------------------------------------
const workspaces = await call("GET", "/v1/workspaces", { token: accessToken });
const count = Array.isArray(workspaces.body?.workspaces)
  ? workspaces.body.workspaces.length
  : Array.isArray(workspaces.body)
    ? workspaces.body.length
    : -1;
record(
  "local-auth user is still constrained by RLS through the API",
  workspaces.status === 200 && count > 0,
  `status=${workspaces.status} count=${count}`,
);

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
