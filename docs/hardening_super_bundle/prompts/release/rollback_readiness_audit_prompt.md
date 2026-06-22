    # Rollback Readiness Audit Prompt

    ## Objective
    Evaluate whether a failed release can be reverted safely and quickly, including artifact rollback, data compatibility, and operator guidance.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Artifact versioning and previous release traceability

- DB rollback or forward-fix constraints
- Feature flag / kill-switch alternatives
- Operator rollback runbooks and validation steps

  ## Required Special Checks
  - Changes that cannot be safely rolled back

- Missing version pinning or previous artifact traceability
- Critical features without emergency stop paths

  ## Required Deliverables
  - Rollback trigger checklist

- Rollback feasibility summary
- Operator rollback notes
- Irreversible-change risk register

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

  Return **NO-GO** if rollback is operationally unclear, untested, or likely to cause extended outage/data risk.
