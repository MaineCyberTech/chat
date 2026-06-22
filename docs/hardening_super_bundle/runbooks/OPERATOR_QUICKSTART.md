# Operator Quickstart

## Fast start

1. Pick the highest-priority audit prompt from the phase plan.
2. Run the audit against the repo in execution mode.
3. Record findings using `templates/domain_audit_report.template.md`.
4. Build a risk register using `templates/risk_register.template.md`.
5. Use the matching checklist from `checklists/`.
6. If you are gating promotions, update the relevant policy JSON.
7. Run the gate scripts or CI workflows.

## Policy-aware gates

- PR / dev gate uses `policies/gate-policy.dev.json`
- release candidate gate uses `policies/gate-policy.rc.json`
- prod promotion gate uses `policies/gate-policy.prod.json`
- hotfix gate uses `policies/gate-policy.hotfix.json`

## Minimum operator outputs per audit

- one principal report
- one concise summary for stakeholders
- one remediation plan
- one final GO / GO WITH RISKS / NO-GO recommendation
