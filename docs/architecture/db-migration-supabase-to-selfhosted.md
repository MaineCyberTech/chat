# Migration Plan — Supabase (hosted) → self-hosted Postgres + PostgREST + custom auth

> Companion to [ADR 0002](../adr/0002-postgres-postgrest-custom-auth.md).
> Status: **Draft / planning**. No production cutover without a review of the auth service.

## 1. Goals & non-goals

**Goals**

- Restore a working database for the dev environment (the current project is `NXDOMAIN`).
- Remove the hard dependency on the hosted Supabase platform (data, auth, storage).
- Preserve the existing tenant-isolation model (Postgres RLS keyed on `auth.uid()`).
- Minimise application-code churn: the data layer should not be rewritten.

**Non-goals**

- Replacing Socket.io realtime (already self-hosted).
- Rewriting the 76 migrations.
- Changing the API's public contract consumed by the web app.

## 2. Target architecture

```
Internet → Cloudflare → Caddy (TLS)
                          ├─ /rest/v1/*        → postgrest:3000   (data API, RLS)
                          ├─ /storage/v1/*     → minio:9000       (S3 object storage)
                          ├─ /auth/*, /v1/*    → api:4000         (Express API + custom auth)
                          ├─ /v1/socket.io/*   → api:4000         (WS)
                          └─ everything else   → web:3000         (Next.js)

api / worker ──SQL/REST──→ postgrest:3000 ──→ postgres:5432 (RLS enforced here)
api / worker ──S3 API───→ minio:9000
api ──BullMQ──→ redis:6379
```

| Supabase component        | Replacement                                            | App-code impact                        |
| ------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Hosted Postgres           | `postgres:17` container (+ volume)                     | none (migrations run as-is)            |
| PostgREST (Data API)      | `postgrest/postgrest` container behind `/rest/v1`      | **none** — `supabase.from()` unchanged |
| GoTrue (Auth)             | **Custom auth service** in `apps/api/src/modules/auth` | auth call sites rewritten (web + api)  |
| Storage                   | `minio/minio` (S3)                                     | ~9 call sites rewritten                |
| Realtime                  | n/a (Socket.io)                                        | none                                   |
| Studio / analytics / edge | dropped                                                | none                                   |

## 3. Compatibility strategy (why this is not a rewrite)

### 3.1 Keep the `SUPABASE_*` env contract

`supabase-js` only needs a base URL and a bearer token. Keep the variable names and repurpose
them, so **no data-layer code changes**:

| Variable                    | Old meaning                 | New meaning                                           |
| --------------------------- | --------------------------- | ----------------------------------------------------- |
| `SUPABASE_URL`              | `https://<ref>.supabase.co` | `https://<host>` (proxied to PostgREST at `/rest/v1`) |
| `SUPABASE_ANON_KEY`         | hosted anon key             | **JWT we sign**: `{ role: "anon" }`                   |
| `SUPABASE_SERVICE_ROLE_KEY` | hosted service key          | **JWT we sign**: `{ role: "service_role" }`           |

`getSupabaseForUser(jwt)` ([apps/api/src/lib/supabase.ts](../../apps/api/src/lib/supabase.ts))
already passes the user's JWT via `Authorization`; PostgREST will `SET LOCAL role` from it, so
RLS applies exactly as before.

> Optional, later: rename to `DATA_API_URL` / `ANON_JWT` / `SERVICE_JWT`. Not required for the
> cutover and adds churn, so it is deferred.

### 3.2 Reproduce the `auth` schema in our own Postgres

Migrations do `REFERENCES auth.users(id)`, RLS calls `auth.uid()`, and a signup trigger creates
`public.users`. Provide the minimal surface up front (see §6). This keeps migrations, FKs,
triggers and policies unmodified.

### 3.3 Mint anon/service JWTs; keep RLS untouched

One signing secret (`JWT_SECRET`) signs anon, service_role and user tokens with
`role` + `sub` claims — the contract PostgREST and the policies already expect.

## 4. Workstreams

### WS-A — Database & data API (foundational)

