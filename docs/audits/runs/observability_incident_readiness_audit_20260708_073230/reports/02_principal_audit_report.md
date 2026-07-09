# Principal Audit Report

- Prompt: **observability_incident_readiness_audit**
- Domain: **observability**
- Run ID: **observability_incident_readiness_audit_20260708_073230**
- Generated: **2026-07-07T03:42:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **4**, P3: **2**
- Readiness: **75.00**

## Findings

### P2 — No trace/correlation ID propagation across API, worker, and database tiers

- **File:** `apps/api/src/lib/logger.ts`
- **Category:** distributed_tracing
- **Impact:** Cannot trace a request end-to-end across service boundaries. Correlating logs from API → Worker → DB requires manual grep, slowing root cause analysis.
- **Fix:** Implement OpenTelemetry instrumentation or inject a requestId header through all service calls. Add traceId/spanId to all structured log entries.

### P2 — Logger does not automatically include request context (requestId, userId, route) in structured metadata

- **File:** `apps/api/src/lib/logger.ts`
- **Category:** structured_logging
- **Impact:** Log entries lack correlation context, making it difficult to filter or aggregate per-request during incident triage.
- **Fix:** Add a middleware that creates a child logger with requestId, userId, and route bound automatically, and make it available via req.log.

### P2 — Health endpoint does not check Redis, queue, or external dependency health

- **File:** `apps/api/src/modules/health/service.ts`
- **Category:** health_checks
- **Impact:** Health check can report 'healthy' while critical dependencies (Redis, BullMQ) are down, giving false confidence for deployment decisions.
- **Fix:** Add Redis ping, queue health (BullMQ), and LiveKit connectivity checks to getFullHealth(). Report unhealthy status when any critical dependency fails.

### P2 — Sentry tracesSampleRate set to 1.0 in development environment, risking excessive event volume

- **File:** `apps/api/src/lib/sentry.ts`
- **Category:** metrics
- **Impact:** In shared dev/staging environments with traffic, 100% tracing generates unnecessary cost and noise, potentially masking real issues.
- **Fix:** Set tracesSampleRate to 0.1 for development and 0.2 for production. Use a separate DSN or disable Sentry in non-production unless explicitly enabled.

### P3 — Metrics endpoint (/metrics) not exposed or documented in routes

- **File:** `apps/api/src/lib/metrics.ts`
- **Category:** metrics
- **Impact:** Prometheus cannot scrape metrics because no /metrics route is registered in the route registry.
- **Fix:** Add a GET /metrics route registered in route-registry.ts that serves register.metrics(). Protect behind authentication or firewall.

### P3 — Worker health check on separate port (4100) not documented in runbook or deployment config

- **File:** `apps/worker/src/main.ts`
- **Category:** incident_response
- **Impact:** Operators and load balancers may not know the worker exposes a health endpoint, leading to undetected worker failures.
- **Fix:** Document HEALTH_PORT in environment schema and add to the deployment health check configuration. Standardize worker health to use a known path rather than a separate port.
