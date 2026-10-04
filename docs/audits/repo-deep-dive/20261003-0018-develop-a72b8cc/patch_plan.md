# Patch Plan

Run: `20261003-0018-develop-a72b8cc` · Target: `C:\temp\chat` @ `a72b8cc` · Profile: base

Ordered, implementation-ready patches. Do not modify application code during this audit; these are the recommended changes.

## P0 — Same day

### PATCH-01 — Remove production RLS weakening (fixes SEC-P0-001, CI-P1-002, DATA-P1-001)
- Files: `.github/workflows/deploy-production.yml`, `.github/workflows/deploy-development.yml`
- Change: delete the "Seed auth users via Management SQL" and the RLS-policy DDL statements (`users_select USING (true)`, `workspace_members_select`, password reset, auth token UPDATEs). Replace with a migration-managed policy.
- Validation: `rg "USING \(true\)|database/query" .github/workflows/deploy-production.yml` returns nothing; `supabase db reset` yields `users_select_own`.

## P1 — This week

### PATCH-02 — Rotate/remove committed credential (SEC-P1-002, SUPPLY-P1-001, INV-P2-002)
- Files: `test-signin.json`, `.gitignore`
- Change: `git rm --cached test-signin.json`; add to `.gitignore`; rotate the password; optionally purge history with `git filter-repo`.
- Validation: `git ls-files | rg test-signin.json` empty; gitleaks passes.

### PATCH-03 — Stop volume pruning (DATA-P1-002, CI-P1-004)
- Files: `deploy-production.yml:287`, `deploy-development.yml:219`
- Change: remove `--volumes` (and prefer `docker image prune`).
- Validation: deploy twice; `docker volume ls` retains `redis-data`.

### PATCH-04 — Scope admin endpoints to caller's workspaces (SEC-P1-003/004/005/006)
- Files: `apps/api/src/modules/admin/routes.ts`, `apps/api/src/modules/import/routes.ts`
- Change: filter `/users`, `/audit-logs`, `/exports`, `/exports/:id/download` by the caller's admin workspace ids; require a workspace for audit logs; make imports platform-admin-only and workspace-scoped.
- Validation: cross-tenant negative tests.

### PATCH-05 — Correct Supabase client selection (ARCH-P1-001/002, FEAT-P1-002, FINAL-P1-001)
- Files: `apps/api/src/modules/webhooks/service.ts`, `apps/api/src/lib/socket.ts`, `apps/api/src/modules/notifications/push-subscription-service.ts`
- Change: use per-user clients (`getSupabaseForUser`) for tenant data; store a client on the socket after handshake; use admin only after authorization.
- Validation: integration test with real RLS; socket join for member vs non-member.

### PATCH-06 — Secure SSH (SEC-P1-007)
- Files: `infra/terraform/variables.tf`, `deploy-production.yml`
- Change: remove the `0.0.0.0/0` default; require operator CIDRs; pass `TF_VAR_ssh_allowed_ips` from secrets.
- Validation: `terraform plan` restricts port 22.

### PATCH-07 — Make quality/security gates blocking (CI-P1-003, TEST-P1-001, FINAL-P2-003)
- Files: `.github/workflows/validate.yml`, `build-push.yml`
- Change: remove `continue-on-error: true` from E2E/Trivy; `pnpm audit` fails on high with an exceptions file; self-provision E2E test user.
- Validation: injected vulnerability/regression fails CI.

## P2 — This month

### PATCH-08 — Restrict `/metrics` and drop tenant labels (API-P1-001, OBS-P2-002)
### PATCH-09 — Durable webhook retries via BullMQ + stable idempotency key (FEAT-P1-002/003)
### PATCH-10 — Execute migration up/down/up in CI (DATA-P2-004, TEST-P2-004, CI-P2-005)
### PATCH-11 — RLS integration test tier (TEST-P2-003)
### PATCH-12 — Alerting + durable log aggregation (OBS-P1-001, OBS-P2-003)
### PATCH-13 — SHA-pin Actions, SBOM for all pushed images (SUPPLY-P2-002/004)
### PATCH-14 — Remove generated artifacts/archives; normalize encoding (INV-P2-001, HYG-P2-001, SUPPLY-P3-005, INV-P3-001)
### PATCH-15 — Cleanup: consolidate `requireAdmin`, duplicate migration, error envelopes, sanitizer (ARCH-P3-005, DATA-P2-003, API-P2-002/004, FEAT-P2-004)

## Validation commands (repo-level, run in a dev environment)

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
pnpm vitest run --config vitest.config.ts --coverage
# RLS/DB (requires local Supabase)
supabase start && supabase db reset
```

## Definition of done

- Zero P0; all P1 either fixed with an artifact or explicitly owner-accepted.
- Deploy pipeline performs no DDL/DML; migrations are the only schema channel.
- Cross-tenant negative tests pass; E2E and security scans gate the build.
