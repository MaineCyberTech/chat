    # Observability and Incident Readiness Audit Prompt

    ## Objective
    Evaluate whether operators can detect, diagnose, and respond to failures using logs, traces, health checks, alerting, and runbooks.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Structured logging and error taxonomy

- Trace/correlation IDs across tiers
- Health/readiness/liveness endpoints
- Audit logging and incident response runbooks

  ## Required Special Checks
  - Major failure modes that cannot be diagnosed quickly

- Missing health checks that hinder deployment/recovery
- Inconsistent error semantics that block triage

  ## Required Deliverables
  - Observability gap register

- Operator blind-spot summary
- Telemetry and alerting upgrades
- Incident readiness final decision

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

  Return **NO-GO** if operators lack visibility into critical auth, API, worker, or realtime failures.
