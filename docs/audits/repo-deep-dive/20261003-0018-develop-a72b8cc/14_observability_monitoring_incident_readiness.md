# 14 — Observability, Monitoring & Incident Readiness

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Metrics, logging, tracing/error tracking, health checks, alerting, and incident readiness.

## Evidence Reviewed

- `apps/api/src/lib/metrics.ts`, `lib/logger.ts`, `lib/sentry.ts`
- `apps/api/src/app.ts`, `modules/health/service.ts`, `modules/admin/error-buffer.ts`, `modules/admin/routes.ts`
- `apps/worker/src/main.ts` (health/metrics server)
- `infra/terraform/main.tf` (monitor alerts)
- `docker-compose.*.yml` healthchecks, `Caddyfile.prod`

## Verification Performed

- Enumerated metric families and their label cardinality.
- Checked alerting configuration and gating.
- Reviewed health endpoints and their authorization.
- Confirmed Sentry PII scrubbing behavior.

## Executive Summary

Instrumentation exists (prom-client metrics, pino-style logger, Sentry, container healthchecks, DO CPU/mem/disk alerts), but alerting is explicitly a TODO, tracing is not wired to a collector, and the worker metrics endpoint is unauthenticated. Incident readiness is weak: no runbooks/on-call wired to this repo.

## Inventory

| Signal | Present | Evidence |
|---|---|---|
| Prometheus metrics (API) | Yes | `lib/metrics.ts`, `app.ts:103` |
| Metrics (worker) | Yes, unauthenticated | `worker/src/main.ts:73-81` |
| Structured logs | Yes | `lib/logger.ts`, `packages/config/logger.js` |
| Sentry | Optional | `lib/sentry.ts:20-48` |
| Health/readiness | Yes | `lib/metrics.ts` TODO |
| Alerts | Optional/off | `terraform/main.tf:101-142` (count guarded by `alert_email`) |
| Traces/exporter | Not evident | none |

## Findings

### Finding ID: OBS-P1-001 - No alerting is wired despite metrics and a TODO

- Severity: P1
- Confidence: High
- Area: OBS
- Evidence:
  - `apps/api/src/lib/metrics.ts:1-16` — comment block: "TODO: Configure alerting channels … Prometheus + Alertmanager … PagerDuty / OpsGenie"
  - `infra/terraform/main.tf:101-142` — CPU/memory/disk alerts only created when `alert_email != ""`; default `alert_email = ""` (`variables.tf:45-49`)
- What is happening: The repo defines metrics and optional infra alerts but no alerting pipeline is configured by default.
- Why it matters: incidents are detected by users, not operators.
- User / business impact: longer outages.
- Security / privacy / reliability impact: high operational risk.
- Recommended fix: configure Alertmanager/Sentry alerts for 5xx rate, worker queue backlog/failed counts, circuit-breaker open, and health-check failures; set `alert_email`.
- Suggested validation: a forced 5xx triggers a notification.
- Owner suggestion: Ops
- Effort estimate: M
- Dependencies: OBS-P2-002
- Status: open

### Finding ID: OBS-P2-002 - `/metrics` authorization is weak and label cardinality is risky

- Severity: P2
- Confidence: High
- Area: OBS
- Evidence:
  - `apps/api/src/app.ts:103-106` — `/metrics` behind `authenticate` only
  - `apps/api/src/lib/metrics.ts:66-71,111-116` — counters labeled by `channel_id`/`type`
  - `apps/worker/src/main.ts:73-81` — worker `/metrics` unauthenticated
- What is happening: Metrics are broadly readable and include per-tenant labels.
- Why it matters: info disclosure plus potential metric-cardinality growth.
- User / business impact: low-medium.
- Security / privacy / reliability impact: medium.
- Recommended fix: restrict scrape access; drop tenant-scoped labels or hash them.
- Suggested validation: scrape from outside is denied.
- Owner suggestion: API/Ops
- Effort estimate: S
- Dependencies: API-P1-001
- Status: open

### Finding ID: OBS-P2-003 - Error tracking is optional and admin log buffer is in-memory only

- Severity: P2
- Confidence: Medium
- Area: OBS
- Evidence:
  - `apps/api/src/lib/sentry.ts:22` — returns early if `SENTRY_DSN` unset
  - `apps/api/src/modules/admin/error-buffer.ts` + `admin/routes.ts:407-417` — `/admin/logs` reads an in-memory buffer
- What is happening: Without a DSN there is no durable error record; the admin log viewer is lost on restart and per-instance.
- Why it matters: post-incident forensics are limited.
- User / business impact: slower resolution.
- Security / privacy / reliability impact: medium.
- Recommended fix: ship logs to a durable aggregator; ensure Sentry configured in all envs; keep PII scrubbing.
- Suggested validation: error appears in aggregator after restart.
- Owner suggestion: Ops
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: OBS-P2-004 - No distributed tracing / correlation to a collector

- Severity: P2
- Confidence: Medium
- Area: OBS
- Evidence:
  - `apps/api/src/app.ts:87` — `requestId` middleware provides correlation ids
  - No OpenTelemetry/exporter config found; `metrics.ts` TODO references Prometheus/Alertmanager only
- What is happening: Correlation is limited to `requestId` in logs.
- Why it matters: hard to trace a request across API → worker → Supabase.
- User / business impact: slow diagnosis.
- Security / privacy / reliability impact: medium.
- Recommended fix: add OpenTelemetry (or Sentry performance) with propagation to worker/Supabase.
- Suggested validation: a trace spans API→worker.
- Owner suggestion: Ops
- Effort estimate: L
- Dependencies: None
- Status: open

## Risks

- Detection relies on users; forensic data volatile.

## Recommendations

1. Wire alerting with sensible thresholds.
2. Centralize logs and restrict metrics.
3. Add tracing.

## Quick Wins

- Set `alert_email`; remove tenant label from metrics.

## Hardening Backlog

- Runbooks + on-call rotation + synthetic checks.

## Suggested Tests

- Chaos test triggers alert (see `tests/chaos`).
- Synthetic login/message flow.

## Suggested Documentation Updates

- Incident response runbook; SLOs.

## Open Questions

- Is there an external uptime monitor for `chat.mainecybertech.com`? Unknown.

## Appendix

- Container healthchecks exist for web/api/worker/redis in compose.
