# 01 — Repository Inventory

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc` (branch `develop`, dirty=false)
- Profile: base
- Auditor: repo-deep-dive full-hardening subagent
- Date: 2026-10-03

## Scope

Whole-repository inventory of a pnpm/Turborepo monorepo (`apps/api`, `apps/web`, `apps/worker`, `packages/*`, `infra`, `supabase`, `.github`). Starts from the run `inventory.json`.

## Evidence Reviewed

- `inventory.json` (run folder)
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `README.md`, `AGENTS.md`
- `git ls-files`, `.gitignore`, directory listings

## Verification Performed

- Confirmed branch/SHA and clean tree via `git log -1` / `git status`.
- Enumerated tracked files and checked for committed env/credential files (`git ls-files`).
- Compared README claims (54 tests / 12 files) with counted test files (77 test files found).

## Executive Summary

The repo is a substantial, feature-rich monorepo (1,489 files, ~154k lines) with API, web, worker, SQL/Supabase, Terraform, and 22 GitHub Actions workflows. It is clearly actively audited, but it carries a large amount of generated audit output and at least one committed credential. The inventory itself is trustworthy; several documentation claims are not (see self-consistency note).

## Inventory

| Layer | Evidence | Notes |
|---|---|---|
| Apps | `apps/api`, `apps/web`, `apps/worker` | Express + Socket.io, Next.js 15, BullMQ workers |
| Packages | `packages/config`, `packages/db`, `packages/sdk`, `packages/ui` | shared config/db/sdk/ui |
| DB | `supabase/migrations` (80 files), `supabase/policies` (11), `supabase/rollback` (80), `supabase/seeds` (6) | 80 up / 80 rollback scripts |
| Infra | `infra/terraform/*.tf`, `infra/docker/*` | DO droplet + Cloudflare DNS + Caddy compose |
| CI | `.github/workflows` (22 workflows) | validate/build-push/deploy/audit pipelines |
| Tests | 77 `*.test.ts(x)` files; `tests/e2e` (15 specs), `tests/k6`, `tests/chaos` | coverage thresholds 35/30/25/35 |

## Findings

### Finding ID: INV-P2-001 - Committed audit/generated artifacts bloat the repository

- Severity: P2
- Confidence: High
- Area: INV
- Evidence:
  - `docs/` — 674 files (largest dir), including `docs/audits/**`, `docs/audits/latest_run.json`
  - `tmp_prompt_outputs/` — 18 generated JSON prompt outputs
  - `test-results/` — 7 Playwright artifacts committed
  - `FINAL_RECONCILED_REPO_AUDIT.md`, `FINAL_RECONCILIATION_EXECUTION_SUMMARY.md` (root)
- What is happening: Large volumes of generated analysis/report output and test artifacts are tracked in git rather than produced by pipelines or stored outside the repo.
- Why it matters: inflates clone size, creates staleness/SSOT ambiguity, and mixes audit output with source of truth.
- User / business impact: slower clones/CI checkout; reviewers cannot tell which audit is canonical.
- Security / privacy / reliability impact: generated exports and test artifacts may contain sensitive data; they are not treated as sensitive.
- Recommended fix: remove `tmp_prompt_outputs/`, `test-results/`, and `docs/audits/**` from version control; add to `.gitignore`; keep only a curated `docs/audits/README.md` index.
- Suggested validation: `git rm -r --cached tmp_prompt_outputs test-results`; confirm `git ls-files | rg "tmp_prompt_outputs|test-results"` is empty.
- Owner suggestion: Repo maintainer
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: INV-P2-002 - Credential file `test-signin.json` is tracked

- Severity: P2
- Confidence: High
- Area: INV
- Evidence:
  - `test-signin.json` — tracked (`git ls-files`), content is an email + plaintext password (redacted: `julian.butler@…` / `testpassword…`)
  - `test-signin.example.json` — tracked template
- What is happening: A file intended as a local-only secret convenience is committed and contains a real-looking account credential.
- Why it matters: plaintext credentials in VCS; if reused on any environment it is an account takeover vector.
- User / business impact: potential unauthorized access; secret rotation cost.
- Security / privacy / reliability impact: credential exposure; violates the project's own E2E guidance that this file should not be in the repo.
- Recommended fix: `git rm --cached test-signin.json`, add to `.gitignore`, rotate the password, and load E2E credentials from CI secrets.
- Suggested validation: `git ls-files | rg test-signin.json` empty; CI e2e uses injected secrets.
- Owner suggestion: Security + maintainer
- Effort estimate: S
- Dependencies: E2E auth fixture work (see TEST-P1-001)
- Status: open

### Finding ID: INV-P2-003 - Documentation self-contradicts repository state

- Severity: P2
- Confidence: High
- Area: INV
- Evidence:
  - `docs/audits/compare/audit_final_testing_20260724.md` states `test-signin.json` is "not present in repo"
  - `git ls-files` shows `test-signin.json` IS tracked
  - `AGENTS.md` claims "0 P0, 0 P1 … ALL CLEAN" while P0/P1 issues exist at this commit (see 06/10)
- What is happening: Narrative audit artifacts assert a state that the repository contradicts at the audited commit.
- Why it matters: a false "all clean" status drives bad release decisions.
- User / business impact: ships with unaddressed P0/P1s.
- Security / privacy / reliability impact: high — false assurance.
- Recommended fix: generate status artifacts from the pipeline, stamp them with the commit, and stop hand-asserting "all clean".
- Suggested validation: machine-generated status includes commit SHA and reconciles with findings.
- Owner suggestion: Audit pipeline owner
- Effort estimate: S
- Dependencies: harden finding pipeline (`hardening/`, `docs/audits/latest_run.json`)
- Status: open

### Finding ID: INV-P3-001 - Character-encoding (mojibake) artifacts in docs and config

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - `README.md` line 7 — `â€”` (em dash corruption)
  - `AGENTS.md` line 5 — `hash for password123 corrected to $2a$10…` (valid) alongside mojibake elsewhere
  - `.env.example` — `Chat Monorepo �?" Environment Variables`
- What is happening: Non-UTF-8/legacy encoding artifacts are committed in docs/config headers.
- Why it matters: reduces readability and can indicate tooling that mangles content (e.g., secret-writing scripts).
- User / business impact: minor confusion.
- Security / privacy / reliability impact: low; but CI scripts that write secrets/replacements could corrupt values if encoding is mishandled (`opencode_opacity_replacements.txt`).
- Recommended fix: normalize tracked text to UTF-8, add `.editorconfig`/prettier enforcement (exists) and a CI check.
- Suggested validation: `rg -n "â€|�"` returns only expected occurrences.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: INV-P3-002 - Overlapping and inconsistent environment example files

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - `.env.example`, `.env.local.example`, `apps/api/.env.example`, `apps/web/.env.example`, `apps/worker/.env.example`
  - `infra/docker/.env.dev.example`, `infra/docker/.env.devremote.example`, `infra/docker/.env.prod.example`
- What is happening: Many env templates with differing schemas (e.g., `JWT_SECRET`, `WEBHOOK_ENCRYPTION_KEY`, `LIVEKIT_*` present in some, absent in others).
- Why it matters: operators can deploy a compose file that omits required secrets (`WEBHOOK_ENCRYPTION_KEY` is required at runtime by `apps/api/src/modules/webhooks/service.ts`).
- User / business impact: broken webhook feature in prod.
- Security / privacy / reliability impact: medium.
- Recommended fix: single canonical schema (from `apps/api/src/config/env.ts` / `packages/config/env-schema.ts`) and generate examples.
- Suggested validation: every required env key documented in each relevant example.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: FEAT-P1-002
- Status: open

## Risks

- Generated output and stale audits are treated as authoritative.
- Credential file present in VCS.

## Recommendations

1. Remove generated artifacts and the credential file from git.
2. Make status artifacts derive from `findings.json` and carry the commit SHA.

## Quick Wins

- `git rm --cached test-signin.json`
- `git rm -r --cached tmp_prompt_outputs test-results`
- Add CI check rejecting tracked `tmp_prompt_outputs/`, `test-results/`, `test-signin.json`.

## Hardening Backlog

- Curated audit index; artifact retention policy.

## Suggested Tests

- CI guard: `git ls-files` must not contain secret-adjacent paths (`test-signin.json`, `*.pem`, `*.key`).

## Suggested Documentation Updates

- Replace "ALL CLEAN" claims with generated, commit-stamped status.

## Open Questions

- Is `test-signin.json` credential reused in any hosted environment? Unknown — must be checked and rotated.

## Appendix

- Largest dirs: `docs` 674, `apps` 303, `supabase` 171, `scripts` 106, `packages` 91.
