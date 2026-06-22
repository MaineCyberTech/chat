    # Environment Drift Audit Prompt

    ## Objective
    Compare environment assumptions across development, release, and production to identify deployment and auth-breaking drift.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Environment variables and secret names

- Domains, callbacks, cookies, CORS origins, websocket endpoints, webhooks
- Feature flags and environment-specific toggles
- Deployment targets and branch/environment mappings

  ## Required Special Checks
  - Values present in one environment but not another where parity matters

- Domain mismatches that break sign-in, cookies, or API routing
- Naming drift that can cause operator targeting mistakes

  ## Required Deliverables
  - Drift matrix by environment

- Blocking vs informational drift list
- Normalization plan
- Promotion readiness statement

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

  Return **NO-GO** if drift can break auth or produce unsafe release behavior.
