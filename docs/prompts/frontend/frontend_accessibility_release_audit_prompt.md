    # Frontend Accessibility Release Audit Prompt

    ## Objective
    Evaluate the application for release-grade accessibility risks, including keyboard support, focus management, labeling, structure, contrast, announcements, and motion preferences.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Keyboard-only navigation and focus visibility

- Modal/drawer/toast accessibility behavior
- Screen reader labels and ARIA correctness
- Contrast in dark mode, zoom behavior, and reduced motion support

  ## Required Special Checks
  - Flag any inaccessible critical path such as sign-in, navigation, message compose, attachments, settings, or admin pages

- Flag any hidden focus trap or invisible focus state
- Flag any severe contrast issue in the chosen dark theme

  ## Required Deliverables
  - Accessibility defect register

- Keyboard path walkthrough summary
- Priority fix list for release
- Final accessibility release decision

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

  Return **NO-GO** if critical user flows are not keyboard-accessible or if severe contrast / screen-reader defects block core usage.