Tasks:

> **Status: implemented AND verified on `remediation/selfhost-db-and-fixes`.**
> Added `supabase/bootstrap/00_auth_shim.sql`, `scripts/db/mint-keys.mjs`,
> `scripts/db/apply-migrations.mjs` and `scripts/db/verify-selfhosted.mjs`;
> `postgres` + `postgrest` services in the devremote/prod compose files with
> `/rest/v1/*` routed to PostgREST in the Caddyfile; `DATABASE_URL` /
> `JWT_SECRET` / `POSTGRES_*` added to the env schema and env examples.
>
> **Verified against a real stack** (postgres:17-alpine + postgrest:12.2.3 via the
> devremote compose file, digest pins resolved and pulled successfully):
>
> | Check                                                         | Result                                |
> | ------------------------------------------------------------- | ------------------------------------- |
> | Bootstrap applies, then all **76 migrations**                 | all `ok`, no errors                   |
> | Seed fixtures (6 files)                                       | all `ok`                              |
> | `supabase/tests/rls_tenant_isolation.sql`                     | **`RLS_TENANT_ISOLATION: PASS`**      |
> | PostgREST + anon JWT → `/workspaces`                          | `200 []` (RLS denies)                 |
> | PostgREST + user JWT → `/workspaces`                          | only that user's workspace            |
> | PostgREST + `service_role` JWT → `/workspaces`                | all 3 (bypasses RLS)                  |
> | `Accept-Profile: auth` (password hashes)                      | **406 PGRST106** — schema not exposed |
> | `scripts/db/verify-selfhosted.mjs` (unmodified `supabase-js`) | **4/4 checks passed**                 |
>
> The `supabase-js` result is the important one: it confirms the "zero
> data-layer code change" claim, since the client, the `/rest/v1` proxying and
> the RLS policies all work together unmodified.
>
> Note: the seed fixtures declare **3** workspaces / 24 channels / 320 messages,
> while `AGENTS.md` claims 15 / 32 / 341. The seeds loaded correctly — that
> documented "expected counts" table is stale.

1. Add `postgres:17` (+ `postgres-data` volume) and `postgrest/postgrest` to
   `infra/docker/docker-compose.devremote.yml` and `.prod.yml`; internal-only ports. **DONE**
2. Add `/rest/v1/*` route to the Caddyfile(s) → `postgrest:3000`. **DONE** — `handle_path`
   strips the prefix, which is exactly the base path supabase-js appends to `SUPABASE_URL`.
3. Bootstrap SQL (§6) applied **before** app migrations. **DONE** — `supabase/bootstrap/00_auth_shim.sql`
4. Migration runner. **DONE** — `scripts/db/apply-migrations.mjs` applies bootstrap, then
   `migrations.list` order, then optional seeds, via `psql`.
   **Correction from the project review:** the root `run_all_migrations.sql` is a stale July
   snapshot predating 66 of the 76 migrations and must **not** be used. The canonical order is
   `supabase/migrations/migrations.list`, which the runner enforces and CI already validates.
5. Seed via `supabase/seeds/*.sql`. **DONE** (`--seed`)
6. JWT minting utility. **DONE** — `scripts/db/mint-keys.mjs` (HS256, self-verifying)

Acceptance: API `/healthz` returns 200 (its check is `select from workspaces`); RLS test
`supabase/tests/rls_tenant_isolation.sql` passes against PostgREST; a request with a user JWT
sees only its tenant's rows.

Effort: **1–2 days**.

### WS-B — Object storage (MinIO)

Tasks:

