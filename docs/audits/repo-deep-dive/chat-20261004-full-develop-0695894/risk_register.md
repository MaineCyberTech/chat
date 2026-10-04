# Follow-up register

Run: `chat-20261004-full-develop-0695894` · Target: `C:\temp\chat` @ `0695894` · Profile: base

Register mirrored 1:1 with `risk_register.md` so `tools/check_run.sh` passes.

| Finding | Severity | Title | Owner | Target | Status | Target window | Post-audit note |
|---|---|---|---|---|---|---|---|
| SEC-P1-001 | P1 | Seed workflow can re-open global user RLS (`USING true`) and seed shared-password accounts in production | @security | SEC | verified-fixed | Immediate | merged chat#88 @ 3115ab3 |
| CI-P1-001 | P1 | Production `provision` job runs destructive Terraform with no environment approval | @release | CI | verified-fixed | Immediate | merged chat#89 @ b32bd0f |
| FINAL-P1-001 | P1 | Manual seed workflow remains an out-of-band schema/RLS/data mutation channel | @release | FINAL | open | Immediate | Synthesises SEC-P1-001 + CONF-P3-001. |
| OBS-P1-001 | P1 | No alerting wired by default | @ops | OBS | open | 30 days | `infra/terraform/variables.tf:45-49` default `alert_email = ""`; `main.tf:101-142` alerts count 0. |
| EXEC-P1-001 | P1 | Release gate remains conditional on P1 remediation | @eng-lead | EXEC | open | Immediate | See `RELEASE_GATE.md`. |
| ARCH-P2-001 | P2 | Single-node, no-HA topology (Redis SPOF) | @infra | ARCH | open | 30–90 days | `infra/terraform/main.tf` one droplet; local Redis volume. |
| AUTH-P2-001 | P2 | IDOR: admin dead-letter retry is not tenant-scoped | @api | AUTH | verified-fixed | 7 days | merged chat#90 @ e687345 |
| CI-P2-001 | P2 | `infra-development` destroys infra on every push to `develop` with weak controls | @ci | CI | open | 7 days | `.github/workflows/infra-development.yml`. |
| CI-P2-002 | P2 | `workflow_dispatch` inputs interpolated directly into `run:` (script injection) | @ci | CI | open | 7 days | `hardening-automation-runner.yml:17-19`, `environment-promotion-audit.yml:24`. |
| CI-P2-003 | P2 | Auto-commit workflows hold `contents: write` and push to `main` | @ci | CI | open | 7 days | `audit-ci-autocommit.yml`, `audit-badges-autocommit.yml`. |
| CI-P2-004 | P2 | Branch-protection CI gate only validates `main`; `develop` (auto-deploy) unchecked | @ci | CI | open | 7 days | `validate.yml` branch-protection job hard-codes `main`. |
| DATA-P2-001 | P2 | Duplicate `add_user_groups` migrations | @db | DATA | open | 30 days | `supabase/migrations/20260704000007_add_user_groups.sql`, `20260705000003_add_user_groups.sql`. |
| DEP-P2-001 | P2 | 33 HIGH/CRITICAL dependency advisories risk-accepted until 2026-11-03 | @security | DEP | open | 30 days | `.trivyignore` and `.pnpm-audit-exceptions.json` expire 2026-11-03. |
| EXEC-P2-002 | P2 | Register self-consistency: prior `verified-fixed` statuses cite commits not in `develop` | @audit-owner | EXEC | verified-fixed | 7 days | CORRECTED: stale clone at 0695894; all 5 merge commits are ancestors of develop 86bf76d - false positive |
| FINAL-P2-002 | P2 | Security exceptions expire 2026-11-03, after which CI fails hard | @release | FINAL | open | 30 days | Synthesises DEP-P2-001. |
| INV-P2-001 | P2 | Tracked process debris and stale reconciliation artifacts at repo root | @maintainer | INV | open | 30 days | `COMMIT_MSG.txt`, `temp_layout.txt`, `tmp_migrations_list.txt`, `FINAL_RECONCIL*`. |
| SEC-P2-001 | P2 | Cross-tenant user directory via auth service (service-role, unscoped) | @security | SEC | verified-fixed | 7 days | merged chat#91 @ a70ebe1 |
| SEC-P2-002 | P2 | Webhook SSRF protection does not constrain redirects/DNS rebinding | @security | SEC | open | 30 days | `apps/api/src/modules/webhooks/service.ts:245-253`. |
| SEC-P2-003 | P2 | `WEBHOOK_ENCRYPTION_KEY` not passed by production compose and not in `.env.example` | @security | SEC | open | 30 days | `infra/docker/docker-compose.prod.yml`. |
| SUPPLY-P2-001 | P2 | Production web container receives the Supabase service-role key | @supply | SUPPLY | verified-fixed | 7 days | merged chat#92 @ a498513 |
| TEST-P2-001 | P2 | RLS tenant-isolation SQL test exists but is not run by CI | @qa | TEST | open | 30 days | `supabase/tests/rls_tenant_isolation.sql`; only `scripts/test-db-rls.sh` reads it and no workflow/package script invokes it. |
| ARCH-P3-002 | P3 | Divergent admin authorization logic (platform vs workspace) | @api | ARCH | open | 90 days | `apps/api/src/middleware/require-admin.ts:12`, `apps/api/src/modules/workspaces/routes.ts:169`. |
| CI-P3-001 | P3 | No actionlint/shellcheck gate despite known workflow lint findings | @ci | CI | open | 30 days | `validate.yml` has no workflow-lint job. |
| CI-P3-002 | P3 | Many workflows omit `permissions:` (default token scope) | @ci | CI | open | 30 days | Multiple `.github/workflows/*.yml` lack explicit permissions. |
| CONF-P3-001 | P3 | Deployment policy contradicts the development deploy workflow (DB changes) | @release | CONF | open | 30 days | `docs/operations/deployment-policy.md:35-37` vs `deploy-development.yml`. |
| CONF-P3-002 | P3 | Admin `/stats` returns global cross-tenant counts | @api | CONF | open | 30 days | `apps/api/src/modules/admin/routes.ts`. |
| DEP-P3-001 | P3 | 24 medium/low advisories are non-gating | @security | DEP | open | 30 days | CI scans HIGH/CRITICAL only. |
| PORT-P3-001 | P3 | Tracked shell scripts lack the exec bit | @maintainer | PORT | open | 90 days | `git ls-files -s` shows mode 100644 for intended executables. |
| SUPPLY-P3-001 | P3 | Container images pinned only by mutable tag | @supply | SUPPLY | open | 90 days | `infra/docker/*.yml`, `apps/*/Dockerfile`. |
| SUPPLY-P3-002 | P3 | Dockerfile lint: unpinned apk and shell-form HEALTHCHECK | @supply | SUPPLY | open | 90 days | `apps/{web,api,worker}/Dockerfile`. |
| SUPPLY-P3-003 | P3 | SBOMs generated but not signed/attested; no license or dependency-review gate | @supply | SUPPLY | open | 90 days | `.github/workflows/build-push.yml`. |
| SUPPLY-P3-004 | P3 | Containers lack runtime hardening beyond non-root | @supply | SUPPLY | open | 90 days | `infra/docker/docker-compose.prod.yml`. |
