# 21 — Repository Hygiene & Maintainability

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

Portability, file modes, duplicate logic/schema, encoding, and general maintainability signals.

## Evidence Reviewed

- `git ls-files -s` (file modes), `.gitattributes`, `.gitignore`
- `scripts/**`, `tests/chaos/scenarios/**`
- Root directory listing; `apps/api/src/middleware/require-admin.ts`, `apps/api/src/modules/workspaces/routes.ts`
- `supabase/migrations/*_add_user_groups*`

## Verification Performed

- Confirmed tracked file modes with `git ls-files -s`.
- Checked for the previously reported one-off remediation scripts (`scripts/fix_p0*.py` etc.) — now absent.
- Confirmed the E2E credential and generated output directories are gone.
- Re-checked duplicate logic/schema (tracked here and in `02`/`07`).

## Executive Summary

Hygiene improved materially: the one-off remediation scripts, committed E2E credential, generated prompt outputs, and test-results are gone, and mojibake in `README.md`/`.env.example` was cleaned. Two issues remain: intended shell executables still lack the exec bit, and duplicate logic/schema persists (tracked as ARCH-P3-002 and DATA-P2-001).

## Inventory

| Item | Evidence | Status |
|---|---|---|
| Shell exec bit | `git ls-files -s` mode `100644` | Missing on intended executables |
| One-off scripts | `scripts/fix_p0*.py` etc. | Removed |
| Generated outputs | `tmp_prompt_outputs/`, `test-results/` | Removed |
| Root debris | `COMMIT_MSG.txt`, `temp_layout.txt`, `FINAL_RECONCIL*` | Present (INV-P2-001) |

## Findings

### Finding ID: PORT-P3-001 - Tracked shell scripts lack the exec bit

- Severity: P3
- Confidence: High
- Area: PORT
- Evidence:
  - `git ls-files -s` shows mode `100644` for `scripts/setup-dev.sh`, `scripts/test-db-rls.sh`, `scripts/check-sensitive-data.sh`, `scripts/hardening/run_all.sh`, `scripts/accessibility-audit.sh`, `scripts/audits/run_audit_cycle.sh`, `scripts/automation/run_full_pipeline.sh`, `scripts/teardown-dev.sh`, `tests/chaos/scenarios/api-crash.sh`, `tests/chaos/scenarios/redis-down.sh`.
  - `.gitattributes` normalizes `*.sh text` but does not set a mode.
- What is happening: `./script.sh` fails on Linux; callers use `bash script.sh` or `chmod +x` as mitigation.
- Why it matters: Portability drift (especially Windows checkouts) and surprises in CI/runbooks.
- User / business impact: Low; friction for operators.
- Security / privacy / reliability impact: Low.
- Recommended fix: `git update-index --chmod=+x` the intended executables.
- Suggested validation: `git ls-files -s scripts/*.sh` shows `100755` for intended executables.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: None
- Status: open

## Risks

- Portability friction; duplicated logic/schema (see ARCH-P3-002, DATA-P2-001).

## Recommendations

1. Fix exec bits.
2. Remove root debris (INV-P2-001).
3. Consolidate duplicate admin auth and duplicate migration intent.

## Quick Wins

- `git update-index --chmod=+x` the ten scripts above.

## Hardening Backlog

- CI repo-hygiene guard (no `tmp_*`/`FINAL_RECONCIL*` tracked).

## Suggested Tests

- A `git ls-files` hygiene assertion.

## Suggested Documentation Updates

- CONTRIBUTING: what may be committed; file-mode policy.

## Open Questions

- None.

## Appendix

- `scripts/` still holds operational tooling, but the historical `fix_p0*` remediation scripts are gone.