> **Status: implemented on `remediation/selfhost-db-and-fixes`.**
> `apps/api/src/lib/storage.ts` (presigned PUT/GET, public URL, delete,
> best-effort bucket bootstrap) replaces every `supabase.storage.*` call site in
> `auth/routes.ts` and `messages/routes.ts`; `apps/worker/src/lib/storage.ts`
> reimplements the `expired_uploads` cleanup with `ListObjectsV2` +
> `DeleteObjects` (≤1000 keys per run). Response shapes are unchanged.
> `minio` + one-shot `minio-init` services and a `minio-data` volume are in the
> devremote/prod compose files; `/storage/v1/*` → `minio:9000` in both
> Caddyfiles; `S3_*` is optional in `packages/config/env-schema.ts` (storage
> endpoints return 503 when unset) and documented in the env examples.
>
> **Image note:** upstream MinIO withdrew its images from Docker Hub and Quay
> (Sept 2026), so the compose pin is the community-maintained MinIO fork
> `pgsty/silo:RELEASE.2026-09-16T00-00-00Z` (digest
> `sha256:635197cb9f36d01bee221d34d1c7d7960f6a95c48b0b6c01d99cd13bdae51a46`),
> which keeps the S3 API, `MINIO_*` variables and `mc` tooling.
>
> **Deployment note 1 — public reads:** `minio-init` now runs
> `mc anonymous set download local/chat-uploads`, matching the previous
> `getPublicUrl` behaviour that inline media previews depend on. Tightening this
> would require switching the call sites to presigned GETs.
>
> **Deployment note 2 — presigned URLs need their own host.** SigV4 signs the
> `Host` header and request path, so a URL presigned against the internal
> endpoint (`http://minio:9000`) is unusable from a browser, and a
> prefix-stripping route like `/storage/v1` would invalidate the signature. Added
> `S3_PRESIGN_ENDPOINT` (optional; defaults to `S3_ENDPOINT`) which signs against
> a host that maps 1:1 to MinIO. Wired up end to end:
> `chat-storage.<domain>` Caddy site (dev + prod), the compose default, the env
> examples, and a Cloudflare DNS record in `infra/terraform`.
>
> **Verified against a running stack:** `minio` healthy, `minio-init` exits 0
> with bucket + anonymous-download policy, anonymous GET works container-to-
> container, and `scripts/verify-storage.mjs` passes **4/4** through the real API
> — upload URL issued, **not signed for the internal service name**, presigned
> PUT succeeds, object readable via the public URL.

1. Add `minio/minio` + `minio/mc` (bucket bootstrap) to compose; add `/storage/v1/*` route.
2. Create bucket `chat-uploads` (private), matching current behaviour.
3. Replace Supabase Storage calls:
   - `apps/api/src/modules/auth/routes.ts` (upload, `createSignedUrl`, `getPublicUrl`)
   - `apps/api/src/modules/messages/routes.ts` (upload, `getPublicUrl`)
   - `apps/worker/src/processors/cleanup.ts` (`storage.from(...).remove`)
     Use `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` behind a small
     `lib/storage.ts` adapter so call sites stay one-liner.
4. Decide URL strategy: public read for images vs. always-presigned. Current code uses
   `getPublicUrl` for images and signed URLs for private files — preserve both.

Acceptance: upload → persisted in MinIO; image renders from the returned URL; signed URL expires;
cleanup deletes objects.

Effort: **2–3 days**.

### WS-C - Custom auth service (largest / highest risk)

