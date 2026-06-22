    # Policy Tiers Upgrade Prompt

    ## Objective
    Expand basic policy-driven gating into structured policy tiers for dev, release candidate, production, and hotfix release flows.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Policy file structure and inheritance strategy

- Workflow/environment mapping to policy tiers
- Hotfix exceptions and mandatory compensating controls
- Governance around policy changes and approvals

  ## Required Special Checks
  - Prevent hotfix policy from becoming a permanent bypass path

- Ensure policy changes are reviewable and auditable
- Align policy tiers with actual branch/environment strategy

  ## Required Deliverables
  - Policy tier architecture

- Recommended file layout and examples
- Workflow wiring recommendations
- Approval and auditability guidance

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

  Use this pack to move from static thresholds to governed release policy maturity.
