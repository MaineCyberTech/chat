# Final Full Repo Audit / Quality Confirmation Bundle

This bundle contains a repo-ready, drop-in deep-dive audit prompt designed for a final comprehensive quality confirmation run.

## Included Files

- `docs/prompts/platform/audits/final_full_repo_deep_dive_quality_confirmation_prompt.md`
- `docs/prompts/platform/audits/README.md`
- `docs/prompts/operator/final_quality_confirmation_usage.md`

## What This Prompt Adds

Compared to the earlier reconciliation and principal audit prompts, this prompt adds:

- a full deep-dive repo-wide audit posture
- a formal severity rating system (`P0` / `P1` / `P2` / `P3`)
- a required summary table of findings
- a required checklist for each audit category
- a final `GO` / `GO WITH RISKS` / `NO-GO` decision

## Suggested Usage

Use this after:

1. platform phases are complete
2. repo reconciliation has been run
3. principal audit has been run or the repo is otherwise close to a final review state

Best place in repo:

- `docs/prompts/platform/audits/`
