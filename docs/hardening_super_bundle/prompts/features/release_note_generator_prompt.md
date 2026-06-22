    # Release Note Generator Prompt

    ## Objective
    Design a generator that composes stakeholder-friendly and engineering-friendly release notes from audit results, severity deltas, readiness changes, and operator summaries.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Inputs from audit summaries and release reports

- Executive-friendly tone for stakeholders
- Technical delta section for engineering
- Rollback notes and post-release validation sections

  ## Required Special Checks
  - Explicit risk posture and audit decision in notes

- Separation of executive summary vs engineering detail
- Actionable post-release validation

  ## Required Deliverables
  - Release note schema

- Template guidance
- Required metadata fields
- CI/CD generation recommendations

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

  This upgrade should improve change communication quality and release transparency.