> **Status: server-side IMPLEMENTED AND VERIFIED; web client + OAuth outstanding.**
>
> Delivered:
>
> - `supabase/bootstrap/10_auth_api.sql` - password hashing (`pgcrypto crypt()`/`bf`,
>   the same primitive GoTrue uses, so **existing bcrypt seed hashes keep working**),
>   magic links, refresh tokens with rotation + replay detection, user lookup.
>   All SECURITY DEFINER, `EXECUTE` revoked from `anon`/`authenticated`, granted to
>   `service_role` only - so the `auth` schema stays unreachable from PostgREST.
> - `apps/api/src/lib/jwt.ts` - dependency-free HS256 sign/verify (no `alg`
>   negotiation, so `alg:none` and algorithm-confusion attacks are impossible).
>   25 unit tests including tampered-payload, wrong-secret, expired, no-`exp` and
>   `alg:none` cases.
> - `apps/api/src/lib/local-auth.ts` - service wrapper over the RPCs.
> - `apps/api/src/modules/auth/local-routes.ts` - `POST /v1/auth/{password,signup,token,signout}`,
>   `POST /v1/auth/magic-link/verify`, and an explicit 501 on `oauth/:provider`.
> - `authenticate.ts` and `lib/socket.ts` now branch on `AUTH_PROVIDER`
>   (`supabase` default / `local`); both paths still end in `getSupabaseForUser(token)`,
>   so RLS applies identically.
> - `scripts/verify-local-auth.mjs` - 17-check end-to-end suite.
>
> Verified against a running API with `AUTH_PROVIDER=local` on the self-hosted
> Postgres/PostgREST stack: **17/17 checks passed** - sign-in, non-enumerating
> failures, access-token auth, anon-token rejection, refresh rotation, replay
> detection revoking the whole family, signup, duplicate rejection, signout, and
> RLS still constraining the user through the API.
>
> **Bug fixed along the way:** the seed bcrypt hash for `password123` was wrong
> (and the "corrected" hash documented in `AGENTS.md` was wrong too - neither
> verified). All 21 seed users were unauthenticable, which also broke the
> `validate.yml` E2E job that signs in as `marcus@seed.test`. Replaced with a
> verified hash.
>
> **Web client: DONE.** `lib/auth/client.ts` now talks to `/v1/auth/*` and
> replaces every `supabase.auth.*` call. Updated: `auth-context.tsx`,
> `lib/api.ts`, `lib/socket.ts`, `/auth/callback`, `/auth/verify`,
> `test-accounts`, admin export. CSRF handling was extracted to `lib/csrf.ts` so
> `api.ts` and the auth client share one implementation. Data access still uses
> the Supabase JS client against PostgREST - unchanged, as designed.
> Note: the web client requires `AUTH_PROVIDER=local`; against a GoTrue
> deployment the endpoints return 501 and the user sees a clear message rather
> than a silent failure.
>
> Still outstanding: **OAuth** (Google/GitHub) returns 501 under local auth, and
> magic-link **delivery** (SMTP from the API) is not wired - issuing and
> consuming links is implemented and tested. See WS-B for object storage.

Tasks:

1. Auth primitives (`apps/api/src/lib/`): `jwt.ts` (jose, HS256/RS256), `password.ts`
   (argon2id), `tokens.ts` (opaque refresh tokens, hashed at rest, rotation + reuse detection).
2. Store: `auth.users`, `auth.identities`, `auth.refresh_tokens`, `auth.magic_links` (§6).
3. Endpoints (new `apps/api/src/modules/auth/`), replacing GoTrue:
   - `POST /v1/auth/signup`
   - `POST /v1/auth/password` (sign-in)
   - `POST /v1/auth/magic-link` (send) + `GET /v1/auth/magic-link/verify?token=…`
   - `POST /v1/auth/token` (refresh, rotation)
   - `POST /v1/auth/signout` (+ revoke all)
   - `GET /v1/auth/oauth/:provider` + `GET /v1/auth/oauth/:provider/callback` (Google, GitHub)
   - `GET /v1/auth/user`, `PATCH /v1/auth/profile`, `POST /v1/auth/resend-verification`
   - `DELETE /v1/auth/account` (GDPR — keep the existing `gdpr_delete_user` RPC)
4. Replace `authenticate.ts` (`supabase.auth.getUser`) with local JWT verification; same for
   `apps/api/src/lib/socket.ts`. **One code path, one source of truth.**
5. Web client: new `apps/web/lib/auth/client.ts` exposing `getSession`, `onAuthStateChange`,
   `signInWithPassword`, `signInWithOtp`, `signUp`, `signInWithOAuth`, `signOut` — same shape as
   the current `auth-context.tsx` usage, so the context is a near drop-in. Store access token in
   memory + refresh token in an httpOnly cookie (preferred) or localStorage.
6. Rewrite `/auth/callback` (currently `exchangeCodeForSession`/`setSession`) to the new
   callback contract; keep `/auth/verify` (resend).

