# Reconciliation Report

- Prompt: **reconciliation_master**
- Domain: **reconciliation**
- Run ID: **reconciliation_master_20260701_191010**
- Generated: **2026-07-01T19:10:10Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **3**
- P2: **4**, P3: **5**
- Readiness: **63.00**

## Findings

### P0 — Migration sequence gap in 20260626 batch — jumps from 01 to 22; 21 missing sequence numbers suggesting deleted or renumbered migrations

- **File:** `supabase/migrations/`
- **Category:** supabase
- **Impact:** Migration history ambiguity; Supabase CLI tracking by filename may detect conflicts; potential ordering issues on fresh db.push
- **Fix:** Audit migration sequence; renumber with contiguous numbers; verify all migrations apply cleanly from scratch

### P1 — Feature-flag middleware broken: requireWorkspaceMembership('workspaceId') on paths without :workspaceId param — all feature-flag requests fail with 400

- **File:** `apps/api/src/modules/feature-flags/routes.ts`
- **Category:** api
- **Impact:** Feature flags completely non-functional across all workspaces
- **Fix:** Remove requireWorkspaceMembership from feature-flag routes or add workspaceId as query/body param

### P1 — No production approval gate — push to main immediately deploys to production without any manual review step

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** ci_cd
- **Impact:** Any code merged to main can deploy to production with zero human oversight
- **Fix:** Add environment: production with required reviewers to deploy job

### P1 — Terraform state key hardcoded with no environment interpolation — dev and prod share the same state

- **File:** `infra/terraform/versions.tf`
- **Category:** infra_terraform
- **Impact:** Parallel state operations on dev and prod can corrupt Terraform state
- **Fix:** Use ${var.environment} in backend key to isolate environment state

### P2 — Worker package has no health endpoint, no test script, no logging — completely unobservable

- **File:** `apps/worker/`
- **Category:** worker
- **Impact:** Worker failures invisible; no monitoring or alerting for background job failures
- **Fix:** Add health endpoint, structured logging, and basic metric instrumentation to apps/worker

### P2 — TypeScript types severely out of sync with DB schema — 6 interfaces vs 16 tables; soft-delete fields missing

- **File:** `packages/db/src/types.ts`
- **Category:** shared_packages
- **Impact:** Type safety gaps across codebase; developers forced to use 'any'
- **Fix:** Regenerate types via supabase gen types typescript; add CI drift check

### P2 — governance.yml and platform.yml workflows broken — reference 5 nonexistent scripts

- **File:** `.github/workflows/governance.yml`
- **Category:** ci_cd
- **Impact:** CI noise on every push; no actual governance enforcement
- **Fix:** Fix or disable broken workflows; consolidate into working evaluate_gate.py

### P2 — Playwright test results directory checkpoints (.playwright-results/) not gitignored

- **File:** ``
- **Category:** script_tooling
- **Impact:** Test artifacts may be accidentally committed, bloating repo size
- **Fix:** Add .playwright-results/ to .gitignore

### P3 — Runbook references packages/db/sql/migrations/ directory which no longer exists

- **File:** `docs/runbooks/database-migrations.md`
- **Category:** docs
- **Impact:** Operators following runbook will look in wrong directory
- **Fix:** Update runbook to reference supabase/migrations/ as single migration source

### P3 — No loading.tsx in route groups — no Suspense fallback for page transitions

- **File:** `apps/web/`
- **Category:** web
- **Impact:** Page transitions show blank screen while data loads
- **Fix:** Add loading.tsx with Skeleton components to each route group

### P3 — No dependabot configuration (.github/dependabot.yml) for automated dependency updates

- **File:** ``
- **Category:** docs
- **Impact:** Dependency vulnerabilities may go unnoticed until manually discovered
- **Fix:** Create .github/dependabot.yml with weekly npm + GitHub Actions checks

### P3 — No CONTRIBUTING.md or PR/issue templates to guide new contributors

- **File:** ``
- **Category:** api
- **Impact:** Inconsistent PR submissions; higher friction for new contributors
- **Fix:** Add CONTRIBUTING.md, PR template, and issue templates

### P3 — Default droplet size still s-1vcpu-512mb-10gb despite known OOM (documented in AGENTS.md)

- **File:** `infra/terraform/variables.tf`
- **Category:** infra_terraform
- **Impact:** New droplets provisioned with undersized spec; OOM under normal load
- **Fix:** Update default droplet_size to s-2vcpu-2gb in variables.tf
