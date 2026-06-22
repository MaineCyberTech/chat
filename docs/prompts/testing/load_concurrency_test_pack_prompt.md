    # Load and Concurrency Test Pack Prompt

    ## Objective
    Design load and concurrency tests for chat send paths, socket fanout, reconnect storms, search, notifications, and queue/worker flows.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Concurrent sends and deduplication behavior

- Realtime reconnect/fanout scenarios
- Search and pagination under load
- Notification and worker throughput patterns

  ## Required Special Checks
  - Prioritize scenarios likely to expose realtime bottlenecks

- Include degraded state behavior under partial failure or slow dependencies
- Identify metrics needed to make load results meaningful

  ## Required Deliverables
  - Load scenario matrix

- Capacity assumptions and success criteria
- Bottleneck hypothesis list
- Operator interpretation guide

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

  Treat this as a resilience and scale-confidence pack rather than a vanity performance exercise.
