# Wave-by-Wave Operator Guide

## Wave 0 — Inventory and architecture readiness

### Execute

- master feature orchestrator prompt
- feature gap and architecture inventory prompt
- platform readiness prompt

### Required evidence

- architecture inventory
- prioritized roadmap
- file-by-file implementation plan
- migration and risk notes

### Proceed only if

- there is a clear implementation order
- touchpoints are mapped by repo path
- obvious platform blockers are known

## Wave 1 — Core collaboration foundations

### Execute

- threaded conversations prompt
- notification engine and mentions prompt
- RBAC and channel overrides prompt

### Required evidence

- schema and migration plan
- permission matrix
- realtime event changes
- rollback and test plan

### Stop if

- RLS and application authorization could drift
- hidden channel/thread data could leak
- unread/notification semantics are not clearly defined

## Wave 2 — Integrations and search

### Execute

- incoming webhook pipeline prompt
- full text search prompt

### Required evidence

- webhook abuse/rate-limit plan
- search index strategy
- permission-safe query plan

### Stop if

- search can reveal hidden content
- webhooks lack abuse controls or delivery observability

## Wave 3 — Frontend interaction depth

### Execute

- virtualization and scrolling prompt
- optimistic UI prompt
- rich editor prompt
- adaptive theme prompt
- responsive layout prompt

### Required evidence

- performance bottleneck analysis
- rollback and failure UX plan
- accessibility notes
- mobile/desktop behavior summary

### Stop if

- virtualization breaks scroll integrity
- optimistic updates can corrupt chat state
- theme hydration or responsive navigation regressions are likely

## Wave 4 — Media collaboration

### Execute

- audio/video media UI prompt

### Required evidence

- session state/event plan
- device permission UX
- degraded network behavior plan

## Wave 5 — Verification and release

### Execute

- feature test expansion prompt
- feature release gate prompt

### Required evidence

- test matrix
- E2E and performance coverage plan
- release decision and rollout strategy
