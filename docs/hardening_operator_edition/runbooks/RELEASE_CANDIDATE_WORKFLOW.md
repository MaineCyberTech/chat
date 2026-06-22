# Release Candidate Workflow

## Goal

Decide whether a build or branch is fit to become a release candidate.

## Inputs

- current audit reports
- current run summary
- RC policy file
- risk register
- draft release notes

## Steps

1. Ensure Phase 1 and Phase 2 audits are current.
2. Review open findings and ensure no P0 remains.
3. Apply `gate-policy.rc.json`.
4. Generate gate evidence.
5. Update release candidate report and stakeholder summary.
6. Decide:
   - GO to RC
   - GO WITH RISKS to RC (only if policy allows)
   - NO-GO

## Required artifacts

- current run summary
- gate result
- release-candidate checklist
- stakeholder-facing summary
