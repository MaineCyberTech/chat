# release operator edition

this is the **day-of-use condensed operator guide** for running release-style checks.

## primary purpose

use this operator edition when the repository or frontend is approaching a serious review gate and you want the shortest practical run order.

## recommended release-track sequence

### repo release track

1. run `prompts/platform/audits/final_reconciliation_repo_audit_prompt.md`
2. fix any obvious failures
3. run `prompts/platform/audits/final_reconciliation_principal_audit_prompt.md`
4. treat p0 and p1 findings as gating issues

### frontend release track

1. run `prompts/uxui/audits/frontend_ux_release_gate_principal_audit_prompt.md`
2. fix all p0 findings
3. fix critical p1 findings
4. rerun the frontend release gate prompt

## hard stop conditions

stop and escalate if:

- build/typecheck/test failures remain unresolved and actionable
- environment/domain usage drifts from the `.us` / `.com` model
- auth/origin/security assumptions are inconsistent
- workflows/scripts are broken or mismatched
- the frontend still fails accessibility basics on primary flows
- the frontend still fails responsive readiness on key surfaces

## minimum release questions

- is the repo internally coherent?
- is the environment model preserved?
- are p0 issues eliminated?
- are remaining p1 issues understood and explicitly accepted?
- is the frontend readable, accessible enough, and responsive enough on primary use paths?
