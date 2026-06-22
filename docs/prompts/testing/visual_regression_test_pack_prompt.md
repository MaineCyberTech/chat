    # Visual Regression Test Pack Prompt

    ## Objective
    Design a visual regression strategy for dark mode, responsive layouts, empty/loading/error states, chat views, settings, drawers, dialogs, and admin surfaces.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Desktop/tablet/mobile coverage

- Dark theme and contrast-sensitive states
- Long names, overflow behavior, and content-dense screens
- High value component/state snapshot coverage

  ## Required Special Checks
  - Identify screens that are visually critical to trust and polish

- Call out cases prone to frequent visual regressions
- Group snapshots into smoke vs comprehensive tiers

  ## Required Deliverables
  - Visual regression inventory

- Priority capture list
- Flake avoidance recommendations
- Review / triage guidance

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

  Use this pack to reduce accidental UI regressions before release certification.
