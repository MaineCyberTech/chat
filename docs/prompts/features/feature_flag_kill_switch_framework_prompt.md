    # Feature Flag and Kill Switch Framework Prompt

    ## Objective
    Design a feature-flag and emergency kill-switch framework so risky capabilities can be rolled out gradually and disabled quickly in production.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Feature flag model, naming, ownership, and environments

- Kill-switch coverage for high-risk features such as attachments, notifications, realtime, and expensive queries
- Operator controls, auditability, and rollout strategy
- Fallback UX when a feature is disabled at runtime

  ## Required Special Checks
  - Require flags for features that can cause outage or poor experience if they fail

- Account for tenant-specific and phased rollouts
- Prevent stale flags from becoming ungoverned permanent complexity

  ## Required Deliverables
  - Framework design proposal

- Recommended flag categories and naming conventions
- Kill-switch coverage matrix
- Operator runbook notes for emergency use

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

  Use this framework to reduce release blast radius and improve rollback flexibility.
