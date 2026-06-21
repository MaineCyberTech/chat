# Maine CyberTech Reconciliation Example Bundle

This bundle is an **example-filled preflight/reconciliation pack** built from the evidence visible in the internal Repomix snapshots for the main and develop codebases.

## What this bundle is for

- Drive an AI or human reviewer through a safe reconciliation pass.
- Preserve what is already working.
- Focus review on places where the main/develop snapshots visibly differ.
- Provide templates for decisions, risks, and change control.

## What this bundle is _not_

- It is not a claim that the public GitHub repos are accessible from this environment.
- It is not a direct export of the repos.
- It does not contain private repository content beyond the internal evidence already surfaced in your tenant.

## Included files

- `00_EVIDENCE_SUMMARY.md`
- `01_RECONCILIATION_MASTER_PROMPT.md`
- `02_PRE_RECONCILIATION_CHECKLIST.md`
- `03_VISIBLE_DIFF_AREAS.md`
- `04_RISK_REGISTER_TEMPLATE.md`
- `05_DECISION_LOG_TEMPLATE.md`
- `06_CHAT_REPO_INTAKE_PLACEHOLDER.md`
- `bundle_manifest.json`

## Suggested use order

1. Read `00_EVIDENCE_SUMMARY.md`
2. Run the checklist in `02_PRE_RECONCILIATION_CHECKLIST.md`
3. Feed `01_RECONCILIATION_MASTER_PROMPT.md` to the auditing AI
4. Use `03_VISIBLE_DIFF_AREAS.md` as the initial comparison scope
5. Track changes in `04_RISK_REGISTER_TEMPLATE.md` and `05_DECISION_LOG_TEMPLATE.md`
