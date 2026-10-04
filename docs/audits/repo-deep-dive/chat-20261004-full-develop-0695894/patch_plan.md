# Patch Plan

Run `chat-20261004-full-develop-0695894` · Target `chat` @ `0695894`.

| Patch | Findings | Change | Effort |
|---|---|---|---|
| PATCH-01 | SEC-P1-001, FINAL-P1-001 | `.github/workflows/seed-database.yml`: delete the `CREATE POLICY users_select … USING (true)` (line 85) and `UPDATE auth.users SET encrypted_password …` (line 71); remove the `production` choice. | S |
| PATCH-02 | CI-P1-001 | `.github/workflows/deploy-production.yml`: add `environment: production` (required reviewers) to `provision` and `build-images`; run `plan` then approval then `apply`; drop `id-token: write`. | S |
| PATCH-03 | CI-P2-001 | `.github/workflows/infra-development.yml`: add `permissions: contents: read`, protected `development` environment, pinned `known_hosts`; split plan/apply. | S |
| PATCH-04 | CI-P2-002 | Dispatch workflows: pass `inputs.*` via `env:` and reference quoted shell vars; validate with a regex. | S |
| PATCH-05 | CI-P2-003 | Auto-commit workflows: `contents: read` + open a PR; never `[skip ci]` on generated changes. | M |
| PATCH-06 | CI-P2-004 | Branch-protection job: validate `main`, `develop`, `release/**`; declare explicit `permissions:`. | S |
| PATCH-07 | AUTH-P2-001 | `apps/api/src/modules/admin/routes.ts`: resolve the dead letter's workspace and check it against `adminWorkspaceIds`. | S |
| PATCH-08 | SEC-P2-001 | `apps/api/src/modules/auth/service.ts`: scope `searchUsers`/`getProfiles` to workspace co-members. | S |
| PATCH-09 | SEC-P2-002 | `apps/api/src/modules/webhooks/service.ts`: `redirect: "manual"` + pinned validated IP. | S |
| PATCH-10 | SEC-P2-003 | Add `WEBHOOK_ENCRYPTION_KEY` to `docker-compose.prod.yml` and `.env.example`. | S |
| PATCH-11 | SUPPLY-P2-001 | Move `SUPABASE_SERVICE_ROLE_KEY` out of `x-common-env` in `docker-compose.prod.yml`. | S |
| PATCH-12 | TEST-P2-001 | Add a CI step running `scripts/test-db-rls.sh` after `supabase db reset`. | S |
| PATCH-13 | DEP-P2-001, DEP-P3-001 | Land dependency upgrades before 2026-11-03; shrink allowlists. | M |
| PATCH-14 | OBS-P1-001 | Set `alert_email`; add alert rules for 5xx, queue backlog, circuit breakers, health. | M |
| PATCH-15 | DATA-P2-001, CONF-P3-001, CONF-P3-002, INV-P2-001, PORT-P3-001, ARCH-P3-002 | Hygiene/governance cleanup. | S–M |
| PATCH-16 | SUPPLY-P3-001..004 | Digest pins, SBOM signing, container hardening. | M |

## Sequencing

1. PATCH-01, PATCH-02 (unblock the gate).
2. PATCH-07..PATCH-11 (tenant/supply correctness).
3. PATCH-12, PATCH-14, PATCH-13.
4. PATCH-03..PATCH-06, PATCH-15, PATCH-16.
