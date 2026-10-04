# 06 — Security, Authorization & Tenancy Audit

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894` (branch `develop`)
- Profile: base
- Auditor: full-domain pilot subagent, security lens (read-only)

## Scope

Secrets/credentials, authz/tenancy (RLS), seed/migration security surface, webhook security, and configuration gaps. This report reconciles the focused security lens run `chat-20261004-0700-develop-0695894` (22 findings) rather than duplicating it.

## Evidence Reviewed

- `.github/workflows/seed-database.yml`
- `supabase/migrations/20260724000006_fix_database_p1_findings.sql`, `supabase/tests/rls_tenant_isolation.sql`
- `apps/api/src/modules/auth/service.ts`, `routes.ts`, validators
- `apps/api/src/modules/webhooks/service.ts`, `packages/config/webhook-utils.ts`
- `infra/docker/docker-compose.prod.yml`, `.env.example`
- Prior focused run: `runs/chat-20261004-0700-develop-0695894/lens_focused_security_supply_chain_ci.md`

## Verification Performed

- Re-read the current `users_select` policy in the latest migration and compared it with the policy created by the seed workflow.
- Confirmed the seed workflow still offers `environment: production` and still writes a shared bcrypt hash.
- Confirmed the webhook delivery path re-validates the URL but follows redirects (`fetch` default).
- Checked production compose env injection for the service-role key and `WEBHOOK_ENCRYPTION_KEY`.
- Verified git ancestry: the merge commits cited by the prior run's `verified-fixed` statuses (`#88`–`#92`) are **not** ancestors of HEAD.

## Executive Summary

At `0695894` the security surface is much improved from the prior base audit, but four findings from the focused lens are still live and reproduced here. The most serious is that the manually dispatchable seed workflow can target production, overwrite the tenant-scoped `users_select` policy with `USING (true)`, and write accounts sharing one known password. Two cross-tenant issues (unscoped auth user directory; admin dead-letter retry IDOR) and two webhook/config gaps also remain.

## Inventory

| Surface | Evidence | Status |
|---|---|---|
| `users` RLS (canonical) | `supabase/migrations/20260724000006_fix_database_p1_findings.sql:131-143` | Tenant-scoped (`auth.uid() = id OR co-member`) |
| Seed workflow RLS override | `.github/workflows/seed-database.yml:82,85` | Regression to `USING (true)` |
| Auth user directory | `apps/api/src/modules/auth/service.ts:44-64` | Service-role, unscoped |
| Webhook URL validation | `packages/config/webhook-utils.ts`, `webhooks/service.ts:227-258` | Scheme/private-IP check; redirects not constrained |
| Prod compose secrets | `infra/docker/docker-compose.prod.yml:3-7,26-32` | Service-role to web; no `WEBHOOK_ENCRYPTION_KEY` |

## Findings

### Finding ID: SEC-P1-001 - Seed workflow can re-open global user RLS (`USING true`) and seed shared-password accounts in production

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `.github/workflows/seed-database.yml:4-13` — `workflow_dispatch` with `environment` choice `development | production`.
  - `.github/workflows/seed-database.yml:85` — `CREATE POLICY users_select ON public.users FOR SELECT TO authenticated USING (true)`.
  - `.github/workflows/seed-database.yml:71` — sets one shared bcrypt hash for all `%@seed.test` users.
  - `supabase/migrations/20260724000006_fix_database_p1_findings.sql:134-143` — current correct policy.
  - `supabase/migrations/20260625000001_create_users.sql:10` — `email TEXT NOT NULL` (PII).
- What is happening: A dispatchable workflow can target production, overwrite the tenant-scoped `users_select` policy with `USING (true)`, and upsert seed accounts with a shared known password.
- Why it matters: Any authenticated user could then read every tenant's user emails via PostgREST; combined with predictable seed credentials this is a tenant-isolation and account-takeover risk.
- User / business impact: Cross-tenant PII exposure; unauthorized access.
- Security / privacy / reliability impact: Critical if exercised against production.
- Recommended fix: Remove the `CREATE POLICY` statements from `seed-database.yml`; rely solely on versioned migrations; forbid production seeding (or gate on a protected environment with required reviewers); never set a shared password hash in CI.
- Suggested validation: `seed-database.yml` contains no `CREATE POLICY`/`encrypted_password` writes; production DB has zero `%@seed.test` accounts.
- Owner suggestion: Security + Release eng
- Effort estimate: S
- Dependencies: FINAL-P1-001, CONF-P3-001
- Status: open
- Endpoint / data path: manual dispatch → Supabase Management API `query` → `public.users` policy + `auth.users` rows
- Attack path: `seed-database` (production) → `users_select USING(true)` → authenticated PostgREST read of all tenant user emails

