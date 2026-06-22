    # Security Principal Audit Prompt

    ## Objective
    Perform a deep security review of the repository, auth boundaries, tenant isolation, secret handling, and abuse controls.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Authentication, session, token, and cookie handling

- Authorization, role gating, admin surfaces, and tenant isolation
- Environment secrets and accidental exposure risk
- CORS, CSRF, trust boundaries, webhook verification, and unsafe defaults
- Sensitive logging and dependency risk posture

  ## Required Special Checks
  - Cross-tenant leakage or identifier guessing paths

- Local-only debug assumptions leaking into production
- Developer bypasses or exceptions bleeding into production
- Missing rate limits or replay protections

  ## Required Deliverables
  - Security findings table with P0/P1/P2/P3 severities

- Exploitability / impact comments for major issues
- Immediate vs deferred mitigation plan
- Final GO / GO WITH RISKS / NO-GO recommendation

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

  Return **NO-GO** if any high-confidence privilege escalation, data exposure, or cross-tenant leakage exists.
