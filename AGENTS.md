# AGENTS.md — Architecture & Implementation Status

## Architecture Overview

```
Browser → Cloudflare DNS → Caddy (TLS) → web:3000 (Next.js)
                                        → api:4000 (Express + Socket.io)
                                              → Supabase (PostgreSQL)
```

**Reverse Proxy**: Caddy 2 (zero-config TLS, auto ACME)
**DNS**: Cloudflare (proxied for DDoS protection)
**Compute**: Single DigitalOcean droplet (Ubuntu 24.04, s-1vcpu-512mb-10gb)

## Repository Map

| Directory            | Purpose                  | Key Files                                                                     |
| -------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `apps/api/`          | Express API server       | `src/app.ts`, `src/modules/*/`, `Dockerfile`                                  |
| `apps/web/`          | Next.js 15 frontend      | `app/`, `components/`, `lib/`                                                 |
| `packages/ui/`       | Shared React components  | `src/components/button.tsx`, etc.                                             |
| `packages/db/`       | Supabase client + types  | `src/config.ts`, `sql/`                                                       |
| `infra/docker/`      | Compose files, Caddyfile | `docker-compose.devremote.yml`                                                |
| `infra/terraform/`   | DO droplet + DNS         | `main.tf`, `templates/cloud-init.yaml.tftpl`                                  |
| `.github/workflows/` | CI/CD pipelines          | `ci.yml`, `deploy-development.yml`, `build-push.yml`, `infra-development.yml` |
| `scripts/`           | Dev tooling              | `setup-dev.ps1`, `teardown-dev.ps1`                                           |
| `supabase/`          | Local Supabase config    | `config.toml`                                                                 |

## Implementation Status

### Complete

- Magic link auth (Supabase) with JWT middleware
- Workspaces & channels CRUD with RLS policies
- Real-time messaging (Socket.io rooms, typing, presence)
- Threaded replies, message edit/delete
- File uploads (Supabase Storage signed URLs)
- Full-text search (PostgreSQL tsvector)
- Rate limiting + Zod validation on all API routes
- 7 UI components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton)
- 5 SQL migrations, 4 RLS policy sets, 2 functions
- 49 unit tests across 11 files
- Caddy reverse proxy with auto-TLS
- Docker multi-stage builds (node:22-alpine)
- CI pipeline (validate → build images → push GHCR)
- Deploy pipeline (provision → pipe images → compose up → health check)
- Infra pipeline (Terraform import → apply → SSH health check)
- Local dev with Supabase CLI
- One-command setup/teardown scripts

### Known Issues

- **Let's Encrypt rate-limited**: Caddy can't issue certs until June 21 (168h rate limit after 5 failed Traefik attempts). Workaround: Cloudflare SSL set to Flexible.
- **512MB droplet OOM**: Next.js + Express + Caddy push RAM limits. Swap file mitigates but upgrade to 1-2GB recommended.
- **Infra workflow creates new droplets**: Terraform import of existing droplet isn't reliable. Cleanup step deletes old duplicates as a workaround.
- **Docker build timeouts**: `pnpm install` in Docker is slow (~15min). GHA cache helps on subsequent builds.

### Remaining Work

| Priority | Task                           | Notes                                                          |
| -------- | ------------------------------ | -------------------------------------------------------------- |
| HIGH     | Fix Let's Encrypt certs        | Will auto-resolve after June 21 rate limit expiry              |
| HIGH     | Upgrade droplet to s-2vcpu-2gb | 512MB is too small for 3 containers                            |
| MEDIUM   | Terraform remote state backend | S3 backend to persist state between CI runs                    |
| MEDIUM   | E2E test expansion             | Currently only homepage check                                  |
| LOW      | Production deploy workflow     | `deploy-production.yml` exists but untested with `.com` domain |
| LOW      | Email notifications            | No notification system yet                                     |
| LOW      | User profile avatars           | Avatar component exists but no upload flow                     |

## GitHub Actions Workflows

| Workflow                 | Trigger                 | Purpose                                                               |
| ------------------------ | ----------------------- | --------------------------------------------------------------------- |
| `ci.yml`                 | push main/develop, PR   | Validate (lint, typecheck, 49 tests, build)                           |
| `build-push.yml`         | push develop            | Build Docker images → push to GHCR `:dev` tag                         |
| `deploy-development.yml` | push develop            | SSH to droplet, transfer files, pipe images, compose up, health check |
| `infra-development.yml`  | push infra/\*\* changes | Terraform provision droplet + DNS + firewall                          |

## Environments

| Environment | Frontend                | API                         | GitHub  |
| ----------- | ----------------------- | --------------------------- | ------- |
| Development | chat.mainecybertech.us  | chat-api.mainecybertech.us  | develop |
| Production  | chat.mainecybertech.com | chat-api.mainecybertech.com | main    |
| Local       | localhost:3000          | localhost:4000              | N/A     |

## Local Development

```powershell
# One-time setup
.\scripts\setup-dev.ps1

# Start dev servers
pnpm dev

# Cleanup
.\scripts\teardown-dev.ps1
```

## Secrets Required

| Secret                      | Used By       |
| --------------------------- | ------------- |
| `DO_API_TOKEN`              | infra, deploy |
| `CI_SSH_PUBLIC_KEY`         | infra         |
| `CI_SSH_PRIVATE_KEY`        | deploy        |
| `CF_API_TOKEN`              | infra         |
| `CF_ZONE_ID`                | infra         |
| `SUPABASE_URL`              | deploy, build |
| `SUPABASE_ANON_KEY`         | deploy, build |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy        |
| `GITHUB_TOKEN`              | auto-provided |
