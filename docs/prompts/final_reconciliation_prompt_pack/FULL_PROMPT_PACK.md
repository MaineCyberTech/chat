# Full Final Reconciliation Prompt Pack

---

# Global Operator Instruction — Final Reconciliation

You are performing a strict final reconciliation pass over previously generated audit artifacts, recommendations, change plans, and roadmap outputs.

Treat all earlier outputs as potentially useful but not automatically correct.
Your job is to detect inconsistency, unsupported claims, hidden migration risks, conflicting recommendations, missing prerequisites, and contradictions in sequencing.

You must:

- be skeptical and evidence-driven
- normalize conflicting terminology
- identify omitted dependencies
- detect duplicate or contradictory remediation items
- verify that risk levels, roadmap phases, and validation steps are internally consistent
- preserve production safety as the primary constraint

Never merge conflicting recommendations silently.
Always surface contradictions explicitly.
Always distinguish between:

- confirmed consistent
- partially consistent
- inconsistent
- unsupported / insufficiently evidenced

Your final output must produce a single source of truth that is practical, non-contradictory, risk-aware, and implementation-safe.

---

# Final Reconciliation Phase 1 — Audit Artifact Intake and Inventory

## Purpose

Inventory all prior audit documents and normalize their scope before reconciliation.

## Prompt

Perform Final Reconciliation Phase 1 only: inventory all prior audit artifacts.

Gather and inventory the previously generated reports, such as:

- repo inventory reports
- mapping reports
- strengths/weaknesses findings
- risk analyses
- roadmap documents
- file-by-file change plans
- patch set plans
- frontend UI/UX audit outputs
- any other related implementation recommendations

Required output sections:

1. Artifact Inventory
2. Apparent Scope of Each Artifact
3. Overlapping Subject Areas
4. Gaps in Artifact Coverage
5. Artifacts Most Likely to Conflict
6. Terminology That Needs Normalization

Do not reconcile yet. This phase is intake and scoping only.

---

# Final Reconciliation Phase 2 — Contradictions, Duplicates, and Drift Detection

## Purpose

Identify conflicting recommendations and drift between outputs.

## Prompt

Perform Final Reconciliation Phase 2 only: contradiction and drift detection.

Compare prior artifacts and detect:

- direct contradictions
- subtle recommendation drift
- duplicated recommendations framed differently
- mismatched risk ratings
- mismatched sequencing
- places where one artifact says keep while another says refactor
- unsupported claims repeated across outputs
- conflicting assumptions about stability, dependencies, or tests

Required output sections:

1. Direct Contradictions
2. Soft Contradictions / Drift
3. Duplicate Recommendations
4. Risk Rating Inconsistencies
5. Sequencing Inconsistencies
6. Unsupported or Weakly Supported Claims
7. Items Requiring Human Review Before Acceptance

---

# Final Reconciliation Phase 3 — Guardrail, Risk, and Validation Normalization

## Purpose

Unify risk, guardrails, and validation expectations across all prior outputs.

## Prompt

Perform Final Reconciliation Phase 3 only: normalize risks, guardrails, and validation requirements.

Based on prior artifacts, produce a normalized set of:

- do-not-break guardrails
- test prerequisites
- manual QA expectations
- visual QA expectations
- deployment/environment safety checks
- rollback expectations
- change approval thresholds

Required output sections:

1. Unified Do-Not-Break Guardrails
2. Unified Risk Model
3. Tests Required Before High-Risk Changes
4. Manual / Visual QA Requirements
5. Deployment and Environment Safety Requirements
6. Rollback and Recovery Expectations
7. Minimum Acceptance Criteria for Implementation Work

---

# Final Reconciliation Phase 4 — Single Source of Truth Synthesis

## Purpose

Produce one authoritative final report.

## Prompt

Perform Final Reconciliation Phase 4 only: synthesize a single-source-of-truth final report from all prior artifacts.

The final report must:

- resolve contradictions explicitly
- remove duplicated recommendations
- preserve only the strongest, most defensible recommendations
- align roadmap sequencing with actual risk and prerequisites
- keep production safety as the top priority
- clearly identify what to do now, what to defer, and what not to touch

Required final output sections:

1. Executive Summary
2. Scope and Inputs Considered
3. Reconciled Findings
4. Reconciled Best Recommendations
5. Reconciled Risk Register
6. Reconciled Roadmap and Execution Order
7. Reconciled File/Area Priorities
8. Unified Do-Not-Break Guardrails
9. Unified Validation Checklist
10. Items Deferred or Rejected
11. Remaining Unknowns
12. Final Recommendation
