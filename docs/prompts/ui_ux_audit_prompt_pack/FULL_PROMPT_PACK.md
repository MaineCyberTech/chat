# Full Portal Frontend UI/UX Audit Prompt Pack

---

# Global Operator Instruction — Portal Frontend UI/UX Audit

Treat the portal frontend as production-sensitive. Visual regressions, broken interactions, degraded accessibility, and workflow disruption are unacceptable unless explicitly justified, risk-assessed, and mitigated.

You are acting as an elite principal product designer, senior UX architect, frontend staff engineer, design systems reviewer, accessibility auditor, and enterprise application modernization specialist.

You are reviewing:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo in context

Your goal is to deeply audit the **portal frontend UI/UX** and identify where the current frontend can be safely improved or more closely aligned to better patterns without breaking what already works.

You must:

- be highly detailed and evidence-driven
- focus on frontend UX, visual system, interaction model, responsiveness, accessibility, and perceived performance
- distinguish facts from hypotheses
- preserve working user flows
- prefer incremental refinement over disruptive redesign

Always classify important findings as:

- keep current implementation
- refine current implementation
- adapt conceptually from reference repo
- not worth changing

Always call out:

- benefits
- UX risk
- regression risk
- accessibility implications
- implementation complexity
- component blast radius
- testing/QA needs
- visual review needs

Never recommend frontend churn purely for aesthetics.
Never break current information architecture, route semantics, auth-dependent flows, or critical user journeys without explicitly warning about the risk.

## Core evaluation lens

Audit the frontend through these lenses:

- clarity
- consistency
- readability
- affordance
- enterprise usability
- accessibility
- responsiveness
- visual hierarchy
- efficiency of user workflows
- trust and polish
- maintainability of the component system

---

# UI/UX Phase 1 — Frontend Inventory and Structural Baseline

## Purpose

Create a detailed inventory of the portal frontend before making recommendations.

## Prompt

Perform Phase 1 only: inventory and structural baseline for the portal frontend.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Focus on the **frontend only**, including any shared UI packages used by the frontend.

Inspect and inventory:

- app shell structure
- route structure
- layout hierarchy
- page/feature organization
- component directories
- design-system-related files
- theme and styling tokens
- CSS/Tailwind/module styling structure
- iconography usage
- form components
- table/list/filter/search components
- dashboard widgets
- modal/drawer/popover patterns
- navigation components
- auth-gated UI areas
- loading/empty/error state components
- frontend test structure
- storybook/design docs if present

Required output sections:

1. Frontend Inventory — Reference Repo
2. Frontend Inventory — Current Repo
3. Structural Similarities
4. Structural Differences
5. Major User-Facing Areas
6. Likely Fragile or High-Churn UI Areas
7. Unknowns for Later Phases

Do not recommend redesigns yet.
This phase is baseline only.

---

# UI/UX Phase 2 — User Journeys and Information Architecture

## Purpose

Audit how the portal frontend organizes journeys, navigation, task flow, and page hierarchy.

## Prompt

Perform Phase 2 only: user journeys and information architecture analysis.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Audit the frontend experience around:

- primary navigation
- secondary navigation
- dashboard entry points
- page hierarchy
- route discoverability
- breadcrumbs/tab structures if present
- workflow clarity
- task completion efficiency
- search/filter entry and refinement
- cross-page consistency
- density vs clarity balance
- admin vs standard-user affordances if visible

For both repos, assess:

- what major user journeys appear to exist
- how discoverable they are
- where users may hesitate or get lost
- where navigation or page structure is particularly strong
- where one repo is clearly more usable than the other

Required output sections:

1. Major User Journeys
2. Information Architecture Comparison
3. Navigation Strengths
4. Navigation Friction Points
5. Workflow Efficiency Findings
6. Similarity Opportunities
7. Areas That Should Not Be Reorganized Without Strong Justification

---

# UI/UX Phase 3 — Visual System, Component Consistency, and Design Language

## Purpose

Audit the visual system and component discipline of the portal frontend.

## Prompt

Perform Phase 3 only: visual system and component consistency analysis.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Evaluate:

- typography hierarchy
- spacing system
- visual hierarchy
- density/readability tradeoffs
- dark theme readability
- color usage and semantic states
- card/panel consistency
- button styles
- input/select/form consistency
- table/list consistency
- modal/drawer consistency
- status badge/chip conventions
- icon usage
- empty state patterns
- microcopy consistency
- enterprise polish and trustworthiness

Required output sections:

1. Visual Language Comparison
2. Component System Strengths in Reference Repo
3. Component System Strengths in Current Repo
4. Inconsistencies to Address
5. Dark Theme and Readability Findings
6. High-Value Standardization Opportunities
7. Areas Where Forced Uniformity Would Be Counterproductive

---

