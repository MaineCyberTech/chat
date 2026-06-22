# Final Quality Confirmation Usage Note

## When to use this prompt

Use `final_full_repo_deep_dive_quality_confirmation_prompt.md` when you want the strongest final repo-wide review.

It is best used after:

- the main platform work is complete
- major frontend/UX work is complete or stable enough to audit
- reconciliation and/or principal audit work has already happened
- you want a final summary of defects, fixes, residual risk, and a release-style decision

## What makes it different

This prompt requires the AI to produce:

- a severity-based findings model
- a summary table of findings
- category checklists
- a release / quality decision
- a clearer go/no-go style conclusion

## Operator recommendation

Treat unresolved `P0` findings as blocking.  
Treat significant unresolved `P1` findings as serious risk requiring a conscious acceptance decision.
