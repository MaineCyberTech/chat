# Chat Platform

Real-time workspace communication platform (Slack/Discord inspired) built with Next.js, Express, Socket.io, and Supabase.

**Status: Implemented** — Auth, workspaces, channels, real-time messaging, file uploads, search, CI/CD, and infrastructure are built. Deploy-ready pending external configuration.

## Tech Stack

- **Frontend**: Next.js 15 App Router, Tailwind CSS 4, Socket.io client
- **Backend**: Express.js, Socket.io, TypeScript, Zod validation, rate limiting
- **Auth/Data**: Supabase (PostgreSQL, JWT auth, RLS, FTS)
- **Infra**: Docker multi-stage, Traefik, Terraform (DigitalOcean), GitHub Actions CI/CD

## Repo Structure

```
apps/
  api/        Express API: auth, workspaces, channels, messages, search, uploads
  web/        Next.js App Router with real-time chat UI
packages/
  ui/         Shared component library (7 components, 11 tests)
  db/         Supabase client + SQL migrations (5 tables, RLS, FTS)
infra/
  docker/     Docker Compose + Traefik with health checks
  terraform/  DigitalOcean droplet + DNS provisioning
docs/         Architecture, runbooks, contributing
```

## Quickstart

```bash
# Prerequisites: Node 20+, pnpm 9+
pnpm install
cp .env.local.example .env.local   # Fill in Supabase credentials
pnpm dev                            # Start API (port 4000) + Web (port 3000)
```

## Commands

| Command         | Purpose                          |
| --------------- | -------------------------------- |
| `pnpm dev`      | Start all dev servers            |
| `pnpm build`    | Build all packages               |
| `pnpm check`    | Lint + format + typecheck + test |
| `pnpm test`     | Run 45 unit tests (10 files)     |
| `pnpm test:e2e` | Playwright E2E tests             |
| `pnpm ci`       | CI-equivalent (frozen lockfile)  |

## Features

- Magic link authentication with JWT middleware
- Workspaces and channels with RLS policies
- Real-time messaging via Socket.io (rooms, typing, presence)
- Threaded replies and message editing
- File uploads via Supabase Storage
- Full-text message search (PostgreSQL tsvector)
- Online user presence tracking
- Rate limiting and Zod request validation
- Multi-stage Docker builds with health checks
- CI/CD: validate → build images → push GHCR → deploy SSH + health check
- Terraform: droplet, firewall, DNS A records
