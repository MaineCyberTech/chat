    # Backup and Restore Verification Audit Prompt

    ## Objective
    Assess whether backup, restore, and verification procedures are adequate to recover from data loss, corruption, or failed migrations.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Backup success evidence and scope

- Restore procedure clarity and restore testing evidence
- Recovery time assumptions and integrity validation method
- Tenant-scoped restore considerations and file/document restore coverage

  ## Required Special Checks
  - Flag any backup path without validation evidence

- Flag restores that cannot prove integrity after recovery
- Flag any major asset type not covered by backup strategy

  ## Required Deliverables
  - Backup/restore readiness summary

- Recovery risk register
- Recommended restore drill cadence
- Final backup/restore confidence statement

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

  Return **NO-GO** if backup or restore confidence is insufficient for production data protection expectations.
