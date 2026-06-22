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
