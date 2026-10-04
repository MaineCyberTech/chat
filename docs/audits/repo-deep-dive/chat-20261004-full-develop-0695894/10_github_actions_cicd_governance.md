# 10 — GitHub Actions / CI-CD Governance

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`
- Profile: base

## Scope

Workflow security, token permissions, deploy governance, script injection, and branch-protection enforcement across `.github/workflows/` (22 workflows).

## Evidence Reviewed

- All files under `.github/workflows/` (`validate.yml`, `deploy-production.yml`, `deploy-development.yml`, `infra-development.yml`, `build-push.yml`, autocommit workflows, dispatch workflows)
- `CODEOWNERS`, `dependabot.yml`

## Verification Performed

- Read every workflow and checked triggers, `permissions:`, `environment:`, and `run:` interpolation.
- Confirmed which jobs carry a protected `environment`.
- Confirmed the branch-protection job's hard-coded branch.
- Reconciled against the focused lens run `20261004-0700`.

## Executive Summary

CI is comprehensive but has governance gaps: a production provision job runs destructive Terraform with `-auto-approve` without an environment gate, the development infra workflow auto-applies destructive changes on push, several workflows interpolate free-text `workflow_dispatch` inputs into `run:`, two auto-commit workflows hold `contents: write` and push to `main`, and the branch-protection check only inspects `main` while many workflows omit explicit `permissions:`.

## Inventory

| Workflow | Trigger | `environment:` | `permissions:` |
|---|---|---|---|
| `deploy-production.yml` | push `main` | only on later jobs | partial; `id-token: write` unused |
| `deploy-development.yml` | push `develop` | none | some |
| `infra-development.yml` | push `develop` (`infra/**`) | none | none |
| `validate.yml` | PR/push | none | yes |
| `audit-ci-autocommit.yml` | push `main` | none | `contents: write` |
| `audit-badges-autocommit.yml` | push `main`/`development` | none | `contents: write` |
| `seed-database.yml` | dispatch | none | `contents: read` |

## Findings

### Finding ID: CI-P1-001 - Production `provision` job runs destructive Terraform with no environment approval

- Severity: P1
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/deploy-production.yml:16-17` triggers on push to `main`.
  - `.github/workflows/deploy-production.yml:140` — `terraform apply -auto-approve -input=false`; the job also deletes droplets/firewalls/DNS.
  - `.github/workflows/deploy-production.yml:241,376` — only later jobs carry `environment: production`; the `provision`/`build-images` jobs do not.
  - `.github/workflows/deploy-production.yml:22` — `id-token: write` granted though no OIDC exchange is used.
- What is happening: Every push to `main` immediately destroys/recreates production infrastructure; approval protection covers only a later job.
- Why it matters: A bad merge to `main` can delete production infrastructure before any human approval.
- User / business impact: Outage/data loss.
- Security / privacy / reliability impact: High.
- Recommended fix: Add `environment: production` (with required reviewers) to `provision` and `build-images`; run `terraform plan` and require approval before `apply`; drop unused `id-token: write`.
- Suggested validation: `provision` cannot run without an approved production environment.
- Owner suggestion: Release eng
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P2-001 - `infra-development` destroys infra on every push to `develop` with weak controls

- Severity: P2
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/infra-development.yml:4-8` — push to `develop`, `paths: infra/**`.
  - Deletes duplicate droplets and DNS records, then `terraform apply -auto-approve`.
  - Writes `CI_SSH_PRIVATE_KEY` to `/tmp/ssh_key` and uses `-o StrictHostKeyChecking=no`; no `permissions:` and no `environment:`.
- What is happening: Merging an `infra/**` change auto-applies destructive infrastructure changes with default token permissions and disabled SSH host-key verification.
- Why it matters: Destructive changes ship without approval; host-key checking off enables MITM of the deploy SSH path.
- User / business impact: Accidental infra destruction.
- Security / privacy / reliability impact: High.
- Recommended fix: Add `permissions: contents: read`, gate with a protected `development` environment, pin `known_hosts`, and separate plan from apply.
- Suggested validation: Infra changes require approval.
- Owner suggestion: CI/Infra
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P2-002 - `workflow_dispatch` inputs interpolated directly into `run:` (script injection)

- Severity: P2
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/hardening-automation-runner.yml:17-19` — `--run-id "${{ inputs.run_id }}"`.
  - `.github/workflows/environment-promotion-audit.yml:24` — `--source-branch "${{ inputs.source_branch }}"`.
  - `.github/workflows/audit-release-certification.yml:30,34` — `--run-id "${{ inputs.run_id }}"`.
- What is happening: Free-text dispatch inputs are substituted into shell commands.
- Why it matters: A user able to dispatch can execute arbitrary shell on the runner and reach its token/secrets.
- User / business impact: CI compromise.
- Security / privacy / reliability impact: High.
- Recommended fix: Pass inputs via `env:` and reference quoted shell variables; validate `run_id`/`source_branch` with a strict allowlist regex.
- Suggested validation: An input containing `$(…)` is inert.
- Owner suggestion: CI
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P2-003 - Auto-commit workflows hold `contents: write` and push to `main`

- Severity: P2
- Confidence: Medium
- Area: CI
- Evidence:
  - `.github/workflows/audit-ci-autocommit.yml:17-18` — `permissions: contents: write`; uses `stefanzweifel/git-auto-commit-action` to push generated files; trigger `push` to `main`.
  - `.github/workflows/audit-badges-autocommit.yml:10-11` — same pattern on `main`/`development`.
- What is happening: On matching pushes, workflows run in-repo Python and commit/push generated files directly to a protected branch, often with `[skip ci]`.
- Why it matters: Self-modifying automation with write access to `main`; if the generator or its inputs are tampered with, commits land without PR review, and `[skip ci]` suppresses re-validation.
- User / business impact: Unreviewed changes to mainline.
- Security / privacy / reliability impact: Medium-high.
- Recommended fix: Restrict to `contents: read` and open a PR (or use a bot with a narrowly scoped ruleset exception); never `[skip ci]` on generated changes.
- Suggested validation: Auto-commit produces a PR, not a direct push.
- Owner suggestion: CI
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: CI-P2-004 - Branch-protection CI gate only validates `main`; `develop` (auto-deploy) unchecked

- Severity: P2
- Confidence: Medium
- Area: CI
- Evidence:
  - `.github/workflows/validate.yml` — branch-protection job hard-codes `const branch = 'main'` and required rule types.
  - `.github/workflows/ci.yml` runs on `[main, develop]`; `.github/workflows/deploy-development.yml` auto-deploys `develop`.
  - `CODEOWNERS` has a single catch-all owner line.
- What is happening: The in-repo governance gate never inspects `develop`, which auto-deploys.
- Why it matters: A misconfigured `develop` passes the gate; false assurance.
- User / business impact: Weak governance.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Validate `main`, `develop`, and `release/**`; declare explicit `permissions:` for the check; document required checks per branch.
- Suggested validation: The job fails if `develop` lacks required rules.
- Owner suggestion: CI
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P3-001 - No actionlint/shellcheck gate despite known workflow lint findings

- Severity: P3
- Confidence: High
- Area: CI
- Evidence:
  - Deterministic lens `DET-P2-001` reports shellcheck SC2086 in `build-push.yml:40`, `chaos-tests.yml:25,62`, `deploy-development.yml:37`.
  - `git grep` of `.github/workflows/**` for `actionlint` returns no matches; `validate.yml` runs prettier/eslint/typecheck/test/build but not workflow lint.
- What is happening: Workflow YAML/shell lint is not enforced.
- Why it matters: Workflow quality regressions ship silently.
- User / business impact: Low.
- Security / privacy / reliability impact: Low-medium.
- Recommended fix: Add a pinned `actionlint` job to `validate.yml`.
- Suggested validation: The job fails on a deliberately malformed workflow.
- Owner suggestion: CI
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CI-P3-002 - Many workflows omit `permissions:` (default token scope)

- Severity: P3
- Confidence: Medium
- Area: CI
- Evidence:
  - No `permissions:` in `supabase-migrations.yml`, `audit-ci.yml`, `audit-release-certification.yml`, `hardening-automation-runner.yml`, `governance.yml`, `platform.yml`, `load-test.yml`, `infra-development.yml`, `environment-promotion-audit.yml`, `feature-rollout-checkpoint.yml`, `executive-stakeholder-pack.yml`.
- What is happening: These rely on the repository default token permissions.
- Why it matters: A broader token than needed increases the impact of script injection or a compromised step.
- User / business impact: Low.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Set a repo default of read-only and add explicit least-privilege `permissions:` per workflow.
- Suggested validation: Every workflow declares `permissions:`.
- Owner suggestion: CI
- Effort estimate: S
- Dependencies: CI-P2-002
- Status: open

## Risks

- Unreviewed destructive production/infra changes; CI token over-privilege; script injection.

## Recommendations

1. Gate destructive Terraform behind protected environments and plan/apply separation.
2. Move dispatch inputs to `env:` with validation.
3. Replace direct auto-commits with PRs.
4. Broaden branch protection and add workflow lint.

## Quick Wins

- Drop unused `id-token: write`; add `permissions: contents: read` to `infra-development.yml`.

## Hardening Backlog

- Org-level ruleset for default read-only tokens.

## Suggested Tests

- actionlint/shellcheck job; an injection regression test.

## Suggested Documentation Updates

- Document required status checks per branch.

## Open Questions

- Are server-side environment reviewers configured for production/dev? Not visible in-repo — Unknown.

## Appendix

- 22 workflows total.
