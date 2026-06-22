# Chat Platform

Real-time workspace communication platform (Slack/Discord inspired) built with Next.js, Express, Socket.io, and Supabase.

**Status: Implemented** — Auth, workspaces, channels, real-time messaging, file uploads, search, CI/CD, and infrastructure are built. See [AGENTS.md](AGENTS.md) for architecture and remaining work.

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

Push to `develop` → [GitHub Actions](https://github.com/MaineCyberTech/chat/actions) deploys to `chat.mainecybertech.us`.

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
- CI/CD pipeline (validate → build → deploy → health check)
- Terraform infrastructure provisioning
- Local Supabase development environment
