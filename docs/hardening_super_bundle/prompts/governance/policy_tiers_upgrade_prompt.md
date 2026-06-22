    # Policy Tiers Upgrade Prompt

    ## Objective
    Expand basic policy-driven gating into governed tiers for dev, release candidate, production, and hotfix flows.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Policy file structure and inheritance strategy

- Workflow/environment mapping to policy tiers
- Hotfix exceptions and compensating controls
- Approval and auditability of policy changes

  ## Required Special Checks
  - Hotfix policy becoming a bypass path

- Policy changes without reviewability
- Tier design that does not align with actual branch/environment strategy

  ## Required Deliverables
  - Policy tier architecture

- Recommended file layout and examples
- Workflow wiring recommendations
- Approval guidance

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

  Use this pack to move from static thresholds to governed release policy maturity.
