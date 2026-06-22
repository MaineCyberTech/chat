    # API and Realtime Contract Audit Prompt

    ## Objective
    Audit API stability, websocket/realtime payload correctness, reconnect behavior, idempotency, and message integrity assumptions.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - REST schema compatibility

- Realtime payload schemas and auth/tenant scoping
- Reconnect/resync/duplicate delivery/message ordering behavior
- Pagination and cache invalidation behavior

  ## Required Special Checks
  - Frontend/backend payload mismatches

- Reconnect paths that lose or duplicate messages
- Auth gaps between API and realtime channels

  ## Required Deliverables
  - Contract drift table

- Realtime behavior risk table
- Suggested contract tests and E2E cases
- Final release decision for API/realtime domain

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

  Return **NO-GO** if contract drift or realtime corruption risk can materially break chat integrity.
