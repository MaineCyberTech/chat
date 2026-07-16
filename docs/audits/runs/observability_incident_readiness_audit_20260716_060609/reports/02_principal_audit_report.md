# Principal Audit Report

- Prompt: **observability_incident_readiness_audit**
- Domain: **observability**
- Run ID: **observability_incident_readiness_audit_20260716_060609**
- Generated: **2026-07-16T06:02:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **3**, P3: **4**
- Readiness: **68.60**

## Findings

### P2 — No Sentry or external error tracking integration found — errors not captured outside console/pino
- **File:** `apps/api/src/app.ts`
- **Category:** error_tracking
- **Impact:** Silent errors in production cannot be aggregated, alerted on, or traced without external monitoring
- **Fix:** Add Sentry.init in app.ts before routes mount; add captureException to all catch blocks in middleware

### P2 — No Prometheus metrics endpoint or gauge export visible — metrics only used internally via recordWebhookDelivery
- **File:** `apps/api/src/lib/metrics.ts`
- **Category:** metrics
- **Impact:** Operators cannot monitor request rates, error rates, or latency without external APM
- **Fix:** Add prometheus client counter/histogram exports and expose /metrics endpoint behind auth middleware

### P2 — Worker has no Prometheus metrics — no visibility into job processing rates, failures, or queue depth
- **File:** `apps/worker/src/main.ts`
- **Category:** metrics
- **Impact:** Worker failures or queue backlogs invisible until user impact occurs
- **Fix:** Add prom-client to worker, track job completion/failure metrics per processor

### P3 — Logger wraps pino but has no serialization config for errors (err property) or request context
- **File:** `apps/api/src/lib/logger.ts`
- **Category:** structured_logging
- **Impact:** Error objects logged as generic strings, losing stack traces and structured metadata
- **Fix:** Add pino serializers for err, req, res objects to ensure structured error logging

### P3 — Worker Dockerfile has no HEALTHCHECK directive
- **File:** `apps/worker/Dockerfile`
- **Category:** health_endpoints
- **Impact:** Docker/docker-compose cannot detect worker process health; compose healthcheck depends on outside endpoint
- **Fix:** Add HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:4100/healthz || exit 1

### P3 — No incident response runbook found in docs directory
- **File:** `docs/runbooks/`
- **Category:** incident_readiness
- **Impact:** Operators lack documented procedures for diagnosing and responding to common failure modes
- **Fix:** Create docs/runbooks/incident-response.md with escalation paths, health check procedures, and recovery steps

### P3 — Audit log failure queue uses in-memory array — lost on process restart; no Redis persistence
- **File:** `apps/api/src/services/audit.ts`
- **Category:** audit_logging
- **Impact:** Pending audit log entries are lost if the API process restarts during queue backpressure
- **Fix:** Replace in-memory audit queue with Redis-backed queue (BullMQ) or at minimum a DB-backed retry table
