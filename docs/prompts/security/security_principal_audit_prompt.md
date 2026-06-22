    # Security Principal Audit Prompt

    ## Objective
    Perform a deep security review of the repository, runtime assumptions, auth boundaries, tenant isolation, secret handling, and abuse controls to determine whether the application has production-safe security posture.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Authentication flows, token handling, session storage, cookie settings, and auth middleware

- Authorization checks, role gating, tenant isolation, and admin surface exposure
- Environment variable handling, secret sourcing, and accidental secret exposure risk
- CORS, CSRF, cookie domain, webhook signature verification, and trust boundaries
- Dependency posture, vulnerable or abandoned packages, and unsafe defaults
- Sensitive logging, audit logging, and data leakage risk in logs or telemetry

  ## Required Special Checks
  - Check for cross-tenant access or identifier guessing paths

- Check for debug routes or insecure local-only assumptions leaking into production
- Check if developer exceptions or bypasses can bleed into production environments
- Check for missing rate limits, brute-force protections, and replay protections

  ## Required Deliverables
  - Security findings table with P0/P1/P2/P3 severities

- Exploitability / impact commentary for each major finding
- Mitigation plan with immediate vs deferred actions
- Final GO / GO WITH RISKS / NO-GO recommendation from security perspective

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

  Return **NO-GO** if any high-confidence privilege escalation, sensitive data exposure, cross-tenant leakage, or secret handling flaw is present.
