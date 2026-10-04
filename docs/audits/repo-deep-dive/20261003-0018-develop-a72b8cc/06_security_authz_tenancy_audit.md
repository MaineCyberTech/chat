# 06 — Security / AuthZ / Tenancy Audit

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Authentication, authorization middleware, RLS policies, tenant isolation, admin surface, secret handling, injection, CSRF, transport, and real-time authz.

## Evidence Reviewed

- `apps/api/src/middleware/authenticate.ts`, `require-admin.ts`, `require-membership.ts`, `require-permission.ts`, `csrf.ts`, `security-headers.ts`, `rate-limit.ts`
- `apps/api/src/modules/admin/routes.ts`, `export/routes.ts`, `import/routes.ts`, `auth/routes.ts`, `webhooks/routes.ts`
- `apps/api/src/lib/supabase.ts`, `lib/socket.ts`
- `supabase/policies/*`, `supabase/migrations/20260626000022_apply_rls_policies.sql`, `20260627000008_simplify_rls_policies.sql`
- `.github/workflows/deploy-production.yml`, `deploy-development.yml`
- `infra/terraform/variables.tf`
- `test-signin.json`

## Verification Performed

- Walked each admin endpoint's authorization and compared the resulting query scope to the caller's memberships.
- Confirmed RLS policy roles (`TO authenticated`) against the client role used by each service.
- Inspected the production deploy workflow for schema/policy mutations.
- Checked Terraform firewall defaults.
- Attempted to reproduce the reported "0 P0/P1" by walking the admin and deploy paths (unsupported; see findings).

## Executive Summary

This is the most serious area. The system has strong-looking middleware and RLS, but tenant isolation is broken in the admin/export surface, and the production deploy pipeline actively weakens RLS by creating `users_select USING (true)`. A tracked credential file and an open SSH default compound the risk. Verdict for this domain: **not production-safe** until the P0/P1 items are fixed.

## Inventory

| Control | Status | Evidence |
|---|---|---|
| Auth middleware (Bearer + Supabase `getUser`) | Present | `middleware/authenticate.ts:17-44` |
| Per-user RLS client | Present | `lib/supabase.ts:180-191` |
| Workspace membership checks | Present | `require-membership.ts` |
| Admin checks | Present, duplicated/tenant-wide | `require-admin.ts`, `admin/routes.ts:14-37` |
| CSRF double-submit | Present with caveats | `middleware/csrf.ts` |
| Security headers/helmet | Present | `app.ts:80-81`, `security-headers.ts` |
| RLS policies | Extensive | `supabase/policies/*` |
| Deploy mutates RLS | Yes (bad) | `deploy-production.yml:340-347` |

## Findings

### Finding ID: SEC-P0-001 - Production deploy creates `users_select USING (true)`, exposing all users' PII to any authenticated user

- Severity: P0
- Confidence: High
- Area: SEC
- Evidence:
  - `.github/workflows/deploy-production.yml:345-347` — `DROP POLICY IF EXISTS users_select_own ON public.users; … CREATE POLICY users_select ON public.users FOR SELECT TO authenticated USING (true)`
  - `.github/workflows/deploy-development.yml:323-326` — same mutation for dev
  - `supabase/migrations/20260626000022_apply_rls_policies.sql:6-7` — original least-privilege `users_select_own using (auth.uid() = id)`
  - `apps/api/src/lib/supabase.ts:180-191` — per-user clients carry the JWT, so `authenticated` role applies to any logged-in user
- What is happening: On every push to `main`, the deploy job runs raw SQL against the hosted Supabase project that drops the least-privilege policy and replaces it with a blanket `USING (true)` for `authenticated`. Every logged-in user can then `select` every row in `public.users` (including `email`).
- Why it matters: this is a live, automatically-applied RLS bypass on the production database; it directly contradicts the migration-defined policy and is applied outside migration version control.
- User / business impact: cross-tenant PII disclosure (emails, display names, ids); GDPR/CCPA exposure.
- Security / privacy / reliability impact: critical. Combined with the `users` table join used by member queries, it undermines tenant isolation platform-wide.
- Recommended fix: remove the DDL from deploy workflows entirely; manage all policies via migrations. If a broader user directory is required, expose a dedicated minimized view/RPC (`id, display_name, avatar_url` only).
- Suggested validation: applying migrations alone must yield `users_select_own`; run a SQL assertion that a user cannot read another user's row.
- Owner suggestion: Security + Release engineering
- Effort estimate: S
- Dependencies: None
- Status: open
- Endpoint / data path: `GET /rest/v1/users?select=*` as any authenticated user → PostgREST (RLS `USING(true)`) → all `public.users`
- Attack path: any valid account → PostgREST with anon key + own JWT → enumerate emails → phishing/targeted attacks.

