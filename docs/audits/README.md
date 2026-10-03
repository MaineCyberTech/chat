# Audit Data Directory

## Purpose

Store audit runs, parsed summaries, diffs, dashboards, release reports, PR summaries, and stakeholder exports.

## Structure

- `runs/<run_id>/` — one folder per audit cycle
- `dashboard/` — generated KPI charts and the richer markdown homepage
- `templates/` — release / stakeholder templates
- `schema/` — stage summary schema

## Standard audit stage order

1. `reconciliation`
2. `principal_audit`
3. `quality_confirmation`
4. `frontend_release_gate`

## Authoritativeness

Artifacts under `docs/audits/**` are **historical snapshots** captured at the commit and date
recorded inside each report. They describe what was observed then — they are not a statement
about the current repository state. Do not read a report's "ALL CLEAN" / "0 P0, 0 P1" verdict as
the current status.

The current status must be derived from the audit pipeline's machine-readable output
(`findings.json` plus the run's `RELEASE_GATE.md`) and must record the commit it was generated
from. Hand-written status claims that are not stamped with a commit are non-authoritative.
