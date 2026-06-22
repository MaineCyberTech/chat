    # End-to-End Scenario Suite Design Prompt

    ## Objective
    Design a release-grade E2E suite covering core journeys, negative paths, auth/permission flows, and long-session chat behavior.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Sign in/out, first-run, create/send flows, reconnect after refresh

- Unread counts, attachments, denied permissions, tenant switching, settings changes
- Offline/degraded state handling and long transcript behavior
- Critical release smoke suite vs full suite

  ## Required Special Checks
  - Coverage of core product journeys

- Fixture and test-data requirements
- Fast smoke vs slower comprehensive grouping

  ## Required Deliverables
  - Scenario matrix

- Smoke vs full-suite grouping
- High-risk scenario prioritization
- Suggested CI execution tiers

  ## Severity Model
  - **P0** — blocking production risk, exploit path, or outage path
  - **P1** — major production risk with material user/operator impact
  - **P2** — moderate issue that should be remediated soon
  - **P3** — low-severity cleanup or optimization issue

  ## Required Output Structure
  1. Executive summary
  2. Findings summary table
  3. Detailed findings by category
  4. Remediation plan by urgency
  5. Operator handoff notes
  6. Final domain decision

  ## Final Decision Rule

  Do not claim strong release confidence unless the essential smoke suite covers critical user flows.
