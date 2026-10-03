# 10 — GitHub Actions & CI/CD Governance

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Workflow triggers, permissions, gating, secret handling, deploys, and governance controls.

## Evidence Reviewed

- `.github/workflows/` — 22 workflows, notably `ci.yml`, `validate.yml`, `build-push.yml`, `deploy-development.yml`, `deploy-production.yml`, `supabase-migrations.yml`, `governance.yml`
- `.github/dependabot.yml`, `.husky/pre-commit`

## Verification Performed

- Listed triggers and permissions per deploy workflow.
- Checked whether quality/security checks gate the build.
- Confirmed deploy workflows mutate production DB and prune volumes (cross-refs).

## Executive Summary

CI is broad but permissive. Production auto-deploys on push to `main` with no required review in the workflow, and the same job runs raw SQL that weakens production RLS. Security and E2E scans are advisory. This is a governance P1 cluster.

## Inventory

| Workflow | Trigger | Gate? |
|---|---|---|
| `ci.yml` | push main/develop, PR main, schedule | calls `validate.yml` |
| `validate.yml` | reusable | test/lint/typecheck/build; several non-blocking |
| `build-push.yml` | push develop, PR | pushes images |
| `deploy-development.yml` | push develop | auto-deploy + seed |
| `deploy-production.yml` | push main, dispatch | auto-deploy + seed + RLS DDL |
| `supabase-migrations.yml` | push main/develop on supabase paths | `db push` |

## Findings

### Finding ID: CI-P1-001 - Production auto-deploys on push to `main` without a required review gate in-repo

- Severity: P1
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/deploy-production.yml:9-17` — `on: push: branches: [main]`
  - `.github/workflows/deploy-production.yml:204-209` — `deploy` job uses `environment: production` (protection depends on repository settings, not visible in repo)
  - `.github/workflows/validate.yml:246-281` — branch-protection check is `continue-on-error: true`
- What is happening: Merging to `main` triggers provision + build + deploy; the only branch-protection signal is advisory.
- Why it matters: un-reviewed or mistyped changes ship to production immediately.
- User / business impact: production incidents.
- Security / privacy / reliability impact: high.
- Recommended fix: require environment protection reviewers for `production`; require PR review on `main`; make the branch-protection check blocking.
- Suggested validation: a push without approval pauses at the environment.
- Owner suggestion: Release eng
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P1-002 - Deploy workflow mutates production schema and data from CI

- Severity: P1
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/deploy-production.yml:312-350,352-445` — Management-API SQL: auth token fixes, identities, password reset, `users_select USING (true)`, seeds
  - `supabase-migrations.yml` already provides the sanctioned migration path
- What is happening: CI is a second, unversioned DB migration channel.
- Why it matters: schema state is not reproducible from migrations; security policies silently change.
- User / business impact: undetected drift.
- Security / privacy / reliability impact: high (enables SEC-P0-001/PII exposure).
- Recommended fix: CI must not run DDL/DML against the database; use migrations + an explicit, protected data-seeding workflow.
- Suggested validation: deploy pipeline contains no `database/query` DDL.
- Owner suggestion: Release eng + Security
- Effort estimate: M
- Dependencies: SEC-P0-001, DATA-P1-001
- Status: open

### Finding ID: CI-P1-003 - Security scans are non-blocking

- Severity: P1
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/validate.yml:228-238` — `pnpm audit … || true`; Trivy step `continue-on-error: true`
  - `.github/workflows/build-push.yml:116-132` — Trivy image scans `continue-on-error: true`
  - `.husky/pre-commit:20-25` — audit warning only
- What is happening: Dependency and image vulnerability findings never fail a build.
- Why it matters: known-vulnerable dependencies/images can ship.
- User / business impact: security debt accrues silently.
- Security / privacy / reliability impact: high.
- Recommended fix: fail on high/critical with an explicit, time-boxed allowlist/exception file.
- Suggested validation: introduce a high vuln in a branch; CI fails.
- Owner suggestion: Security/CI
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P1-004 - Deploy prunes all Docker volumes (data loss)

- Severity: P1
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/deploy-production.yml:287` — `docker system prune -af --volumes`
  - `.github/workflows/deploy-development.yml:219` — same
  - cross-ref DATA-P1-002
- What is happening: CI command deletes named volumes each deploy.
- Why it matters: Redis state loss on every release.
- User / business impact: lost queued work.
- Security / privacy / reliability impact: high.
- Recommended fix: remove `--volumes`.
- Suggested validation: volume persists across deploys.
- Owner suggestion: Infra
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P2-005 - Migration validation and order checks are non-blocking

- Severity: P2
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/validate.yml:303-332` — `supabase db diff || true`, migration-list fallback, order mismatch only warns, lint non-blocking
  - `.github/workflows/validate.yml:346-357` — rollback existence only
- What is happening: migration correctness rarely fails CI.
- Why it matters: broken migrations reach production.
- User / business impact: deploy failures.
- Security / privacy / reliability impact: medium.
- Recommended fix: make `db reset`, order check, and rollback test blocking.
- Suggested validation: a deliberately broken migration fails CI.
- Owner suggestion: DB/CI
- Effort estimate: M
- Dependencies: DATA-P2-004
- Status: open

### Finding ID: CI-P2-006 - `build-push` pushes images on pull requests

- Severity: P2
- Confidence: Medium
- Area: CI
- Evidence:
  - `.github/workflows/build-push.yml:15-16` — `pull_request` trigger
  - `.github/workflows/build-push.yml:50-89` — all three builds use `push: true`
- What is happening: Same-repo PRs publish `:dev`/SHA images to GHCR.
- Why it matters: registry pollution; unreviewed images published (though not deployed).
- User / business impact: supply-chain hygiene.
- Security / privacy / reliability impact: medium.
- Recommended fix: only push on trusted branch pushes; build-only on PRs.
- Suggested validation: PR run has `push: false`.
- Owner suggestion: CI
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P2-007 - Branch-protection check cannot fail the build and uses an outdated API shape

- Severity: P2
- Confidence: Medium
- Area: CI
- Evidence:
  - `.github/workflows/validate.yml:246-281` — job has `continue-on-error: true`; calls `github.rest.repos.getBranchProtection` and treats empty `restrictions` as missing
- What is happening: The guard is advisory and may misreport.
- Why it matters: governance signals are not trustworthy.
- User / business impact: false sense of protection.
- Security / privacy / reliability impact: medium.
- Recommended fix: use repository rulesets/`getBranchRules`, make it blocking for `main`.
- Suggested validation: disabling a rule fails CI.
- Owner suggestion: Release eng
- Effort estimate: S
- Dependencies: None
- Status: open

## Risks

- Production is mutated by CI outside migrations; quality/security gates advisory.

## Recommendations

1. Stop DB mutation from deploy; gate production behind environment reviewers.
2. Make security and E2E checks blocking.

## Quick Wins

- Remove `--volumes`; remove RLS DDL from deploy.

## Hardening Backlog

- Signed images/provenance; required status checks; rulesets as code.

## Suggested Tests

- Workflow linting (`actionlint`), policy tests on deploy files.

## Suggested Documentation Updates

- CI/CD governance doc stating "no deploy-time DDL".

## Open Questions

- Are GitHub `production` environment protection rules configured? Not visible in repo — Unknown.

## Appendix

- 22 workflow files listed in `inventory.json`.
