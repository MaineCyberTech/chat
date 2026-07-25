[![CI](https://github.com/MaineCyberTech/chat/actions/workflows/ci.yml/badge.svg)](https://github.com/MaineCyberTech/chat/actions/workflows/ci.yml) [![Deploy Development](https://github.com/MaineCyberTech/chat/actions/workflows/deploy-development.yml/badge.svg)](https://github.com/MaineCyberTech/chat/actions/workflows/deploy-development.yml) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

# Chat Platform

Real-time workspace communication platform (Slack/Discord inspired) built with Next.js, Express, Socket.io, and Supabase.

**Status: Implemented** â€” Auth, workspaces, channels, real-time messaging, file uploads, search, CI/CD, and infrastructure are built. See [AGENTS.md](AGENTS.md) for architecture and remaining work.

## Quickstart

```powershell
# One-command setup (Windows)
.\scripts\setup-dev.ps1
pnpm dev
```

```bash
# One-command setup (Mac/Linux)
bash scripts/setup-dev.sh
pnpm dev
```

Opens `localhost:3000` (frontend) + `localhost:4000` (API) + `localhost:54323` (Supabase Studio).

## Deploy

Push to `develop` â†’ [GitHub Actions](https://github.com/MaineCyberTech/chat/actions) deploys to `chat.mainecybertech.us`.

## Commands

| Command                        | Purpose                          |
| ------------------------------ | -------------------------------- |
| `pnpm dev`                     | Start all dev servers            |
| `pnpm build`                   | Build all packages               |
| `pnpm check`                   | Lint + format + typecheck + test |
| `pnpm test`                    | Run 54 unit tests (12 files)     |
| `pnpm supabase:start`          | Start local Supabase             |
| `pnpm supabase:stop`           | Stop local Supabase              |
| `.\\scripts\\setup-dev.ps1`    | Full local setup                 |
| `.\\scripts\\teardown-dev.ps1` | Stop Supabase + clean artifacts  |

## Features

- Magic link authentication with JWT middleware
- Workspaces and channels with RLS policies
- Real-time messaging via Socket.io (rooms, typing, presence)
- Threaded replies and message editing
- File uploads via Supabase Storage
- Full-text message search (PostgreSQL tsvector)
- Online user presence tracking
- Rate limiting and Zod request validation
- Multi-stage Docker builds

## Tech Stack

| Layer      | Technology                                                                   |
| ---------- | ---------------------------------------------------------------------------- |
| Frontend   | Next.js 15, React 19, TypeScript, Tailwind CSS                               |
| Backend    | Express, Socket.io, BullMQ (Redis workers)                                   |
| Database   | Supabase (PostgreSQL), pgvector, pg_cron                                     |
| Realtime   | Socket.io with Redis adapter, LiveKit WebRTC                                 |
| Workers    | 4 BullMQ processors (webhooks, notifications, search, cleanup)               |
| Auth       | Supabase Auth (magic link), JWT middleware, RBAC (18 permissions Ã— 3 roles) |
| Infra      | Docker Compose, Caddy (TLS), DigitalOcean, Terraform                         |
| CI/CD      | GitHub Actions (19 workflows), Playwright E2E                                |
| Monitoring | Sentry, k6 load testing, Playwright visual snapshots                         |

## Scripts

| Command                      | Purpose                          |
| ---------------------------- | -------------------------------- |
| `pnpm dev`                   | Start all dev servers            |
| `pnpm build`                 | Build all packages               |
| `pnpm check`                 | Lint + format + typecheck + test |
| `pnpm lint`                  | ESLint across all packages       |
| `pnpm test`                  | Run 54 unit tests (12 files)     |
| `pnpm typecheck`             | TypeScript type checking         |
| `pnpm supabase:start`        | Start local Supabase             |
| `pnpm supabase:stop`         | Stop local Supabase              |
| `pnpm storybook`             | Launch Storybook UI              |
| `.\scripts\setup-dev.ps1`    | Full local setup                 |
| `.\scripts\teardown-dev.ps1` | Stop Supabase + clean artifacts  |

## Architecture

See [docs/architecture/](docs/architecture/) for detailed architecture docs, runbooks, and audit reports.

- CI/CD pipeline (validate â†’ build â†’ deploy â†’ health check)
- Terraform infrastructure provisioning
- Local Supabase development environment
