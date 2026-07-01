# Principal Audit Report

- Prompt: **observability_ultra**
- Domain: **observability**
- Run ID: **observability_ultra_20260701_074119**
- Generated: **2026-07-01T07:41:18Z**
- Decision: **NO-GO**
- P0: **1**, P1: **3**
- P2: **3**, P3: **2**
- Readiness: **52.00**

## Findings

### P0 — No distributed tracing — only basic request IDs, no span propagation across API -> DB -> WebSocket -> webhook -> background jobs

- **File:** ``
- **Category:** Blind spots
- **Impact:** Cannot trace a single user action across service boundaries; debugging complex failures requires manually correlating log timestamps across services with no shared trace ID
- **Fix:** Add OpenTelemetry instrumentation for Express, Supabase queries, Socket.io events, and outbound HTTP calls; propagate trace context via headers

### P1 — No automatic request logging middleware — every request log line must be manually emitted, leading to inconsistent log coverage

- **File:** `apps/api/src/lib/logger.ts`
- **Category:** Structured logging
- **Impact:** Some requests produce no access log at all; cannot audit all API calls; correlation requires manual context passing
- **Fix:** Add auto-request-logging middleware that captures method, path, status code, duration, and request ID for every request before route handler

### P1 — Request ID is not propagated to Socket.io events, background jobs, or outbound webhook calls

- **File:** `apps/api/src/middleware/request-id.ts`
- **Category:** Tracing
- **Impact:** Cannot correlate WebSocket events or webhook deliveries with originating API request — making debugging of async flows impossible
- **Fix:** Attach request ID to Socket.io event payloads; pass to worker tasks; include in outbound webhook X-Request-ID header

### P1 — 18 Prometheus metrics defined but no remote collector configured — metrics sit in memory and are only accessible via unauthenticated /metrics endpoint

- **File:** `apps/api/src/lib/metrics.ts`
- **Category:** Metrics
- **Impact:** Metrics are generated but never aggregated, alerted on, or visualized; the entire metrics infrastructure has no consumer
- **Fix:** Configure Prometheus remote write or set up a Grafana Cloud integration to push metrics; configure retention and alert rules

### P2 — Push notification delivery failures logged via console.error instead of structured logger.error — no structured context, no trace ID, no error taxonomy

- **File:** `apps/api/src/modules/notifications/service.ts`
- **Category:** Silent catch blocks
- **Impact:** Push notification failures are invisible in centralized logging; cannot alert on failure rate or diagnose types of failures
- **Fix:** Replace console.error with logger.error including structured context: notification type, user agent, endpoint, error code, request ID

### P2 — Health checks validate only database connectivity — no Redis, Supabase Storage, or external dependency checks

- **File:** `apps/api/src/modules/health/routes.ts`
- **Category:** Health checks
- **Impact:** Health check can pass 'healthy' while critical dependencies are down, giving false confidence to orchestrator
- **Fix:** Add optional dependency checks for Redis (if REDIS_URL configured), Supabase Storage endpoint, and circuit breaker states

### P2 — Audit event queue is in-memory — events lost on process restart; no Redis-backed persistence

- **File:** `apps/api/src/services/audit.ts`
- **Category:** Audit logging
- **Impact:** Audit trail gaps during deploy windows; compliance risk for sensitive operations
- **Fix:** Replace in-memory queue with Redis-backed Bull queue with persistent storage

### P3 — Frontend has no structured logging — only console.log/error used ad-hoc with no consistent format

- **File:** ``
- **Category:** Logging coverage
- **Impact:** Client-side errors cannot be diagnosed from logs; no frontend telemetry for UX monitoring
- **Fix:** Add frontend logging library (loglevel or pino-web) with remote log shipping; integrate with Sentry breadcrumbs

### P3 — No worker health endpoint nor Prometheus metrics — apps/worker has zero observability instrumentation

- **File:** ``
- **Category:** Metrics
- **Impact:** Worker failures (stuck jobs, OOM, queue backlogs) are invisible until users report symptoms
- **Fix:** Add health endpoint and basic metrics (jobs processed, queue depth, error rate) to apps/worker
