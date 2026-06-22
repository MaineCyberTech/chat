# Production Promotion Workflow

## Goal

Decide whether a release candidate can be promoted to production.

## Inputs

- current run summary
- production policy file
- promotion branch name
- rollback plan
- sign-offs

## Steps

1. Confirm latest audit evidence is still current.
2. Apply `gate-policy.prod.json`.
3. Confirm source branch is allowed.
4. Confirm rollback readiness and emergency controls.
5. Confirm sign-offs.
6. Generate promotion gate result.
7. Decide:
   - GO to production
   - STOP and remediate
   - Escalate for executive decision

## Minimum pass expectations

- no P0
- no P1 unless explicitly outside policy/handled differently
- production readiness threshold met
- authorized source branch
