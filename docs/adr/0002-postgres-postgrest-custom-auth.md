# 0002 — Self-hosted Postgres + PostgREST with custom auth

- **Status**: Accepted — implementation in progress
- **Date**: 2026-10-15
- **Supersedes**: [0001 — Use Supabase Auth + RLS for authentication and tenant isolation](./0001-supabase-auth-rls.md) (partially — the RLS + tenant-isolation strategy is retained; the managed Supabase _platform_ dependency is removed)

## Context

ADR-0001 chose Supabase Auth (GoTrue) + Supabase-hosted Postgres + RLS to minimise custom
auth code. The platform is now used as a _platform_, not just a database:

- **Data access** — every query goes through `supabase.from(...)` (PostgREST), across ~27 files.
- **Auth** — GoTrue: magic link, password, Google/GitHub OAuth, `getUser()` JWT verification,
  session refresh (`authenticate.ts`, `lib/socket.ts`, web `auth-context.tsx`).
- **Storage** — `storage.from("chat-uploads")` uploads, signed URLs (`auth/routes.ts`,
  `messages/routes.ts`, worker `cleanup.ts`).
- **Tenant isolation** — RLS policies keyed on `auth.uid()` from the GoTrue JWT, plus
  `public.users.id REFERENCES auth.users(id)`; 76 migrations, 11 policy files.
- **Realtime** — _not_ used (Socket.io instead). One fewer thing to replace.

Two forcing functions drive this re-evaluation:

1. **Vendor dependency became an incident.** The project the environments point at
   (`qzjajxtoxsurkrcvrchh.supabase.co`) is now `NXDOMAIN` globally — the hosted project no
   longer exists. The API readiness probe (`/healthz`) fails its database check and file
   uploads/login are dead until a replacement DB exists.
2. **Ownership/portability.** The operator wants the database and auth to run on infrastructure
   they control, without a from-scratch rewrite of the data layer.

## Decision

Run **self-hosted PostgreSQL with PostgREST**, keep **RLS as the tenant-isolation mechanism**,
and replace the GoTrue/Storage parts of the Supabase platform with **our own auth service** and
**S3-compatible object storage (MinIO)**.

Key properties that keep the change small:

- **PostgREST is the same data API the SDK already speaks.** `supabase-js` builds
  `POST/GET/PATCH/DELETE {base}/rest/v1/{table}` with a bearer JWT; PostgREST serves exactly
  that. Routing `/rest/v1/*` to PostgREST means the data layer changes **zero application
  code**.
- **We mint our own JWTs and keep the `SUPABASE_*` env contract.** `SUPABASE_URL` becomes our
  PostgREST base URL; `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` become JWTs we sign with
  `role: anon` / `role: service_role`. `getSupabaseForUser(jwt)` (per-request user client) is
  unchanged, so RLS keeps working untouched.
- **We own the `auth` schema instead of GoTrue.** Provide the minimal `auth` schema
  (`auth.users`, `auth.identities`, `auth.refresh_tokens`, and `auth.uid()/role()/jwt()`
  helpers) plus the `anon`/`authenticated`/`service_role` roles. Existing migrations, FKs
  (`REFERENCES auth.users`), triggers and RLS policies then apply unmodified.

## Alternatives Considered

| Option                                                                        | Rejected because                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Self-host the whole Supabase stack (GoTrue/PostgREST/Storage/Kong/Studio)** | Keeps the vendor's code but not the vendor's support/upgrades; heavier footprint than we need; still a multi-container platform to operate.                                           |
| **Plain Postgres + rewrite the data layer (pg/Drizzle/Kysely)**               | Highest risk: rewrites ~27 files and every service, and re-implements RLS in app code. Touches all "do-not-break" guardrails.                                                         |
| **New hosted Supabase project**                                               | Fastest recovery, but keeps the exact dependency that just failed, and does not satisfy the ownership goal. Kept only as an interim stop-gap.                                         |
| **Keycloak / Auth.js / Passport as the auth service**                         | Viable, but each still needs adapter code for the RLS JWT contract and storage; evaluated as an implementation detail of the custom auth service rather than a whole-platform choice. |

## Consequences

### Positive

- No application-code change to the data layer; RLS policies and migrations are preserved.
- Database, auth and file storage run entirely on owned infrastructure; no external DNS/API
  dependency for core function.
- `auth.uid()`/`auth.role()`/`auth.jwt()` semantics are reproduced exactly, so the existing
  RLS test suite (`supabase/tests/rls_tenant_isolation.sql`) becomes the conformance test.

### Negative / risks

- **We now own the security-critical auth surface** that ADR-0001 deliberately avoided:
  password hashing, token issuance/rotation/revocation, magic-link verification, email
  verification, OAuth state/PKCE, brute-force protection, session revocation, account deletion.
  This must be built to a high standard and reviewed.
- **Operational footprint grows**: Postgres + PostgREST + MinIO (plus existing Redis, LiveKit,
  app containers). The current dev droplet (**1 vCPU / ~512 MB RAM / 8.7 GB disk**) cannot host
  this comfortably; a larger host (≥ 2 vCPU / 4 GB) or a separate database host is required.
- **Backups, upgrades, PITR, and connection pooling** become our responsibility.
- The web image bakes `NEXT_PUBLIC_*` at build time, so cutover requires an image rebuild.

## Follow-up

Execution is tracked in [docs/architecture/db-migration-supabase-to-selfhosted.md](../architecture/db-migration-supabase-to-selfhosted.md).