### Finding ID: SEC-P1-002 - Tracked credential file `test-signin.json`

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `test-signin.json` — tracked, contains an email + plaintext password (values redacted)
  - `git ls-files` confirms it is versioned; `.gitignore` does not cover it
- What is happening: A real-looking credential is committed to the repository.
- Why it matters: anyone with repo read access (or history) obtains a working credential if reused.
- User / business impact: account takeover; credential rotation.
- Security / privacy / reliability impact: high.
- Recommended fix: remove from git history/working tree, rotate, gitignore, and source from CI secrets.
- Suggested validation: `git log --all -- test-signin.json` shows removal; secret scanning passes.
- Owner suggestion: Security
- Effort estimate: S
- Dependencies: TEST-P1-001
- Status: open

### Finding ID: SEC-P1-003 - Admin `/v1/admin/users` returns all platform users (including email) to any workspace admin

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/modules/admin/routes.ts:87-105` — `requireAdmin` only requires owner/admin of *some* workspace, then `admin.from("users").select("*")` with no `.in(id, tenantUserIds)` scope
  - `apps/api/src/modules/export/routes.ts:68-103` — the export equivalent IS scoped to workspace members, proving the intended behavior
- What is happening: Unlike the CSV export, the admin users list is global.
- Why it matters: any workspace owner/admin can enumerate every user on the platform, including email.
- User / business impact: PII disclosure across tenants.
- Security / privacy / reliability impact: high.
- Recommended fix: scope `/admin/users` to users who are members of the admin's workspaces (mirror `export/users`), or gate behind a true platform-admin role.
- Suggested validation: two-workspace test; admin of A cannot see users only in B.
- Owner suggestion: API/Admin
- Effort estimate: S
- Dependencies: None
- Status: open
- Endpoint / data path: `GET /v1/admin/users` → `getSupabaseAdmin()` → `public.users` (unscoped)

### Finding ID: SEC-P1-004 - Admin `/v1/admin/audit-logs` leaks other tenants' logs when `workspaceId` omitted

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/modules/admin/routes.ts:442-477` — workspace scoping applied only `if (workspaceId)`; otherwise the query returns all rows
  - `supabase/migrations/20260626000022_apply_rls_policies.sql:161-171` — RLS restricts audit logs to actor or workspace admin, but the admin client bypasses RLS
- What is happening: Omitting the `workspaceId` query param returns the entire platform audit log.
- Why it matters: audit logs contain actor ids, actions, and metadata across tenants.
- User / business impact: cross-tenant intelligence leak.
- Security / privacy / reliability impact: high.
- Recommended fix: require `workspaceId` and verify membership, or always filter by the caller's admin workspace ids.
- Suggested validation: request without param is rejected; with another tenant's id is 403.
- Owner suggestion: API/Admin
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SEC-P1-005 - Admin compliance exports are not tenant-scoped on list/download

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/modules/admin/routes.ts:597-611` — `/exports` selects all `compliance_exports` (no workspace filter)
  - `apps/api/src/modules/admin/routes.ts:614-643` — `/exports/:id/download` fetches any export by id and streams `csv_content`
  - The create path `/export/compliance` (lines 479-595) DOES call `verifyWorkspaceMembership`
- What is happening: creation is scoped but enumeration/download is not; any workspace admin can download another workspace's compliance export by id (ids may be guessable UUIDs but listing hands them out).
- Why it matters: bulk data exfiltration across tenants.
- User / business impact: severe privacy breach.
- Security / privacy / reliability impact: high.
- Recommended fix: store `workspace_id` on exports and filter both list and download by the caller's admin workspace ids.
- Suggested validation: admin of A cannot list or download B's export (403/empty).
- Owner suggestion: API/Admin
- Effort estimate: S
- Dependencies: None
- Status: open
- Endpoint / data path: `GET /v1/admin/exports` → `getSupabaseAdmin()` → `compliance_exports` (unscoped)

### Finding ID: SEC-P1-006 - Bulk import endpoints operate globally with only "admin of anything" authorization

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/modules/import/routes.ts:17-47` — `requireAdmin()` (no workspace param) then `admin.from("workspaces").insert(...)`
  - `apps/api/src/modules/import/routes.ts:49-82` — inserts arbitrary `public.users` rows
- What is happening: Any workspace owner/admin can create global workspaces and user records.
- Why it matters: data poisoning and cross-tenant object creation.
- User / business impact: corrupt directory, orphaned tenants.
- Security / privacy / reliability impact: high.
- Recommended fix: require a platform-admin role and scope imports to the caller's workspace; do not let callers insert arbitrary `users`.
- Suggested validation: non-platform-admin receives 403 for import.
- Owner suggestion: API/Admin
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: SEC-P1-007 - SSH is open to the internet by default

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `infra/terraform/variables.tf:63-66` — `ssh_allowed_ips` default `"0.0.0.0/0"`
  - `infra/terraform/main.tf:37-41` — firewall port 22 uses `split(",", var.ssh_allowed_ips)`
  - Commit `a72b8cc` — "remove TF_VAR_ssh_allowed_ips from infra workflow — uses terraform variable default" (i.e., no override is passed)
