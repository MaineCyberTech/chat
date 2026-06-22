    # Backup and Restore Verification Audit Prompt

    ## Objective
    Assess whether backup, restore, and integrity verification procedures are sufficient for production recovery confidence.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Backup success evidence and scope

- Restore procedure clarity and test evidence
- Recovery time assumptions and validation method
- Tenant/file/document restore coverage

  ## Required Special Checks
  - Backup paths without validation evidence

- Restores that cannot prove integrity
- Major asset types not covered by backup strategy

  ## Required Deliverables
  - Backup/restore readiness summary

- Recovery risk register
- Recommended restore drill cadence
- Final confidence statement

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

  Return **NO-GO** if backup or restore confidence is insufficient for production data protection expectations.
