# 01 — Repository Inventory

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894` (branch `develop`)
- Profile: base
- Auditor: repo-deep-dive full-domain pilot subagent (read-only)
- Date: 2026-10-04

## Scope

Whole-repository inventory of the pnpm/Turborepo monorepo: `apps/api`, `apps/web`, `apps/worker`, `packages/*`, `supabase`, `infra`, `.github`, `scripts`, `tests`. This pass is the Wave-0 input for the remaining domains.

## Evidence Reviewed

- `git ls-files` (1,005 tracked files), `git log`, `git status`
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `README.md`, `AGENTS.md`
- Directory listings for `apps/`, `packages/`, `supabase/`, `infra/`, `.github/`

## Verification Performed

- Confirmed branch/SHA with `git rev-parse` (`develop`, `06958941dcc669f1e4174c4477bd4ae9a69bad26`).
- Counted tracked files and per-layer totals.
- Checked for previously reported committed credential/generated paths (`test-signin.json`, `tmp_prompt_outputs/`, `test-results/`) — all now absent.
- Enumerated remaining root-level process-debris files.

## Executive Summary

The repo is a well-organized, feature-rich monorepo: 1,005 tracked files, 80 unit-test files, 14 Playwright specs, 76 migrations with 76 matching rollback scripts, and 22 GitHub Actions workflows. Compared with the prior base audit at `a72b8cc`, the inventory is materially cleaner: the committed E2E credential (`test-signin.json`), `tmp_prompt_outputs/`, and `test-results/` have been removed, and `docs/audits/**` is now a curated subset. The one inventory defect that remains is a small set of stale, generated reconciliation artifacts at the repository root.

## Inventory

| Layer | Evidence | Notes |
|---|---|---|
| Apps | `apps/api`, `apps/web`, `apps/worker` | Express + Socket.io, Next.js, BullMQ worker |
| Packages | `packages/config`, `packages/db`, `packages/sdk`, `packages/ui` | 91 tracked files |
| DB | `supabase/migrations` (76), `supabase/rollback` (76), `supabase/tests` | 76 up / 76 down |
| Infra | `infra/terraform/*.tf`, `infra/docker/*` | DO droplet + Cloudflare DNS + Caddy compose |
| CI | `.github/workflows` (22) | validate / build-push / deploy / audit / governance |
| Tests | 80 `*.test.ts(x)`, 14 `tests/e2e` specs | plus `tests/k6`, `tests/chaos` |
| Docs | `docs/**` (curated audits under `docs/audits/`) | README, AGENTS, operations runbooks |

## Findings

### Finding ID: INV-P2-001 - Stale generated reconciliation artifacts remain tracked at the repository root

- Severity: P2
- Confidence: High
- Area: INV
- Evidence:
  - `git ls-files` at `0695894` shows: `COMMIT_MSG.txt`, `temp_layout.txt`, `tmp_migrations_list.txt`, `FINAL_RECONCILED_REPO_AUDIT.md`, `FINAL_RECONCILIATION_EXECUTION_SUMMARY.md`, `FINAL_RECONCILIATION_REPO_AUDIT_PROMPT.md`.
  - Prior audit `20261003-0018-develop-a72b8cc` tracked these plus `test-signin.json`, `tmp_prompt_outputs/`, and `test-results/`; the latter three are now gone.
- What is happening: Generated, one-off reconciliation notes and scratch files remain committed at the repository root long after the work they describe.
- Why it matters: They are not part of the build, are not referenced by any workflow, and their titles assert an "execution summary" that no longer reflects HEAD, creating source-of-truth ambiguity.
- User / business impact: Reviewers may treat a stale reconciliation summary as current status.
- Security / privacy / reliability impact: Low; scratch files can contain internal context and are not treated as sensitive.
- Recommended fix: Remove these files and add a root-hygiene guard (`git ls-files` must not contain `COMMIT_MSG.txt`, `temp_*.txt`, `tmp_*.txt`, `FINAL_RECONCIL*`).
- Suggested validation: `git ls-files | rg "^(COMMIT_MSG|temp_|tmp_|FINAL_RECONCIL)"` returns empty.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: None
- Status: open

## Risks

- Stale status artifacts treated as authoritative.

## Recommendations

1. Delete the root debris; keep audit output under a single curated index.
2. Add a lightweight CI repo-hygiene assertion.

## Quick Wins

- `git rm` the six root files listed above.

## Hardening Backlog

- Document in `CONTRIBUTING.md` which files may be committed.

## Suggested Tests

- Repo-hygiene guard as above.

## Suggested Documentation Updates

- None beyond the guard.

## Open Questions

- Are any of these root files consumed by a downstream process outside this repo? None observed in `.github/`, `scripts/`, or `package.json`.

## Appendix

- Tracked file totals: all 1,005; `apps` 326; `packages` 91; unit tests 80; e2e specs 14.