Acceptance: all flows (password, magic link, Google, GitHub, refresh, signout, account delete)
work end-to-end; deactivated/deleted users are rejected; refresh-token rotation detects reuse.

Effort: **5–7 days** (+ review).

### WS-D — Hardening & operations

- Rate limiting on auth endpoints (reuse `apiLimiter`/dedicated limiter), lockout/backoff.
- Email delivery via existing SMTP/Nodemailer config.
- Backups: `pg_dump` cron + retention; document restore. MinIO data backup.
- Postgres tuning for the target host; connection pooling (PgBouncer) if needed.
- Secrets: `JWT_SECRET`, `DATABASE_URL`, `S3_*` added to GitHub secrets + compose.
- Observability: keep `/healthz` DB check; add Postgres/MinIO to Prometheus targets.

Effort: **2–3 days**.

### WS-E — Cutover

- Because everything is env-driven and PostgREST speaks the same protocol, cutover = flip
  `SUPABASE_*` + rebuild the web image (its `NEXT_PUBLIC_*` are baked at build time).
- **`AUTH_PROVIDER=local` and the new web image must ship together.** The web auth client
  calls `/v1/auth/*`; against a GoTrue deployment those endpoints return 501 and sign-in
  fails (with an explicit message rather than a silent no-op). Order: set
  `AUTH_PROVIDER=local` + `JWT_SECRET` on the API, then rebuild and ship the web image.
- Rollback: flipping the API back to `AUTH_PROVIDER=supabase` also requires reverting the
  web image, so keep both artefacts addressable (`:sha` tags) and move them as a pair.
- Keep `SUPABASE_URL` pointing at hosted Supabase as a rollback until the new path is verified.
- Fix the build pipeline first (see §10) — the web image cannot be rebuilt while it is broken.

## 5. Component → file map (data layer: unchanged)

No changes required:

- All `supabase.from(...)` call sites (services, routes, stores).
- `apps/api/src/lib/supabase.ts` (client factory, circuit breaker, per-user client).
- RLS policies, migrations, triggers.

## 6. `auth` schema bootstrap (concrete)

```sql
-- 0. roles PostgREST switches into
do $$ begin create role anon noinherit nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated noinherit nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role noinherit nologin bypassrls; exception when duplicate_object then null; end $$;

-- 1. auth schema
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_id text not null,
  identity_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_id)
);

create table if not exists auth.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  rotated_from uuid references auth.refresh_tokens(id),
  revoked boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists auth.magic_links (
  token_hash text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);

-- 2. PostgREST claim helpers (read what PostgREST sets on the session)
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )
$$;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;
```

Notes:

- Existing signup/`handle_new_user` triggers on `auth.users` keep working because the table still
  exists — only its owner changed.
- `public.users.id REFERENCES auth.users(id)` and all `auth.uid()` policies continue to apply.
- The RLS conformance test already simulates a JWT via `set local request.jwt.claims`, so it
  validates the shim directly.

## 7. Auth service API contract (web-facing)

| Endpoint                                | Replaces                  | Notes                              |
| --------------------------------------- | ------------------------- | ---------------------------------- |
| `POST /v1/auth/signup`                  | `auth.signUp`             | argon2id hash; sends verification  |
| `POST /v1/auth/password`                | `auth.signInWithPassword` | returns access+refresh             |
| `POST /v1/auth/magic-link`              | `auth.signInWithOtp`      | emails a one-time link             |
| `GET /v1/auth/magic-link/verify`        | link in email             | 302 → `/auth/callback?code=…`      |
| `POST /v1/auth/token`                   | `autoRefreshToken`        | refresh rotation + reuse detection |
| `POST /v1/auth/signout`                 | `auth.signOut`            | revokes refresh token(s)           |
| `GET /v1/auth/oauth/:provider`          | `signInWithOAuth`         | 302 to IdP with state+PKCE         |
| `GET /v1/auth/oauth/:provider/callback` | `exchangeCodeForSession`  | upsert `auth.identities`           |
| `GET /v1/auth/user`                     | `auth.getUser`            | profile from `public.users`        |
| `DELETE /v1/auth/account`               | GDPR path                 | calls `gdpr_delete_user`           |

