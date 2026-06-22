    # API and Realtime Contract Audit Prompt

    ## Objective
    Audit the stability and correctness of API routes, websocket/realtime events, reconnect behavior, idempotency, cache invalidation, and message integrity assumptions.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - REST payload schemas and version compatibility

- Realtime event payload schemas and auth / tenant scoping
- Reconnect, resync, duplicate delivery, message ordering, and optimistic UI rollback
- Pagination behavior, cursor correctness, and cache invalidation

  ## Required Special Checks
  - Flag any frontend/backend payload mismatch

- Flag any reconnect path that can lose or duplicate messages
- Flag any auth gap between API and realtime channels

  ## Required Deliverables
  - Contract drift table

- Realtime behavior risk table
- Recommended contract tests and E2E cases
- Final release decision for API/realtime domain

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

  Return **NO-GO** if contract drift or realtime corruption risk can materially break chat/session integrity.
