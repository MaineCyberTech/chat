    # End-to-End Scenario Suite Design Prompt

    ## Objective
    Design a release-grade end-to-end scenario suite covering core user journeys, negative paths, auth/permission flows, and long-session chat behaviors.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Sign in/out, first-run, empty states, create conversation, send message, reconnect after refresh

- Unread counts, attachments, denied permissions, tenant switching, settings changes
- Offline/degraded state handling and long transcript behavior
- Critical release smoke suite for PR and pre-release execution

  ## Required Special Checks
  - Ensure core product journeys are represented end-to-end

- Call out fixture and test-data requirements
- Separate fast smoke scenarios from slower comprehensive flows

  ## Required Deliverables
  - Scenario matrix

- Smoke vs full-suite grouping
- High-risk scenario prioritization
- Suggested CI execution tiers

  ## Severity Model
  - **P0** — blocking production risk or high-confidence exploit / outage path
  - **P1** — major production risk likely to materially impact users, operators, or release confidence
  - **P2** — moderate issue that should be fixed soon but is not immediate release-blocking in isolation
  - **P3** — low-severity cleanup / optimization / documentation issue

  ## Output Format Requirements
  1. Executive summary
  2. Summary table of findings
  3. Detailed findings by category
  4. Remediation plan by urgency
  5. Operator handoff notes
  6. Final domain decision

  ## Final Decision Rule

  Do not issue a release confidence upgrade unless the essential smoke suite covers critical user flows.
