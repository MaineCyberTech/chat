# Docker / Compose / Caddy

## Files

| File                           | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `docker-compose.dev.yml`       | Local dev environment (hot reload, volume mounts) |
| `docker-compose.devremote.yml` | Development remote environment (`.us` domains) |
| `docker-compose.prod.yml`      | Production environment (`.com` domains)        |
| `docker-compose.override.yml`  | Local overrides for development                |
| `.env.dev.example`             | Dev env template                               |
| `.env.devremote.example`       | Dev remote env template                        |
| `.env.prod.example`            | Production env template                        |
| `Caddyfile`                    | Caddy config for dev remote                    |
| `Caddyfile.dev`                | Caddy config for local dev                     |
| `Caddyfile.prod`               | Caddy config for production                    |

## docker-compose.dev.yml — Local Development

Full stack with hot reload. Source directories are mounted as volumes so changes reflect immediately.

**Services**: caddy, web, api, worker, redis, livekit
**Ports**: 80/443 (Caddy), 3000 (Web), 4000 (API), 6379 (Redis), 7880-7892 (LiveKit)

```bash
cp infra/docker/.env.dev.example infra/docker/.env.dev
docker compose -f infra/docker/docker-compose.dev.yml up -d --build
```

The API health check uses `wget http://localhost:4000/healthz`. All services wait for healthy dependencies before starting.

## docker-compose.devremote.yml — Development Remote

Uses pre-built images from GHCR. Designed for the `.us` development droplet. No source volume mounts.

**Services**: caddy, web, api, worker, redis, livekit
**Image tag**: `:dev`

```bash
cp infra/docker/.env.devremote.example infra/docker/.env.devremote
docker compose -f infra/docker/docker-compose.devremote.yml pull
docker compose -f infra/docker/docker-compose.devremote.yml up -d
```

Environment variables must include all Supabase, LiveKit, VAPID, and SMTP configs. Set `API_IMAGE`, `WEB_IMAGE`, `WORKER_IMAGE` to pull from GHCR.

## docker-compose.prod.yml — Production

Same structure as devremote but tagged `:latest` and with production settings (stricter health checks, LiveKit TURN enabled, TLS enabled).

**Services**: caddy, web, api, worker, redis, livekit
**Image tag**: `:latest`

```bash
cp infra/docker/.env.prod.example infra/docker/.env.prod
docker compose -f infra/docker/docker-compose.prod.yml pull
docker compose -f infra/docker/docker-compose.prod.yml up -d
```

## Architecture

```
Internet → Caddy (80/443) → web (Next.js, port 3000)
                             → api (Express + Socket.io, port 4000)
```

Caddy handles TLS termination and reverse proxies path-based routes to the API:
- `/auth*`, `/workspaces*`, `/channels*`, `/messages*`, `/socket.io*` → api:4000
- everything else → web:3000

## Multi-Stage Dockerfiles

- `apps/api/Dockerfile` — deps install → TypeScript build → Node alpine runtime
- `apps/web/Dockerfile` — deps install → Next.js standalone build → Node alpine runtime
- `apps/worker/Dockerfile` — deps install → TypeScript build → Node alpine runtime

## CI/CD Deployments

GitHub Actions workflows in `.github/workflows/` automatically:

1. Validate code (lint, typecheck, test, build)
2. Build multi-stage Docker images
3. Push to GitHub Container Registry
4. SSH into the droplet and `docker compose up -d`

## Health Checks

| Service | Endpoint                          | Interval | Timeout |
| ------- | --------------------------------- | -------- | ------- |
| Caddy   | None (reverse proxy)              | —        | —       |
| Web     | `wget http://localhost:3000`      | 15-30s   | 10s     |
| API     | `wget http://localhost:4000/healthz` | 10s   | 5s      |
| Worker  | `wget http://localhost:4100/healthz` | 10-30s | 5-10s   |
| Redis   | `redis-cli ping`                  | 5s       | 3s      |
| LiveKit | None                             | —        | —       |

## Volumes

| Volume         | Content                     | Persistence |
| -------------- | --------------------------- | ----------- |
| `caddy-data`   | TLS certs, ACME account     | Named volume |
| `caddy-config` | Caddy auto-generated config | Named volume |
| `redis-data`   | AOF persistence file        | Named volume |