# UI/UX Phase 4 — Accessibility, Responsiveness, Feedback States, and Perceived Performance

## Purpose

Audit whether the frontend is accessible, responsive, and communicative during user actions.

## Prompt

Perform Phase 4 only: accessibility, responsiveness, state feedback, and perceived performance analysis.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Evaluate:

- semantic structure hints if visible in code
- keyboard navigation patterns
- focus state visibility
- contrast/readability
- form label/help/error quality
- error feedback clarity
- loading states and skeletons/spinners
- empty states and recovery guidance
- success/confirmation feedback
- mobile responsiveness
- tablet responsiveness
- overflow/scroll behavior
- perceived performance patterns
- data density on smaller screens
- responsiveness of tables and navigation

Required output sections:

1. Accessibility Strengths
2. Accessibility Risks
3. Responsive Design Findings
4. Feedback State Findings
5. Perceived Performance Findings
6. High-Priority UX Safety Fixes
7. Items Requiring Manual/Visual QA Before Change

---

# UI/UX Phase 5 — Comparative Findings and Improvement Opportunities

## Purpose

Identify the best frontend UI/UX ideas worth preserving, refining, or adapting.

## Prompt

Perform Phase 5 only: comparative frontend findings and improvement opportunities.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Using earlier analysis, determine:

- what the reference repo does better from a UI/UX perspective
- what the current repo already does better and should keep
- what can be adapted safely
- what should not be changed because the current experience is already sound
- what improvements would most improve enterprise UX quality with the least risk

Required output sections:

1. Overall Frontend UI/UX Judgment
2. Best Ideas Worth Adapting from Reference Repo
3. Current-Repo Frontend Strengths to Preserve
4. Highest-Value UX Improvements
5. Low-Risk UI Consistency Wins
6. Risky UX Changes to Avoid Early
7. Keep / Refine / Adapt / Skip Matrix

---

# UI/UX Phase 6 — Safe Redesign and Refinement Roadmap

## Purpose

Create a phased plan to improve the portal frontend safely.

## Prompt

Perform Phase 6 only: build a safe UI/UX refinement roadmap for the portal frontend.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Design a conservative roadmap that:

- improves UI clarity and polish
- increases consistency
- improves accessibility and responsiveness
- preserves working flows
- minimizes visual regression risk
- supports incremental delivery

Organize the roadmap into phases, for example:

- Phase 0: observation and design constraints
- Phase 1: no-risk visual consistency cleanup
- Phase 2: low-risk component standardization
- Phase 3: medium-risk page/layout refinements
- Phase 4: optional advanced UX modernization

Required output sections:

1. Roadmap Summary
2. Immediate Low-Risk Visual Wins
3. Low-Risk Component Consistency Improvements
4. Medium-Risk Layout or Workflow Refinements
5. Accessibility and Responsiveness Priorities
6. What Must Stay As-Is
7. Recommended Sequence
8. Validation Gates Before Each Phase

---

# UI/UX Phase 7 — File-by-File Frontend Change Plan

## Purpose

Translate the frontend roadmap into implementation-oriented guidance.

## Prompt

Perform Phase 7 only: create a file-by-file / area-by-area frontend UI/UX change plan.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Based on the previous phases, identify the most likely frontend files, directories, components, pages, layouts, styling tokens, and shared UI utilities that should be touched first.

Required output sections:

1. Highest-Priority Frontend Targets
2. Safest Files/Areas to Touch First
3. Fragile Frontend Areas to Avoid Early
4. Component Standardization Candidates
5. Layout/Shell Refinement Candidates
6. Form/Table/Search UX Candidates
7. Theme/Styling Cleanup Candidates
8. Test and Visual QA Requirements Before Refactor
9. Safe Patch Grouping Proposal
10. Rollback-Sensitive Areas

Use the most specific verified paths or modules available.

---

# UI/UX Phase 8 — Final Frontend Reconciliation

## Purpose

Produce one authoritative frontend UI/UX audit and action plan.

## Prompt

Perform Phase 8 only: final frontend UI/UX reconciliation and single-source-of-truth report.

Repos:

1. Reference repo: `C:\temp\mainecybertechportal`
2. Current active repo

Synthesize all earlier frontend UI/UX phases into one final report.

Required final output sections:

1. Executive Summary
2. Frontend Architecture and UX Overview
3. Information Architecture Findings
4. Visual System and Component Findings
5. Accessibility and Responsiveness Findings
6. Best Patterns Worth Adapting
7. Current Frontend Strengths to Preserve
8. Risk Register
9. Safe UI/UX Roadmap
10. File/Area Change Recommendations
11. Do-Not-Break Guardrails
12. Validation Checklist
13. Final Recommendation

Tone: principal-level, highly practical, conservative about regressions, and explicit about tradeoffs.