JWT claims: `{ sub, role: "authenticated", email, aud: "authenticated", exp, iat }` signed with
`JWT_SECRET`. Access TTL 1 h (matches `auth.jwt_expiry`), refresh TTL configurable.

## 8. Config / environment changes

Add: `JWT_SECRET`, `DATABASE_URL`, `POSTGREST_URL` (internal), `S3_ENDPOINT`, `S3_REGION`,
`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL`, `AUTH_ACCESS_TTL`, `AUTH_REFRESH_TTL`.

Keep (repurposed): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Extend `packages/config/env-schema.ts` accordingly and document in `docs/environments/env-vars.md`.

## 9. Test plan

- **RLS conformance**: `supabase/tests/rls_tenant_isolation.sql` (unchanged, must pass).
- **Auth unit/integration**: password, magic link, refresh rotation, reuse detection, lockout,
  OAuth callback (mocked IdP), account deletion.
- **Storage**: upload/sign/expire/delete.
- **E2E (Playwright)**: login (password + magic link), send message, upload file, logout.
- **Regression**: existing `apps/api/**/__tests__` mocks of `@supabase/supabase-js` for the data
  layer should remain valid; only auth-specific mocks change.

## 10. Prerequisite: unblock the build pipeline

The dev deploy has failed since **2026-07-21** because `build-push.yml` fails with
`corepack: not found` in the Docker build (`corepack enable && corepack prepare pnpm@9`).
Nothing can be cut over until images build again. Fix options: pin a Node base image that ships
corepack, or install pnpm via `npm i -g pnpm@9` in the builder stage. **Do this first.**

## 11. Risk register

| Risk                                              | Impact | Mitigation                                                                                |
| ------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Auth regressions (we own what GoTrue provided)    | High   | phased rollout, dedicated review, exhaustive auth tests, feature-flag the new auth path   |
| `auth` shim subtly diverges from GoTrue semantics | High   | RLS conformance test + JWT claim assertions; keep `request.jwt.claims` as source of truth |
| Host too small (1 vCPU / 512 MB)                  | High   | upsize to ≥2 vCPU / 4 GB or split DB host before cutover                                  |
| Storage URL semantics differ (public vs signed)   | Medium | mirror current behaviour per call site; integration tests                                 |
| Migration ordering breaks on `auth.users` FK      | Medium | apply bootstrap before app migrations (§6)                                                |
| Backup/PITR gap                                   | Medium | pg_dump cron + documented restore drill                                                   |
| Web `NEXT_PUBLIC_*` baked at build time           | Low    | rebuild image on cutover                                                                  |

## 12. Rollback

The cutover is env-only. Until the old Supabase project is deleted, rollback = point
`SUPABASE_*` (and rebuild web) back at hosted Supabase. Keep the new Postgres/MinIO running in
parallel during verification.

## 13. Effort estimate

| Workstream                | Estimate                  |
| ------------------------- | ------------------------- |
| WS-A Data API + bootstrap | 1–2 d                     |
| WS-B Storage (MinIO)      | 2–3 d                     |
| WS-C Custom auth          | 5–7 d                     |
| WS-D Hardening/ops        | 2–3 d                     |
| WS-E Cutover + build fix  | 1–2 d                     |
| **Total**                 | **~2–3 weeks** (+ review) |

## 14. Open decisions

1. **Auth location** — inside `apps/api` (fewer moving parts) vs a dedicated `apps/auth`
   service. Recommendation: inside `apps/api` initially; extract only if it grows.
2. **Session storage** — httpOnly refresh cookie (recommended, safer) vs localStorage
   (closer to current behaviour).
3. **Host sizing** — upsize the dev droplet vs add a dedicated DB host.
4. **OAuth scope** — keep Google + GitHub only (as today).
5. **Interim recovery** — create a throwaway Supabase project to restore dev _now_ while the
   migration proceeds, or leave dev down until WS-A lands?
