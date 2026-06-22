    # Feature Flag and Kill Switch Framework Prompt

    ## Objective
    Design a feature-flag and emergency kill-switch framework for gradual rollout and rapid production shutdown of risky capabilities.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Flag model, naming, ownership, and environments

- Kill-switch coverage for risky features such as attachments, notifications, realtime, and expensive operations
- Operator controls, auditability, and rollout strategy
- Fallback UX when disabled at runtime

  ## Required Special Checks
  - Features that can cause outage or major UX harm if they fail

- Tenant-specific and phased rollout needs
- Stale flag governance risk

  ## Required Deliverables
  - Framework design proposal

- Flag category and naming recommendation
- Kill-switch coverage matrix
- Operator emergency-use notes

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

  Use this framework to reduce blast radius and improve rollback flexibility.
