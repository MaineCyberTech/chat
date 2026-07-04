# Principal Audit Report

- Prompt: **observability_incident_readiness**
- Domain: **ops**
- Run ID: **observability_incident_readiness_20260703_054839**
- Generated: **2026-07-03T12:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **2**, P3: **0**
- Readiness: **76.00**

## Findings

### P1 — Request ID is generated but not propagated to downstream services — no distributed tracing context

- **File:** `apps/api/src/middleware/request-id.ts`
- **Category:** trace_correlation
- **Impact:** Cross-service debugging (API -> Supabase -> webhook -> worker) requires manual log correlation. Operators cannot trace a user-facing failure end-to-end.
- **Fix:** Add x-request-id propagation to all outgoing HTTP requests, worker task payloads as trace_id, and Supabase queries via pg settings.

### P1 — Audit log retry queue is in-memory and non-durable — events lost on process restart

- **File:** `apps/api/src/services/audit.ts`
- **Category:** audit_logging
- **Impact:** If the API process restarts (deploy, crash, OOM), all queued audit events are permanently lost including compliance-relevant actions.
- **Fix:** Replace in-memory array with Redis-backed queue or persistent audit_queue table. Implement background worker with exponential backoff.

### P2 — Error handler metadata omits HTTP method and route path from log context

- **File:** `apps/api/src/middleware/error-handler.ts`
- **Category:** structured_logging
- **Impact:** When debugging error spikes, operators cannot quickly identify which endpoint is failing without cross-referencing request IDs.
- **Fix:** Add method: req.method, path: req.path, and route: req.route?.path to log metadata in both AppError and unhandled error branches.

### P2 — Incident runbook diagnosis steps don't reference Sentry error traces or Prometheus metrics dashboards

- **File:** `docs/runbooks/incident-response.md`
- **Category:** incident_runbook
- **Impact:** During incidents, operators follow runbook diagnosis steps but are not directed to Sentry for error clustering or /metrics for performance baselines.
- **Fix:** Add diagnosis steps: 'Check Sentry for error traces and regression', 'Check Prometheus metrics at /metrics for anomaly spikes'.
