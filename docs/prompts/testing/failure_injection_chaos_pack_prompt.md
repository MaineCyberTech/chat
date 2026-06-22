    # Failure Injection and Chaos Pack Prompt

    ## Objective
    Design controlled failure-injection tests to validate degraded behavior when APIs, sockets, workers, databases, or external dependencies fail or slow down.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - API unavailable / timeout scenarios

- Socket disconnect / reconnect / stale token scenarios
- DB timeout and worker crash scenarios
- Duplicate delivery, missing environment variable, and partial failure paths

  ## Required Special Checks
  - Make sure degraded UX is defined rather than left accidental

- Call out where feature flags or kill switches would improve recovery
- Highlight any domain where failures are catastrophic rather than gracefully handled

  ## Required Deliverables
  - Failure matrix

- Expected graceful degradation behaviors
- Operator recovery checkpoints
- Readiness upgrade recommendations after resilience tests

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

  Use this pack to expose brittle assumptions before users do.
