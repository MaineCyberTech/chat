    # Visual Regression Test Pack Prompt

    ## Objective
    Design a visual regression strategy for dark mode, responsive layouts, state variants, dialogs, drawers, and admin surfaces.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Desktop / tablet / mobile coverage

- Dark theme and contrast-sensitive states
- Overflow and content-dense screens
- High-value component/state snapshot coverage

  ## Required Special Checks
  - Screens critical to trust and polish

- Areas prone to frequent visual regressions
- Smoke vs comprehensive snapshot tiers

  ## Required Deliverables
  - Visual regression inventory

- Priority capture list
- Flake avoidance recommendations
- Review / triage guidance

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

  Use this pack to reduce accidental UI regressions before release certification.
