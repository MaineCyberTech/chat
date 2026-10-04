# Prometheus / Alertmanager for Chat

Alerting artifacts and runtime wiring for [OBS-P1-001](../../docs/audits).
The metrics pipeline existed but no rules or notification routing were checked
in, so incidents were detected by users rather than operators. Prometheus and
Alertmanager now run as services in the app's compose files.

## Contents

| File                      | Purpose                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `prometheus.yml`          | Scrape config: `chat-api` `/metrics` (bearer `METRICS_TOKEN`) + self-scrape; forwards alerts to Alertmanager.   |
| `rules/chat.rules.yml`    | Prometheus alert rules: API availability, 5xx rate, p95 latency, circuit breakers, and (inert) worker queue.    |
| `alertmanager.yml`        | Alertmanager routing template. `${CHAT_NTFY_*}` placeholders are rendered at container start; secrets stay in env. |

## How it runs

`prometheus` and `alertmanager` are part of
`infra/docker/docker-compose.prod.yml` and `infra/docker/docker-compose.dev.yml`
(no published ports — internal to the compose network):

1. The `prometheus` entrypoint writes `METRICS_TOKEN` to `/tmp/metrics_token`
   and `prometheus.yml` reads it via `authorization.credentials_file`, so the
   token is never embedded in the config or command line.
2. Prometheus evaluates `rules/chat.rules.yml` and forwards firing alerts to
   `alertmanager:9093`.
3. The `alertmanager` entrypoint renders `alertmanager.yml` with the
   `CHAT_NTFY_*` environment values, then routes to the org's self-hosted ntfy
   topic `https://ntfy.mainecybertech.us/chat-alerts` with HTTP basic auth.

The worker health server returns JSON rather than Prometheus text, so worker
queue metrics require a JSON exporter; `ChatWorkerQueueBacklog` /
`ChatWorkerQueueFailures` stay inert until one publishes `chat_worker_queue_*`.
A blackbox exporter probing `/healthz` (job `chat-blackbox`) enables
`ChatHealthcheckFailing`; it is not required for the core alerts.

## Required environment

Set these in `infra/docker/.env` (see `infra/docker/.env.prod.example`):

| Variable         | Used by       | Notes                                                        |
| ---------------- | ------------- | ------------------------------------------------------------ |
| `METRICS_TOKEN`  | scrape config | Shared token for `GET /metrics` (min 16 chars). Unset disables `/metrics`. |
| `CHAT_NTFY_URL`  | Alertmanager  | ntfy publish URL. Defaults to `https://ntfy.mainecybertech.us/chat-alerts`. |
| `CHAT_NTFY_USER` | Alertmanager  | ntfy user with write-only access to the topic. Defaults to `chat-relay`. |
| `CHAT_NTFY_PASS` | Alertmanager  | Password for `CHAT_NTFY_USER` (secret; no committed default). |

The production deploy workflow (`deploy-production.yml`) writes `.env` from the
`METRICS_TOKEN` and `CHAT_NTFY_PASS` GitHub secrets.

## Validate

```bash
# Prometheus config + rules
promtool check config infra/prometheus/prometheus.yml
promtool check rules infra/prometheus/rules/chat.rules.yml

# Alertmanager (render the template first, as the container does)
amtool check-config <rendered>/alertmanager.yml

# Compose parses
docker compose -f infra/docker/docker-compose.prod.yml config -q
docker compose -f infra/docker/docker-compose.dev.yml config -q
```

## Related

- Thresholds and response steps: [`docs/runbooks/alerting.md`](../../docs/runbooks/alerting.md)
- Metric definitions: `apps/api/src/lib/metrics.ts`
