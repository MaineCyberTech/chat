# API Documentation

The [OpenAPI Specification](./openapi.json) is the **authoritative** API reference. This README provides summary documentation for common endpoints; if there is any discrepancy, the OpenAPI spec takes precedence.

- [OpenAPI Specification](./openapi.json) — Full API schema in OpenAPI 3.0 format (authoritative).
- [API Versioning](./versioning.md) — Versioning policy and migration guidelines.
- [API Changelog](./changelog.json) — Versioned changelog of all API changes.
- [Rate Limits](./rate-limits.md) — Rate limit tiers and configuration.

## Health Endpoints

### `GET /healthz`

Deep health check including database connectivity. No authentication required. Returns 200 if healthy, 503 if any critical check fails.

```json
{
  "service": "api",
  "status": "healthy",
  "timestamp": "2026-07-24T12:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": {
    "server": { "status": "healthy" },
    "database": { "status": "healthy", "latencyMs": 2 }
  }
}
```

| Check      | What It Verifies                                          |
| ---------- | --------------------------------------------------------- |
| `server`   | Process is running and responding                         |
| `database` | Supabase PostgreSQL connectivity via `workspaces` query   |

Status values per check: `healthy`, `unhealthy`, `degraded`. The top-level `status` is `down` if any check is `unhealthy`, or `degraded` if any check is `degraded`.

### `GET /health` (mounted via router)

Lightweight readiness check at `/v1/health`. Returns basic process info without database check:

```json
{
  "service": "api",
  "status": "healthy",
  "timestamp": "2026-07-24T12:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": { "server": { "status": "healthy" } }
}
```

### Usage in Docker Compose

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:4000/healthz"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 20s
```
