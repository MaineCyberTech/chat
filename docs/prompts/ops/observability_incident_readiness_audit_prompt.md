    # Observability and Incident Readiness Audit Prompt

    ## Objective
    Evaluate whether operators can detect, diagnose, and respond to failures quickly using available logs, traces, health checks, alerting patterns, and runbook guidance.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Structured logging and error taxonomy

- Trace/correlation IDs across tiers
- Health/readiness/liveness endpoints and status surfaces
- Audit logs for sensitive actions and incident response runbooks

  ## Required Special Checks
  - Flag any major failure mode that cannot be diagnosed quickly from logs/telemetry

- Flag missing health checks that hinder deployment or recovery decisions
- Flag inconsistent error/reporting semantics that block triage

  ## Required Deliverables
  - Observability gap register

- Operator blind-spot summary
- Recommended alerting and telemetry upgrades
- Incident readiness final decision

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

  Return **NO-GO** if operators lack visibility into critical auth, API, worker, or realtime failures.
