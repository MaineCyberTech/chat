# Rollback and Containment Workflow

## Goal

Provide a deterministic operator path when a release must be contained or reversed.

## Trigger examples

- critical auth failure
- tenant isolation concern
- DB migration fallout
- major chat/realtime breakage
- severe production alerting after release

## Decision path

1. Can a kill-switch or feature flag contain impact safely?
2. If not, is rollback feasible without unacceptable data loss?
3. If neither is acceptable, escalate for forward-fix decisioning.

## Required artifacts

- rollback decision record
- incident notes
- previous artifact/version reference
- post-rollback validation checklist
