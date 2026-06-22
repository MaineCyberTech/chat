    # Load and Concurrency Test Pack Prompt

    ## Objective
    Design load and concurrency tests for chat sends, socket fanout, reconnect storms, search, notifications, and worker flows.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Concurrent sends and deduplication behavior

- Realtime reconnect/fanout scenarios
- Search and pagination under load
- Notification and worker throughput patterns

  ## Required Special Checks
  - Realtime bottleneck scenarios

- Degraded state under partial failure or slow dependencies
- Metrics needed for meaningful interpretation

  ## Required Deliverables
  - Load scenario matrix

- Capacity assumptions and success criteria
- Bottleneck hypothesis list
- Operator interpretation guide

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

  Treat this as a resilience and scale-confidence pack rather than a vanity performance exercise.
