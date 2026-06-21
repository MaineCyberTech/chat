# Reconciliation Master Prompt

You are performing a **safe, non-breaking reconciliation** for the Maine CyberTech platform.

## Mission

Compare the currently checked-out working repository against the evidence summarized in this bundle and reconcile drift **without breaking existing working behavior**.

## Primary objectives

1. Preserve current working behavior first.
2. Identify visible structural, workflow, docs, tooling, and process differences.
3. Distinguish between:
   - already present and correct
   - missing but desirable
   - intentionally different and should remain different
   - risky to change without human approval
4. Produce repo-ready output and a conservative plan.

## Hard constraints

- Do not rewrite the repo wholesale.
- Do not remove working implementation simply to achieve cosmetic parity.
- Do not change public interfaces, deployment flows, auth paths, environment contracts, or schema assumptions unless you can prove the change is safe.
- If a difference concerns deployment, auth, infra, secrets, migrations, or environment routing, classify it as high-scrutiny.

## Minimum deliverables

- A reconciliation inventory grouped by area:
  - CI/CD
  - API
  - Web
  - Worker
  - Docs
  - Infra/Terraform
  - Supabase
  - Scripts/tooling
  - Shared packages
- A change plan with three categories:
  - apply now
  - apply after verification
  - defer / needs approval
- A risk table with impact, likelihood, blast radius, rollback path
- A final list of concrete files to touch
- A list of files explicitly left alone and why

## Required analysis sequence

1. Inventory the current repo.
2. Compare against `03_VISIBLE_DIFF_AREAS.md`.
3. Mark each difference as one of:
   - keep current
   - adopt from reference pattern
   - merge carefully
   - defer
4. Identify any migrations, CI workflows, deployment scripts, seed data, docs, or infra changes that require special handling.
5. Produce a smallest-safe-change plan.
6. Only then generate edits.

## Output format

Return:

1. Executive summary
2. Evidence-backed diff categories
3. Proposed edits by file path
4. Risk table
5. Verification checklist
6. Rollback checklist

## Special note on chat repo

If the `chat` repository contents are not available to you, do **not** fabricate comparison results. Instead:

- record it as an unavailable input
- create a placeholder integration plan
- continue with the main/develop reconciliation scope
