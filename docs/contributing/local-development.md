# Local Development Setup

## Required Tooling

| Tool    | Version | Install                          |
| ------- | ------- | -------------------------------- |
| Node.js | >= 20   | [nodejs.org](https://nodejs.org) |
| pnpm    | >= 9    | `npm install -g pnpm@9`          |

## Getting Started

```bash
git clone <repo-url>
cd chat
pnpm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase project credentials
pnpm dev
```

This starts:

- `apps/web` at http://localhost:3000 (Next.js)
- `apps/api` at http://localhost:4000 (Express + Socket.io)

The API starts without Supabase credentials (health endpoints only).
Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local` for full features.

## Run SQL Migrations

Run these in order in the Supabase SQL Editor:

1. `packages/db/sql/migrations/001_users.sql`
2. `packages/db/sql/functions/handle_new_user.sql`
3. `packages/db/sql/policies/users_rls.sql`
4. `packages/db/sql/migrations/002_workspaces.sql`
5. `packages/db/sql/policies/workspaces_rls.sql`
6. `packages/db/sql/migrations/003_channels.sql`
7. `packages/db/sql/policies/channels_rls.sql`
8. `packages/db/sql/migrations/004_messages.sql`
9. `packages/db/sql/policies/messages_rls.sql`
10. `packages/db/sql/migrations/005_search.sql`
11. `packages/db/sql/policies/storage_rls.sql`

## Development Workflow

```bash
pnpm dev          # Start all apps (Turbo watches all packages)
```

This starts:

- `apps/web` at http://localhost:3000 (Next.js)
- `apps/api` at http://localhost:4000 (Express)

## Before Committing

```bash
pnpm check        # Run format, lint, typecheck, and tests
```

This should pass clean. The CI pipeline runs the same checks.

## Adding a New Package

1. Create directory under `apps/` or `packages/`
2. Add `package.json` with `name` matching `@chat/<name>`
3. Extend `../../tsconfig.base.json` in your `tsconfig.json`
4. Add scripts: `dev`, `build`, `lint`, `typecheck`, `test`
5. Wire into `turbo.json` if you add a new task type
