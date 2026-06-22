    # Failure Injection and Chaos Pack Prompt

    ## Objective
    Design controlled failure-injection tests to validate graceful degradation when APIs, sockets, workers, DBs, or external dependencies fail or slow down.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - API unavailable / timeout scenarios

- Socket disconnect / stale token / reconnect scenarios
- DB timeout and worker crash scenarios
- Duplicate delivery and partial failure paths

  ## Required Special Checks
  - Cases where degraded UX is undefined

- Places where flags or kill switches would improve recovery
- Domains where failure is catastrophic rather than graceful

  ## Required Deliverables
  - Failure matrix

- Expected graceful degradation behaviors
- Operator recovery checkpoints
- Readiness upgrade recommendations

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

  Use this pack to expose brittle assumptions before users do.
