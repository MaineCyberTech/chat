# Principal Audit Report

- Prompt: **observability_ultra**
- Domain: **observability**
- Run ID: **observability_ultra_20260703_061029**
- Generated: **2026-07-03T06:10:00Z**
- Decision: **NO-GO**
- P0: **2**, P1: **3**
- P2: **3**, P3: **0**
- Readiness: **0.00**

## Findings

### P0 — 14 of 17 Prometheus metrics defined but never emitted - only HTTP request count/duration, WebSocket connections gauge, and webhook delivery counter are actually populated

- **File:** `apps/api/src/lib/metrics.ts`
- **Category:** Metrics
- **Impact:** Business metrics for messages, auth attempts, workspaces, channels, reactions, notifications, files, search, circuit breaker status, and idempotency are all dead code. Production monitoring is blind to all business activity.
- **Fix:** Call recordWebsocketMessage, recordDbQuery, recordAuthAttempt, recordMessageCreated, etc. at the appropriate points in services and middleware

### P0 — Worker has no Sentry integration - no initSentry(), no captureException(), no error tracking at all

- **File:** `apps/worker/src/main.ts`
- **Category:** Error Tracking
- **Impact:** Worker crashes and job processing errors are completely invisible. Sentry has zero visibility into worker failures.
- **Fix:** Add Sentry.init() to worker bootstrap and wrap job handlers with Sentry.captureException

### P1 — Correlation IDs are not automatically injected into log lines - no pino child loggers are created. requestId is manually included in only 4 log calls across the entire codebase.

- **File:** `apps/api/src/lib/logger.ts`
- **Category:** Logging
- **Impact:** Cannot trace a single request across multiple log lines. Debugging production issues requires correlating log timestamps manually.
- **Fix:** Create a pino child logger per request with requestId, replace the root logger with the child logger in middleware

### P1 — No manual Sentry.captureException() calls anywhere in the API codebase - only auto-capture from Express error middleware

- **File:** `apps/api/src/`
- **Category:** Error Tracking
- **Impact:** Critical errors caught in catch blocks (e.g. webhook delivery failure, GDPR delete failure) are logged but never sent to Sentry. Silent data integrity issues.
- **Fix:** Add Sentry.captureException(err) to all catch blocks in critical paths (webhooks, GDPR, auth, messages, payment flows)

### P1 — API /healthz endpoint checks DB but does not check Redis connectivity

- **File:** `apps/api/src/modules/health/service.ts`
- **Category:** Health Checks
- **Impact:** If Redis is down (cache, idempotency, Socket.io adapter all affected), the health endpoint reports 'healthy' despite critical dependency being unavailable.
- **Fix:** Add Redis PING check to the health service, report 'degraded' if Redis is unreachable

### P2 — x-request-id is not returned in response headers - clients cannot correlate requests to server-side traces

- **File:** `apps/api/src/middleware/request-id.ts`
- **Category:** Tracing
- **Impact:** Client-side debugging cannot connect HTTP responses to server log entries. Support teams cannot correlate user reports to specific requests.
- **Fix:** Add res.setHeader('x-request-id', req.requestId) in the request-id middleware

### P2 — Socket.io events have no correlation IDs - cannot trace WebSocket message flows across services

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** Tracing
- **Impact:** When a message send event fails, there is no correlation ID to link the Socket.io event to the server-side processing. Debugging real-time issues is manual.
- **Fix:** Generate correlation IDs on Socket.io connection/auth, propagate to all event handlers

### P2 — setCircuitBreakerStatus() metric function exists but is never called from circuit-breaker.ts events

- **File:** `apps/api/src/lib/metrics.ts`
- **Category:** Metrics
- **Impact:** Circuit breaker state changes (open/closed/half-open) are invisible in Prometheus. Cannot detect when external services are failing via circuit breaker metrics.
- **Fix:** Wire circuit-breaker.ts 'open'/'close'/'halfOpen' events to call setCircuitBreakerStatus()
