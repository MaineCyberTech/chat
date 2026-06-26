# Chat Platform — Engineering Guide

## Quick Start

```powershell
# One-time setup
.\scripts\setup-dev.ps1

# Start all services
pnpm dev

# Open in browser
start http://localhost:3000
```

## Architecture

```
Browser → Cloudflare DNS → Caddy (TLS) → web:3000 (Next.js)
                                        → api:4000 (Express + Socket.io)
                                              → Supabase (PostgreSQL)
```

- **Frontend**: Next.js 15 App Router (`apps/web/`)
- **API**: Express + Socket.io (`apps/api/`)
- **Shared**: UI components (`packages/ui/`), DB types (`packages/db/`)
- **Database**: Supabase (PostgreSQL with RLS)

## Key Conventions

| Area          | Convention                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Auth          | Per-request Supabase client via `getSupabaseForUser(jwt)`                                            |
| Authorization | Route-level middleware: `requireWorkspaceMembership`, `requireChannelAccess`, `requireMessageAccess` |
| Validation    | Zod schemas in `apps/api/src/config/validators.ts`                                                   |
| API route     | `router.get("/path", authenticate, middleware, handler)`                                             |
| Audit events  | `logAuditEvent()` after mutating operations                                                          |
| Metrics       | Prometheus via `apps/api/src/lib/metrics.ts`, exposed at `GET /metrics`                              |

## Key Commands

```bash
pnpm dev        # Start all dev servers
pnpm build      # TypeScript compile + Next.js build
pnpm test       # Run all tests
pnpm lint       # ESLint across all packages
pnpm typecheck  # TypeScript type checking
pnpm format     # Prettier formatting
```

## Project Map

| Directory                  | What's Inside                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/`    | Feature modules (auth, workspaces, channels, messages, notifications, webhooks, preferences) |
| `apps/api/src/middleware/` | Auth, rate-limiting, CSRF, security headers, membership checks                               |
| `apps/web/app/`            | Next.js App Router pages and layouts                                                         |
| `apps/web/components/`     | React components by feature                                                                  |
| `packages/db/`             | Supabase client, DB types, SQL migrations                                                    |
| `packages/ui/`             | Shared UI component library                                                                  |
| `infra/`                   | Docker, Caddy, Terraform configs                                                             |
| `scripts/`                 | Dev tooling (setup, teardown)                                                                |
| `.github/workflows/`       | CI/CD pipelines                                                                              |

## Environments

| Environment | Domain                  | Branch    |
| ----------- | ----------------------- | --------- |
| Development | chat.mainecybertech.us  | `develop` |
| Production  | chat.mainecybertech.com | `main`    |
| Local       | localhost:3000          | N/A       |

## Deployment

CI/CD is fully automated via GitHub Actions. Pushing to `develop` triggers build → push → deploy automatically. See `.github/workflows/` for workflow details and `docs/runbooks/` for deployment runbooks.
