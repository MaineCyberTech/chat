# Docker / Compose / Traefik

## Files

| File                           | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `docker-compose.devremote.yml` | Development remote environment (`.us` domains) |
| `docker-compose.prod.yml`      | Production environment (`.com` domains)        |
| `.env.devremote.example`       | Dev remote env template                        |
| `.env.prod.example`            | Production env template                        |
| `traefik/traefik.yml`          | Traefik reverse proxy configuration            |

## Usage — Local Build

```bash
# Build images locally
docker compose -f infra/docker/docker-compose.devremote.yml build

# Or start with auto-build
docker compose -f infra/docker/docker-compose.devremote.yml up -d --build
```

## Usage — Pull from Registry

```bash
cp infra/docker/.env.devremote.example infra/docker/.env.devremote
# Edit .env.devremote

export WEB_IMAGE=ghcr.io/<owner>/chat/web:dev
export API_IMAGE=ghcr.io/<owner>/chat/api:dev

docker compose -f infra/docker/docker-compose.devremote.yml pull
docker compose -f infra/docker/docker-compose.devremote.yml up -d
```

## CI/CD Deployments

GitHub Actions workflows in `.github/workflows/` automatically:

1. Validate code (lint, typecheck, test, build)
2. Build multi-stage Docker images
3. Push to GitHub Container Registry
4. SSH into the droplet and `docker compose up -d`

Required GitHub Environment secrets:

- `DO_DROPLET_HOST` — droplet IP or hostname
- `DO_DROPLET_USER` — SSH username (e.g., `root`)
- `DO_SSH_PRIVATE_KEY` — SSH private key for authentication

## Architecture

```
Internet → Traefik (80/443) → web (Next.js, port 3000)
                            → api (Express + Socket.io, port 4000)
```

Dockerfiles are multi-stage builds:

- `apps/api/Dockerfile` — deps → build (tsc) → runtime (Node alpine)
- `apps/web/Dockerfile` — deps → build (next build standalone) → runtime

## Status

Dockerfiles implemented with multi-stage builds. Compose files reference pre-built images
from GHCR with local build fallback. CI/CD workflows are functional.
