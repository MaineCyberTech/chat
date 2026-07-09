# Principal Audit Report

- Prompt: **ci_cd_security_ultra**
- Domain: **ci_cd**
- Run ID: **ci_cd_security_ultra_20260709_070723**
- Generated: **2026-07-09T03:06:59Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **3**, P3: **2**
- Readiness: **78.00**

## Findings

### P1 — Secrets injected inline in run: command via heredoc

- **File:** `.github/workflows/supabase-migrations.yml:28`
- **Category:** secrets_in_run
- **Impact:** Secrets visible in CI logs if command fails or debug enabled
- **Fix:** Move SUPABASE_PROJECT_REF to env: block instead of inline in run: supabase link command

### P1 — No explicit GITHUB_TOKEN permissions block â€” uses default write-all

- **File:** `.github/workflows/deploy-development.yml`
- **Category:** permissions
- **Impact:** Deploy workflow has full write scope to all resources unnecessarily
- **Fix:** Add permissions: contents: read, packages: write at top of workflow

### P1 — No explicit GITHUB_TOKEN permissions block â€” uses default write-all

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** permissions
- **Impact:** Production deploy workflow has full write scope to all resources
- **Fix:** Add permissions: contents: read, packages: write, id-token: write at top of workflow

### P2 — 16 of 20 workflows lack explicit GITHUB_TOKEN permissions block

- **File:** `.github/workflows/`
- **Category:** permissions
- **Impact:** Default permissive token scope on most workflows (write-all on contents, packages, etc.)
- **Fix:** Add explicit permissions: block to each workflow with least-privilege scopes

### P2 — ci.yml triggers on push to main/develop but no path filter on schedule

- **File:** `.github/workflows/ci.yml`
- **Category:** path_filtering
- **Impact:** Scheduled runs trigger full CI stack even with no code changes
- **Fix:** Add path filter to schedule trigger or use paths-ignore for docs-only changes

### P2 — DO_API_TOKEN and other secrets used inline in run: commands via heredoc style

- **File:** `.github/workflows/deploy-development.yml:50-58`
- **Category:** secrets_in_run
- **Impact:** Secrets could leak in logs if curl commands fail
- **Fix:** Pass DO_API_TOKEN and CF_API_TOKEN via env: block, reference as $DO_API_TOKEN in scripts

### P3 — No explicit retention period set on test results and coverage artifacts

- **File:** `.github/workflows/validate.yml`
- **Category:** artifact_retention
- **Impact:** Artifacts stored indefinitely, accumulating storage costs
- **Fix:** Add retention-days: 30 to upload-artifact steps

### P3 — build-push.yml triggers on PR to develop and main â€” builds images on every PR even for doc-only changes

- **File:** `.github/workflows/build-push.yml`
- **Category:** path_filtering
- **Impact:** Unnecessary image builds consuming CI minutes
- **Fix:** Add paths-ignore: ['docs/**', '*.md', 'AGENTS.md'] to PR trigger
