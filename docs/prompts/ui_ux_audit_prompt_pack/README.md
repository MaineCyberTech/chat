# Portal Frontend UI/UX Audit Prompt Pack

This pack is designed for an intelligent AI coding/review agent to perform a **UI/UX-specific audit** of the portal frontend.

## Scope

Focus on the portal frontend only. Treat backend or infrastructure details as supporting context only insofar as they affect frontend behavior.

## Goals

- Audit the portal frontend's UI/UX deeply and critically
- Preserve working functionality and user flows
- Improve visual polish, consistency, readability, accessibility, responsiveness, and enterprise usability
- Align with the strongest aspects of the current implementation and any superior patterns available from the reference repo
- Produce a safe, practical, implementation-ready roadmap

## Target areas

- information architecture
- navigation and shell layout
- dashboard design
- dark theme readability
- typography hierarchy
- spacing system
- forms and validation UX
- tables, lists, filters, search
- cards, panels, modals, drawers
- state feedback (loading, empty, error, success)
- component consistency
- accessibility and keyboard usability
- mobile/tablet responsiveness
- performance-perceived UX
- role-aware enterprise workflows

## Recommended Run Order

1. `00_GLOBAL_OPERATOR_INSTRUCTIONS.md`
2. `01_UI_UX_PHASE_1_FRONTEND_INVENTORY.md`
3. `02_UI_UX_PHASE_2_JOURNEY_AND_INFORMATION_ARCHITECTURE.md`
4. `03_UI_UX_PHASE_3_VISUAL_SYSTEM_AND_COMPONENT_CONSISTENCY.md`
5. `04_UI_UX_PHASE_4_ACCESSIBILITY_RESPONSIVENESS_AND_FEEDBACK.md`
6. `05_UI_UX_PHASE_5_COMPARATIVE_FINDINGS_AND_OPPORTUNITIES.md`
7. `06_UI_UX_PHASE_6_SAFE_REDESIGN_ROADMAP.md`
8. `07_UI_UX_PHASE_7_FILE_BY_FILE_FRONTEND_CHANGE_PLAN.md`
9. `08_UI_UX_PHASE_8_FINAL_FRONTEND_RECONCILIATION.md`

## Usage notes

- Feed the phases one at a time for higher quality.
- Require the agent to keep all working frontend behavior intact unless a change is explicitly justified.
- Require clear classification of findings:
  - keep current implementation
  - refine current implementation
  - adapt conceptually from reference repo
  - not worth changing
