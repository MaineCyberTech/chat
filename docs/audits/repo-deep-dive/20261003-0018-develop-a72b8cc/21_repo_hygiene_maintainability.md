# 21 — Repository Hygiene & Maintainability

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Repo layout, generated/duplicate artifacts, dead code, formatting/encoding, and maintainability signals.

## Evidence Reviewed

- Root listings, `.gitignore`, `git ls-files`
- `scripts/` (106 files incl. many one-off `fix_p0*.py`, `remove_p0.py`, `update_*` scripts)
- `tmp_prompt_outputs/`, `test-results/`, `docs/audits/**`, root zip files
- `apps/api/src/lib/metrics.ts`, `apps/api/src/server.ts` (TODOs)
- Duplicate implementations: `requireAdmin`, `add_user_groups` migrations

## Verification Performed

- Counted and categorized tracked artifacts.
- Searched for TODO/FIXME.
- Confirmed duplicate implementations.

## Executive Summary

The codebase itself is organized, but the repository carries significant process debris: one-off fix scripts, generated audit JSON, committed test results, binary archives, mojibake, and duplicated logic/schema. This raises maintenance cost and muddies the source of truth.

## Inventory

| Item | Evidence |
|---|---|
| One-off scripts | `scripts/fix_p0.py`, `fix_p0_round2.py`, `fix_p1s.py`, `remove_p0.py`, `update_fixed_p1.py`, `list_*.py`, `show_remaining.py` |
| Generated outputs | `tmp_prompt_outputs/` (18), `test-results/` (7) |
| Archives | `docs-prompts-archive.zip`, `infra.zip` |
| Duplicates | 2× `requireAdmin`; 2× `add_user_groups` migration |
| TODOs | `apps/api/src/lib/metrics.ts`, `apps/api/src/server.ts` |

## Findings

### Finding ID: HYG-P2-001 - Generated outputs and audit artifacts committed

- Severity: P2
- Confidence: High
- Area: HYG
- Evidence:
  - `tmp_prompt_outputs/*.json` (18 files), `test-results/*` (7)
  - `docs/` 674 files (largest dir), `docs/audits/latest_run.json`
  - cross-ref INV-P2-001
- What is happening: transient artifacts are versioned.
- Why it matters: repo bloat and SSOT ambiguity.
- User / business impact: slower development.
- Security / privacy / reliability impact: medium (sensitive exports retained).
- Recommended fix: remove and gitignore; generate in pipelines.
- Suggested validation: `git ls-files` contains no `tmp_prompt_outputs`/`test-results`.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: HYG-P2-002 - One-off remediation scripts and duplicated logic/schema remain

- Severity: P2
- Confidence: High
- Area: HYG
- Evidence:
  - `scripts/fix_p0.py`, `scripts/fix_p0_round2.py`, `scripts/fix_p1s.py`, `scripts/remove_p0.py`, `scripts/update_fixed_p1.py`, `scripts/remaining_todos.py`
  - `apps/api/src/middleware/require-admin.ts:4` and `apps/api/src/modules/admin/routes.ts:14` (duplicate)
  - `supabase/migrations/20260704000007_add_user_groups.sql` and `20260705000003_add_user_groups.sql`
- What is happening: Historical fix scripts and duplicated implementations persist.
- Why it matters: confusion about authoritative code; risk of running stale scripts.
- User / business impact: maintenance drag.
- Security / privacy / reliability impact: medium (duplicate authz logic can diverge).
- Recommended fix: archive/delete one-off scripts; consolidate duplicates.
- Suggested validation: no duplicate `requireAdmin` definitions; scripts removed.
- Owner suggestion: Maintainer
- Effort estimate: M
- Dependencies: ARCH-P3-005
- Status: open

### Finding ID: HYG-P3-003 - Unresolved TODO in operational metrics

- Severity: P3
- Confidence: High
- Area: HYG
- Evidence:
  - `apps/api/src/lib/metrics.ts:7` — `TODO: Configure alerting channels`
  - `apps/api/src/server.ts` — TODO present (git grep count 1)
- What is happening: Known gaps are left as inline TODOs.
- Why it matters: easy to forget; cross-ref OBS-P1-001.
- User / business impact: low.
- Security / privacy / reliability impact: low-medium.
- Recommended fix: convert to tracked issues.
- Suggested validation: TODO references an issue id.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: HYG-P3-004 - Encoding artifacts and inconsistent comments

- Severity: P3
- Confidence: High
- Area: HYG
- Evidence:
  - `README.md:7` `â€”`; `.env.example` `�?"`; `opencode_opacity_replacements.txt` (root)
- What is happening: mojibake in tracked text.
- Why it matters: readability; hints at tooling that rewrites files.
- User / business impact: low.
- Security / privacy / reliability impact: low.
- Recommended fix: normalize to UTF-8; remove tooling scratch files.
- Suggested validation: encoding check passes.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: INV-P3-001
- Status: open

## Risks

- Source-of-truth ambiguity; stale scripts run by mistake.

## Recommendations

1. Purge generated artifacts and one-off scripts.
2. Consolidate duplicates.

## Quick Wins

- Add `.gitignore` entries; delete scratch files.

## Hardening Backlog

- CONTRIBUTING guidance banning generated outputs.

## Suggested Tests

- CI repo-hygiene guard.

## Suggested Documentation Updates

- CONTRIBUTING: what may be committed.

## Open Questions

- Are the one-off scripts still referenced by any workflow? Searched workflows — no direct references observed.

## Appendix

- `scripts/` = 106 files; `hardening/` data store noted as disconnected in `AGENTS.md`.
