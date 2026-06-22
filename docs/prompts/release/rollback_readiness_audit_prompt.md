    # Rollback Readiness Audit Prompt

    ## Objective
    Evaluate operational readiness to revert a failed release quickly and safely, including application artifact rollback, data compatibility, feature flag fallback, and operator documentation.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Artifact versioning and deploy rollback path

- Database rollback or forward-fix constraints
- Feature flag or kill-switch alternatives
- Operator runbooks, communication templates, and validation steps
- Post-rollback consistency and user-impact checks

  ## Required Special Checks
  - Flag any change that cannot be safely rolled back without data loss or a maintenance event

- Flag any release path that lacks version pinning or previous artifact traceability
- Flag any critical feature without emergency stop / kill-switch capability

  ## Required Deliverables
  - Rollback trigger checklist

- Rollback feasibility summary
- Operator rollback runbook notes
- Risk register for irreversible or difficult-to-reverse changes

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

  Return **NO-GO** if rollback is operationally unclear, untested, or likely to cause extended outage or irreversible data risk.
