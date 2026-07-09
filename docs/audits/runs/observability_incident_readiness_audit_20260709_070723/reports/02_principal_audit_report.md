# Principal Audit Report

- Prompt: **observability_incident_readiness_audit**
- Domain: **observability**
- Run ID: **observability_incident_readiness_audit_20260709_070723**
- Generated: **2026-07-09T03:06:59Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **2**, P3: **2**
- Readiness: **82.00**

## Findings

### P1 — No frontend-to-API trace ID propagation â€” browser does not send x-request-id header
- **File:** `apps/web/: apps/api/src/middleware/request-id.ts`
- **Category:** trace_correlation
- **Impact:** Cannot correlate frontend errors with API request logs; debugging client-side issues requires manual log digging
- **Fix:** Add request ID generation to Next.js middleware or BFF route handler, propagate x-request-id header on all API calls

### P2 — No automated alerting configured for any failure mode
- **File:** `.github/`
- **Category:** alerting
- **Impact:** Operators rely on manual health check polling; no push notifications for degraded DB, worker failure, or API down
- **Fix:** Configure Sentry alert rules for error thresholds, add uptime monitoring with PagerDuty/webhook integration, add DO monitoring alerts for CPU/memory/disk

### P2 — No structured error taxonomy or error codes â€” errors are strings not grouped by category
- **File:** `apps/api/src/: apps/worker/src/`
- **Category:** structured_logging
- **Impact:** Cannot easily aggregate or alert on specific error types across services
- **Fix:** Define AppError codes enum (AUTH_xxx, VALIDATION_xxx, DB_xxx, RATE_xxx) and enforce in all route handlers and services

### P3 — Prometheus metrics endpoint exists but no metrics export from worker service
- **File:** `apps/api/src/lib/metrics.ts`
- **Category:** metrics_export
- **Impact:** Worker health and throughput not visible in monitoring dashboards
- **Fix:** Expose /metrics endpoint in worker HTTP server with BullMQ queue stats and job counters

### P3 — No incident response runbook covering worker failure, API crash, or database degradation scenarios
- **File:** `docs/runbooks/`
- **Category:** runbooks
- **Impact:** Operators lack documented playbooks for common failure modes, increasing MTTR
- **Fix:** Create incident response runbook covering: worker crash recovery, API restart procedure, DB connection pool exhaustion, Redis failure fallback
