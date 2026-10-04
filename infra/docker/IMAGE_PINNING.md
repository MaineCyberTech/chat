# Container image digest pinning

Tracking: DET-P3-008 (SUPPLY). All third-party images referenced by the compose
files and application Dockerfiles are pinned by immutable digest
(`image:tag@sha256:...`). Digests were resolved from the upstream registry
manifest (multi-arch index/list) on **2026-10-04** using the Docker Registry
v2 API (`Docker-Content-Digest` of the manifest list).

## Pinned images

| Image | Digest (sha256) | Where |
|---|---|---|
| `caddy:2-alpine` | `881bbc60f9986d5ab8e7cfd6cf7e4ef3c9c0439fef2429d035d065577882f028` | dev / devremote / prod compose |
| `redis:7-alpine` | `858f009f9709ce576febc734aa78b8f6d624b82571f9ddb6bda4377c833b3499` | dev / devremote / prod compose |
| `livekit/livekit-server:latest` | `6fd3b7088874c4d119160dd688798dfec852bc014786d392caad15f6f63912a3` | dev / devremote / prod compose |
| `prom/prometheus:v3.5.1` | `38c3b05c3bc744ff1b0b7b4eb82196026442845e62a1e2073795565da506d7a2` | dev / devremote / prod compose |
| `prom/alertmanager:v0.28.1` | `27c475db5fb156cab31d5c18a4251ac7ed567746a2483ff264516437a39b15ba` | dev / devremote / prod compose |
| `node:22-alpine` | `0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402` | web / worker Dockerfiles |
| `node:26-alpine` | `0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80` | api Dockerfile |

## Intentionally NOT digest-pinned

The `chat` application images are mutable deploy targets and must be resolved at
deploy time:

- `chat-web:dev`, `chat-api:dev`, `chat-worker:dev` — built locally from the
  `build:` context.
- `${WEB_IMAGE:-ghcr.io/mainecybertech/chat/web:dev|latest}` and the
  `WORKER_IMAGE` / `API_IMAGE` equivalents. `deploy-development.yml` pulls the
  commit-tagged image and retags it as `:dev` on the droplet before
  `docker compose up`; `deploy-production.yml` pushes `:latest` and starts
  compose without overriding the variable. Pinning these to a fixed digest
  would freeze deployments to the digest in source and defeat the
  `--force-recreate` rollout.

## Periodic refresh

Digest pins do not receive security updates on their own. Refresh them on a
schedule (recommended: monthly, plus immediately on any upstream security
release) via a pull request:

```bash
# 1. Resolve the current digest for a tag (multi-arch aware):
docker buildx imagetools inspect caddy:2-alpine --format '{{json .Manifest.Digest}}'

# 2. Update the digest in the compose files / Dockerfiles.
# 3. Validate and open a PR:
docker compose -f infra/docker/docker-compose.prod.yml config -q
```

Dependabot (`.github/dependabot.yml`) also proposes digest/tag updates, which is
preferred because CI builds and scans the result. Never replace a digest with a
bare floating tag.
