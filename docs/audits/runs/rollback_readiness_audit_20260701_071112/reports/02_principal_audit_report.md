# Principal Audit Report

- Prompt: **rollback_readiness_audit**
- Domain: **release**
- Run ID: **rollback_readiness_audit_20260701_071112**
- Generated: **2026-07-01T07:11:05Z**
- Decision: **NO-GO**
- P0: **3**, P1: **4**
- P2: **3**, P3: **2**
- Readiness: **33.00**

## Findings

### P0 — Production deploy runs docker system prune -af --volumes and docker image prune -af before health check succeeds

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** artifact_rollback
- **Impact:** Previous SHA-tagged images (needed for rollback) are destroyed before the current deploy is verified. If deploy fails, there is nothing to roll back to.
- **Fix:** Move docker prune steps to AFTER successful health check; or use timestamp-based pruning that preserves at least the previous release's SHA images

### P0 — Rollback job has needs: build-images — triggers unnecessary image build before rollback can execute

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** artifact_rollback
- **Impact:** Rollback delayed by 20+ minutes (unnecessary image build) while production is degraded
- **Fix:** Change rollback job needs to [provision] only — rollback pulls existing SHA images without building new ones

### P0 — Production version badge build-args (NEXT_PUBLIC_APP_VERSION, NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_BUILD_TIME) not passed

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** post_rollback_validation
- **Impact:** Production always shows 'v0.0.0-dev' and 'local' — operators cannot identify which version is running without inspecting GHCR tags
- **Fix:** Add NEXT_PUBLIC_APP_VERSION=${{ github.ref_name }}-${{ github.run_number }}, NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_BUILD_TIME build-args to web Docker build step

### P1 — No database down/rollback scripts exist for any of the 26 migrations

- **File:** `supabase/migrations/`
- **Category:** database_rollback
- **Impact:** Forward-fix is the only path for migration issues; PITR causes data loss for the entire database
- **Fix:** Write down scripts (.down.sql) for each migration, starting with the 5 ALTER TABLE migrations (#14, #15, #16) that add columns

### P1 — No rollback job exists for development environment — always deploys latest origin/develop

- **File:** `.github/workflows/deploy-development.yml`
- **Category:** artifact_rollback
- **Impact:** Broken develop deploy requires manual SSH intervention; no automated recovery path
- **Fix:** Add workflow_dispatch with rollback_sha input to deploy-development.yml matching production pattern

### P1 — Feature flags exist in database but are not wired to any application code — 5 seed flags control nothing

- **File:** `apps/api/src/modules/feature-flags/`
- **Category:** feature_flag_kill_switch
- **Impact:** In an emergency, there is no kill-switch mechanism to disable features (push notifications, realtime, file upload)
- **Fix:** Audit all feature boundaries and add featureFlagService.evaluateFlag() checks; implement global kill-switch flag

### P1 — Post-rollback validation only checks /healthz HTTP 200 — no functional smoke tests

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** post_rollback_validation
- **Impact:** Rollback can pass health check while critical features (auth, messaging, realtime) are still broken
- **Fix:** Add smoke-test step after rollback: send test message via API, verify WebSocket connect, check auth flow

### P2 — Migration rollback runbook incorrectly states PostgreSQL does not support DDL rollback

- **File:** `docs/runbooks/database-migrations.md`
- **Category:** operator_runbooks
- **Impact:** Operators may not attempt safe DDL rollback (BEGIN; ... ROLLBACK;) thinking it's impossible
- **Fix:** Correct the runbook: PostgreSQL fully supports DDL rollback within transaction blocks

### P2 — Development deploy runbook has no rollback section at all

- **File:** `docs/runbooks/development-deploy-overview.md`
- **Category:** operator_runbooks
- **Impact:** Operators lack documented recovery steps for failed development deployments
- **Fix:** Add rollback section to development-deploy-overview.md referencing the production rollback pattern

### P2 — Circuit breaker implemented but not wired to any feature flag or kill-switch

- **File:** `apps/api/src/lib/circuit-breaker.ts`
- **Category:** feature_flag_kill_switch
- **Impact:** Circuit breaker opens silently on external dependency failure but no kill-switch mechanism exists to manually disable the failing integration
- **Fix:** Wire circuit breaker state to feature flag evaluation so operators can manually disable failing integrations

### P3 — No git tags or semver releases — only git SHAs identify releases

- **File:** ``
- **Category:** artifact_rollback
- **Impact:** Cannot easily reference known-good states; no release notes; git describe falls back to bare SHA
- **Fix:** Add git tag (e.g., vYYYYMMDD-runNumber) at end of deploy-production.yml; create release notes

### P3 — Rollback readiness checklists exist in docs/ but are not referenced by any workflow or runbook

- **File:** ``
- **Category:** operator_runbooks
- **Impact:** Checklists are undiscoverable during incident response
- **Fix:** Reference rollback_readiness_checklist.md from production-deploy-overview.md and incident-response.md
