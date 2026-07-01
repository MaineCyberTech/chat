# Reconciliation Report

- Prompt: **pre_reconciliation_checklist**
- Domain: **reconciliation**
- Run ID: **pre_reconciliation_checklist_20260701_191010**
- Generated: **2026-07-01T19:10:10Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **2**
- P2: **5**, P3: **4**
- Readiness: **65.00**

## Findings

### P0 — Changes to deployment workflows and infra/terraform can be applied without human approval — no required reviewers on deploy jobs

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** approval_gates
- **Impact:** Critical deployment/infra changes can reach production without review, violating approval gate requirements
- **Fix:** Add environment: production with required reviewers; add CODEOWNERS for infra/ and .github/workflows/

### P1 — Single SUPABASE_PROJECT_REF for both dev and prod — no separate Supabase project per environment

- **File:** `.github/workflows/supabase-migrations.yml`
- **Category:** environment_deployment
- **Impact:** Migrations from develop directly affect same database as main
- **Fix:** Use separate Supabase projects with separate project ref secrets per environment

### P1 — E2E tests all marked test.skip — zero E2E coverage despite having 48 test stubs and Playwright configured

- **File:** `tests/`
- **Category:** build_test_baseline
- **Impact:** No E2E baseline before edits; cannot detect UI regression during reconciliation
- **Fix:** Establish at minimum auth and workspace E2E tests as baseline before reconciliation edits

### P2 — SMTP/email env vars not set in any deployment workflow — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM all missing

- **File:** `.github/workflows/`
- **Category:** environment_deployment
- **Impact:** Password reset and transactional emails non-functional in deployed environments
- **Fix:** Add SMTP configuration secrets to all deploy workflows

### P2 — Multiple .env.example files exist across apps with inconsistent variable coverage — no single source of truth for required env vars

- **File:** ``
- **Category:** repo_state_safety
- **Impact:** New environment setup requires cross-referencing multiple files; missing vars not caught until runtime
- **Fix:** Consolidate to root .env.example as canonical source; validate all vars documented

### P2 — No Terraform plan step in deploy workflows — terraform apply runs without plan review

- **File:** `infra/terraform/`
- **Category:** environment_deployment
- **Impact:** Infrastructure changes applied without human review of planned changes
- **Fix:** Add terraform plan step with approval gate before apply

### P2 — No explicit CODEOWNERS file defining required reviewers for sensitive paths

- **File:** ``
- **Category:** approval_gates
- **Impact:** Anyone can modify auth, DB, infra, or deployment files without specialized review
- **Fix:** Create CODEOWNERS: @MaineCyberTech/security for auth/supabase/, @MaineCyberTech/infra for terraform/, @MaineCyberTech/ops for deploy workflows

### P2 — Worker package has no test script configured in package.json

- **File:** `apps/worker/`
- **Category:** build_test_baseline
- **Impact:** Worker code changes during reconciliation have zero test coverage
- **Fix:** Add vitest config and test script to apps/worker/package.json

### P3 — No checkpoint branch created before reconciliation — no git tag marking pre-reconciliation state

- **File:** ``
- **Category:** repo_state_safety
- **Impact:** Cannot easily revert to pre-reconciliation state if edits cause issues
- **Fix:** Create git tag pre-reconciliation-baseline before any reconciliation edits

### P3 — No baseline captured for lint/typecheck/test pass before reconciliation edits

- **File:** ``
- **Category:** build_test_baseline
- **Impact:** Cannot distinguish pre-existing failures from reconciliation-introduced issues
- **Fix:** Run and capture pnpm lint, pnpm typecheck, pnpm test output as baseline artifact

### P3 — Playwright test results (.playwright-results/) and generated coverage reports not gitignored

- **File:** ``
- **Category:** review_scope
- **Impact:** Generated artifacts may be committed during reconciliation file passes
- **Fix:** Add .playwright-results/ and coverage/ to .gitignore

### P3 — No explicit documentation of which files/folders are off-limits during reconciliation

- **File:** ``
- **Category:** approval_gates
- **Impact:** Reconciliation AI may modify critical config files without understanding impact
- **Fix:** Document off-limits paths: apps/api/src/config/, supabase/migrations/, infra/terraform/, .github/workflows/deploy-\*
