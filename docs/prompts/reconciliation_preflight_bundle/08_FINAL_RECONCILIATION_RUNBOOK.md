# Final Reconciliation Runbook

Use this runbook when you are ready to execute the final reconciliation pass.

## Inputs to Prepare

- Compare audit report(s)
- UI/UX audit report(s)
- Reconciliation Input Index
- Do-Not-Break Guardrails
- Keep/Adapt/Skip Matrix
- Known Good Baseline
- Open Questions and Possible Conflicts
- Visual Baseline Index
- Priority Order

## Execution Guidance

1. Feed the reconciler the input inventory first.
2. Require it to inventory and normalize the artifacts.
3. Require explicit contradiction detection before synthesis.
4. Require guardrail and validation normalization before final recommendations.
5. Require a single-source-of-truth output with rejected/deferred items called out explicitly.

## Required Final Output Qualities

- No silent contradiction merging
- Clear what-to-do-now vs defer vs reject
- Clear risk normalization
- Clear do-not-break constraints
- Clear validation checklist
- Clear execution order

## Suggested Final Output Filename

`FINAL_RECONCILED_REPO_AUDIT.md`
