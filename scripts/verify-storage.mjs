#!/usr/bin/env node
/**
 * End-to-end test of self-hosted object storage (WS-B).
 *
 * Exercises the real path a browser takes:
 *   sign in -> ask the API for an upload URL -> PUT the bytes -> GET the object
 *   back through the public URL.
 *
 * It also asserts the property that is easy to get wrong with self-hosted S3:
 * the presigned URL must be signed for a *browser-reachable* host, not the
 * internal service name. A URL presigned against `http://minio:9000` is
 * unusable outside the compose network because SigV4 signs the Host header.
 *
 * Prerequisites: API running with AUTH_PROVIDER=local and S3_* configured.
 *
 * Usage:
 *   API_URL=http://localhost:4000 node scripts/verify-storage.mjs
 *
 * See docs/architecture/db-migration-supabase-to-selfhosted.md (WS-B).
 */
const API = process.env.API_URL ?? "http://localhost:4000";
const ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL ?? "marcus@seed.test";
const PASSWORD = process.env.SEED_PASSWORD ?? "password123";

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${detail}`}`);
}

let CSRF = null;
// The API issues the double-submit cookie on GET. `/` is served by the web app
// in every deployed topology, so bootstrap from an API path instead.
{
  const res = await fetch(`${API}/v1/csrf-token`, { headers: { Origin: ORIGIN } });
  const cookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
  const c = cookies.find((v) => v.startsWith("csrf_token="));
  CSRF = c ? c.split(";")[0].slice("csrf_token=".length) : null;
}
async function call(method, path, { body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
      ...(CSRF && method !== "GET" ? { Cookie: `csrf_token=${CSRF}`, "x-csrf-token": CSRF } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

// --- reachability + CSRF ----------------------------------------------------
let up = false;
for (let i = 0; i < 30; i++) {
  try {
    if ((await fetch(`${API}/health`)).ok) {
      up = true;
      break;
    }
  } catch {
    /* retry */
  }
  await new Promise((r) => setTimeout(r, 1000));
}
if (!up) {
  console.error(`API never became reachable at ${API}`);
  process.exit(1);
}

// --- sign in ----------------------------------------------------------------
const signIn = await call("POST", "/v1/auth/password", {
  body: { email: EMAIL, password: PASSWORD },
});
if (signIn.status !== 200 || !signIn.body?.accessToken) {
  console.error(`could not sign in (status=${signIn.status}); run with seeded data`);
  process.exit(1);
}
const token = signIn.body.accessToken;

// --- request an upload URL --------------------------------------------------
const fileName = `storage-probe-${Date.now()}.txt`;
const upload = await call("POST", "/v1/messages/upload", {
  token,
  body: { fileName, contentType: "text/plain" },
});
record(
  "upload endpoint returns uploadUrl + filePath + publicUrl",
  upload.status === 200 &&
    typeof upload.body?.uploadUrl === "string" &&
    typeof upload.body?.filePath === "string" &&
    typeof upload.body?.publicUrl === "string",
  `status=${upload.status} body=${JSON.stringify(upload.body)?.slice(0, 200)}`,
);

const { uploadUrl, publicUrl, filePath } = upload.body ?? {};

// The internal service name must never leak into a browser-facing URL.
if (uploadUrl) {
  record(
    "presigned URL is not signed for the internal service name",
    !/\/\/minio:\d+/.test(uploadUrl),
    `url host = ${uploadUrl.split("?")[0].split("/").slice(0, 3).join("/")}`,
  );
}

// --- PUT the bytes ----------------------------------------------------------
const contents = `storage round trip ${new Date().toISOString()}`;
if (uploadUrl) {
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: contents,
  });
  record(
    "presigned PUT succeeds",
    put.status === 200 || put.status === 204,
    `status=${put.status}`,
  );
} else {
  record("presigned PUT succeeds", false, "no uploadUrl");
}

// --- read it back through the public URL ------------------------------------
if (publicUrl) {
  const get = await fetch(publicUrl);
  const text = get.ok ? await get.text() : "";
  record(
    "object is readable through the public URL",
    get.ok && text === contents,
    `status=${get.status}${get.ok ? "" : " (is the bucket anonymously readable?)"}`,
  );
}

// --- cleanup ----------------------------------------------------------------
if (filePath) {
  const del = await call("DELETE", `/v1/messages/upload?filePath=${encodeURIComponent(filePath)}`, {
    token,
  });
  // No delete endpoint is required for the test to be meaningful; record only if one exists.
  if (del.status === 200 || del.status === 204) {
    record("uploaded object can be removed again", true);
  }
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
