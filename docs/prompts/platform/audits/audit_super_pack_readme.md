# Audit Super-Pack Readme

This directory contains the final end-of-process audit prompts for deep repo review.

## Prompt roles

### `final_reconciliation_repo_audit_prompt.md`

Use for broad cross-phase normalization and repair.

### `final_reconciliation_principal_audit_prompt.md`

Use for severity-based principal review with release-readiness framing.

### `final_full_repo_deep_dive_quality_confirmation_prompt.md`

Use for the most comprehensive endgame run. This prompt requires:

- severity rating system
- summary table of findings
- checklist for each audit category
- final GO / GO WITH RISKS / NO-GO style decision

### `audit_run_order.md`

Use as a quick operator guide for how to run these prompts in sequence.
