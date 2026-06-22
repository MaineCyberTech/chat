    # Frontend Accessibility Release Audit Prompt

    ## Objective
    Evaluate keyboard support, focus management, labeling, contrast, announcements, and motion preferences for release-grade accessibility.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Keyboard-only navigation and focus visibility

- Modal/drawer/toast accessibility behavior
- Screen reader labels and ARIA correctness
- Dark mode contrast, zoom, and reduced motion support

  ## Required Special Checks
  - Inaccessible critical flows such as sign-in, navigation, compose, attachments, settings

- Hidden focus traps or invisible focus states
- Severe contrast issues in dark mode

  ## Required Deliverables
  - Accessibility defect register

- Keyboard path walkthrough summary
- Priority fix list for release
- Final accessibility release decision

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

  Return **NO-GO** if core flows are not keyboard-accessible or severe defects block core usage.
