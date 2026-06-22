# Audit Run Order

## Recommended sequence

### Step 1 — Final reconciliation

Run:

- `final_reconciliation_repo_audit_prompt.md`

Purpose:

- normalize cross-phase inconsistencies
- repair obvious import/script/env/doc drift
- clean the repo before deeper assessment

### Step 2 — Principal audit

Run:

- `final_reconciliation_principal_audit_prompt.md`

Purpose:

- classify repo-wide findings by severity
- determine whether major risks still remain
- evaluate release-readiness categories

### Step 3 — Full deep-dive quality confirmation

Run:

- `final_full_repo_deep_dive_quality_confirmation_prompt.md`

Purpose:

- perform the broadest final inspection
- generate the summary table of findings
- generate per-category checklists
- produce the final GO / GO WITH RISKS / NO-GO decision

## Operator guidance

Do not skip directly to the full quality confirmation prompt if the repo still contains obvious drift that reconciliation should fix first.
