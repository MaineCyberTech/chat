# Prometheus / Alertmanager for Chat

Alerting artifacts for [OBS-P1-001](../../docs/audits) — the metrics pipeline
existed but no rules or notification routing were checked in, so incidents were
detected by users rather than operators.

## Contents

| File                   | Purpose                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `rules/chat.rules.yml` | Prometheus alert rules for API availability, 5xx rate, p95 latency, circuit breakers, and worker queue health. |
| `alertmanager.yml`     | Alertmanager route + receivers (email default, webhook for critical).                                          |

## Deploy

1. Scrape the API's `GET /metrics` with a Prometheus job named `chat-api`.
   The endpoint is token-gated (see `METRICS_TOKEN` in `.env.example`); set the
   scrape job's `authorization` / `x-metrics-token` header accordingly.
2. Add a blackbox exporter probe job named `chat-blackbox` targeting
   `/healthz` on the API and worker (enables `ChatHealthcheckFailing`).
   The worker health server returns JSON rather than Prometheus text, so worker
   queue metrics require a JSON exporter; `ChatWorkerQueueBacklog` /
   `ChatWorkerQueueFailures` stay inert until one publishes the
   `chat_worker_queue_*` series.
3. Mount `rules/chat.rules.yml` via `rule_files:` and load
   `alertmanager.yml` with `--config.expand-env` so `${ALERT_EMAIL}` and
   `${ALERT_WEBHOOK_URL}` are substituted.
4. Validate before deploying:

   ```bash
   promtool check rules infra/prometheus/rules/chat.rules.yml
   amtool check-config infra/prometheus/alertmanager.yml
   ```

## Required environment

| Variable            | Used by       | Notes                                                   |
| ------------------- | ------------- | ------------------------------------------------------- |
| `METRICS_TOKEN`     | scrape config | Shared scraper token for `GET /metrics` (API + worker). |
| `ALERT_EMAIL`       | Alertmanager  | Default receiver address.                               |
| `ALERT_WEBHOOK_URL` | Alertmanager  | PagerDuty/OpsGenie/Slack webhook for critical alerts.   |

## Related

- Thresholds and response steps: [`docs/runbooks/alerting.md`](../../docs/runbooks/alerting.md)
- Metric definitions: `apps/api/src/lib/metrics.ts`