- What is happening: Production firewall allows SSH from any source address.
- Why it matters: exposes the root login surface to the whole internet; brute-force/credential attacks.
- User / business impact: host compromise risk.
- Security / privacy / reliability impact: high.
- Recommended fix: require `ssh_allowed_ips` (no default) or default to a safe operator range; pass it from CI secrets.
- Suggested validation: `terraform plan` shows port 22 restricted; external nmap shows filtered.
- Owner suggestion: Infra
- Effort estimate: S
- Dependencies: None
- Status: open
- Attack path: internet → TCP/22 on droplet → SSH auth (key/passphrase) → host compromise → secrets in `/opt/chat/infra/docker/.env`.

### Finding ID: SEC-P1-008 - Webhook secrets are optional and signature can be omitted

- Severity: P1
- Confidence: Medium
- Area: SEC
- Evidence:
  - `apps/api/src/modules/webhooks/service.ts:55-66` — `validateSecret` returns `{valid:true}` for empty/undefined secrets
  - `apps/api/src/modules/webhooks/service.ts:212-216` — `X-Webhook-Signature` only added `if (endpoint.secret)`
  - `apps/api/src/modules/webhooks/routes.ts:44,50` — `secret` optional on create/update
- What is happening: Endpoints may be created without a signing secret; deliveries then have no authenticity guarantee.
- Why it matters: receivers cannot authenticate the sender; SSRF/replay defenses rely only on network controls.
- User / business impact: spoofable integration events.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: require a strong secret (≥16 chars, ideally generated) for every endpoint; reject unsigned configs.
- Suggested validation: create without secret returns 400.
- Owner suggestion: Integrations
- Effort estimate: S
- Dependencies: ARCH-P1-001
- Status: open

### Finding ID: SEC-P2-009 - `timingSafeEqual` can throw on length mismatch (unhandled 500) in CSRF middleware

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/middleware/csrf.ts:96-107` — compares `cookieToken`/`headerToken` with `timingSafeEqual` without length check
  - `apps/api/src/middleware/csrf.ts:50` — same for `csrfProtection`
- What is happening: Node's `timingSafeEqual` throws `RangeError` when buffer lengths differ. A crafted mismatched header produces an unhandled exception → 500 and log noise.
- Why it matters: avoidable error path; denial-of-service/noise; obscures real issues.
- User / business impact: low.
- Security / privacy / reliability impact: low-medium.
- Recommended fix: compare lengths first and return 403; use constant-time compare only on equal-length inputs.
- Suggested validation: send a 1-byte `x-csrf-token` and assert 403 (not 500).
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SEC-P2-010 - Socket typing/leave events can be sent to arbitrary channel rooms

- Severity: P2
- Confidence: Medium
- Area: SEC
- Evidence:
  - `apps/api/src/lib/socket.ts:214-222` — `channel:leave` has no membership check
  - `apps/api/src/lib/socket.ts:253-259` — `typing:start`/`typing:stop` broadcast with no membership/room check
- What is happening: A connected user can emit typing/leave for any `channelId`; `socket.to(room)` delivers to that room regardless of the sender's membership.
- Why it matters: low-grade spam/ghost-typing across tenants; minor info leak (room activity).
- User / business impact: nuisance/abuse.
- Security / privacy / reliability impact: low-medium.
- Recommended fix: validate membership (using a user-scoped client) and ensure `socket.rooms.has(channel:${id})` before broadcasting.
- Suggested validation: non-member typing to a foreign channel produces no broadcast.
- Owner suggestion: Real-time
- Effort estimate: S
- Dependencies: ARCH-P1-002
- Status: open

## Risks

- Tenant isolation defeats in admin surface; automated production RLS weakening; exposed SSH and credential.

## Recommendations

1. Immediately stop deploy-time DDL; repair `users_select` via migration.
2. Scope all admin queries to the caller's admin workspaces.
3. Remove/rotate the tracked credential.
4. Restrict SSH.

## Quick Wins

- Delete the RLS mutation block from both deploy workflows.
- Add `.in("id", tenantUserIds)` to admin users query.

## Hardening Backlog

- Platform-admin role; RLS regression tests; secret scanning in CI.

## Suggested Tests

- Cross-tenant negative tests for every `/admin` and `/export` route.
- RLS assertion suite run against a local Supabase.

## Suggested Documentation Updates

- Security model doc describing intended admin scope.

## Open Questions

- Are there other deploy-time SQL mutations beyond the two RLS policies (NULL tokens, identities, password)? Yes — see DATA-P1-001.

## Appendix

- Role hierarchy: `member < admin < owner` (`require-membership.ts:61`).