### Finding ID: SEC-P2-001 - Cross-tenant user directory via auth service (service-role, unscoped)

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/modules/auth/service.ts:44-53` — `searchUsers` uses `getSupabaseAdmin()` and `.ilike("display_name", …)` over the whole `users` table.
  - `apps/api/src/modules/auth/service.ts:55-64` — `getProfiles(userIds)` uses the admin client and `.in("id", …)` for arbitrary IDs.
  - `apps/api/src/modules/auth/routes.ts` exposes both to any authenticated user.
- What is happening: Authenticated users can enumerate/search profiles and fetch arbitrary user IDs across all tenants (projection: `id, display_name, avatar_url`).
- Why it matters: Cross-tenant information disclosure; enables user enumeration for phishing.
- User / business impact: Privacy leak.
- Security / privacy / reliability impact: Medium-high.
- Recommended fix: Scope `searchUsers`/`getProfiles` to the caller's workspace co-members (join `workspace_members`), or use the user-scoped client.
- Suggested validation: A caller outside a workspace cannot resolve its members' profiles.
- Owner suggestion: API/security
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SEC-P2-002 - Webhook SSRF protection does not constrain redirects or DNS rebinding

- Severity: P2
- Confidence: Medium
- Area: SEC
- Evidence:
  - `packages/config/webhook-utils.ts` — validates scheme + resolved IPv4 against private ranges.
  - `apps/api/src/modules/webhooks/service.ts:245-253` — `fetch(endpoint.url, …)` follows redirects by default and re-resolves DNS at request time.
- What is happening: A validated public URL can redirect or re-resolve to an internal address at delivery time.
- Why it matters: SSRF from the API/worker network into internal services or cloud metadata endpoints.
- User / business impact: Internal exposure.
- Security / privacy / reliability impact: Medium-high.
- Recommended fix: Use `redirect: "manual"` (reject 3xx), pin the validated IP for the connection, and re-validate on every attempt.
- Suggested validation: A webhook URL that 302s to `127.0.0.1` is rejected.
- Owner suggestion: Security/API
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SEC-P2-003 - `WEBHOOK_ENCRYPTION_KEY` not passed by production compose and not in `.env.example`

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `infra/docker/docker-compose.prod.yml:117-124` — API env has no `WEBHOOK_ENCRYPTION_KEY`.
  - `docs/environments/env-vars.md` documents the omission; `apps/api/src/modules/webhooks/service.ts` throws when it is unset.
- What is happening: Documented configuration gap; if operators do not add the key out of band, webhook create/update/delivery throws.
- Why it matters: Broken webhook feature in production, or an incentive to use a weak/rotating-unaware key.
- User / business impact: Integrations silently break.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Add `WEBHOOK_ENCRYPTION_KEY` to `docker-compose.prod.yml`, root `.env.example`, and the rotation guide.
- Suggested validation: Production compose and `.env.example` both define the key.
- Owner suggestion: Security/Ops
- Effort estimate: S
- Dependencies: None
- Status: open

## Risks

- Production PII exposure if the seed workflow is run against production.
- Cross-tenant enumeration and IDOR.
- SSRF from backend network.

## Recommendations

1. Delete RLS/credential writes from `seed-database.yml`; block production seeding.
2. Scope the auth directory to workspace co-members.
3. Constrain webhook redirects and pin validated IPs.
4. Add `WEBHOOK_ENCRYPTION_KEY` to prod config.

## Quick Wins

- Remove the `CREATE POLICY` lines from the seed workflow.

## Hardening Backlog

- An abuse-case test suite that asserts cross-tenant reads fail.

## Suggested Tests

- Cross-tenant profile lookup fails.
- Seed workflow static test: no `CREATE POLICY`/`encrypted_password`.

## Suggested Documentation Updates

- Webhook security model (redirect/IP pinning).

## Open Questions

- Has the seed workflow already been run against production at any point? Runtime policy state is Unknown — verify in the hosted project.

## Appendix

- The focused lens found no P0. This full pass likewise found no P0 at `0695894`.
