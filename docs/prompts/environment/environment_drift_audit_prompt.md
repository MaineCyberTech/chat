    # Environment Drift Audit Prompt

    ## Objective
    Compare development, release, and production environment assumptions to identify drift that can cause deployment breakage, auth failures, domain mismatch, or hidden runtime behavior changes.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Environment variables and secret names across environments

- Domains, callback URLs, cookie domains, CORS origins, websocket endpoints, and webhook endpoints
- Feature flags and environment-specific switches
- Deployment targets, DNS / edge assumptions, and branch/environment mappings

  ## Required Special Checks
  - Detect any value present in prod but missing in dev or vice versa where parity matters

- Detect domain mismatches that will break sign-in, cookies, or API wiring
- Detect misaligned environment naming that can cause operators to push to the wrong target

  ## Required Deliverables
  - Drift matrix by environment

- List of blocking drifts vs informational drifts
- Recommended normalization plan
- Promotion readiness statement

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

  Return **NO-GO** if domain/callback/cookie/CORS drift can break auth or permit unintended access patterns.
