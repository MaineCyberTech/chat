# Local Development Setup

## Required Tooling

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 20 | [nodejs.org](https://nodejs.org) |
| pnpm | >= 9 | `npm install -g pnpm@9` |
| Docker Desktop | Latest | [docker.com](https://docker.com) (for Supabase) |

## One-Command Setup

```powershell
# Windows
.\scripts\setup-dev.ps1
```
```bash
# Mac/Linux
bash scripts/setup-dev.sh
```

This does everything: installs deps, builds packages, starts local Supabase, auto-fills API keys, runs SQL migrations.

Then:
```bash
pnpm dev
```

Opens `localhost:3000` (frontend), `localhost:4000` (API), `localhost:54323` (Supabase Studio).

## Without Docker

If Docker isn't available, skip Supabase and run directly:

```bash
pnpm install
cp .env.local.example .env.local
pnpm build
pnpm dev
```

The app runs without Supabase — auth won't work, but the landing page and UI are testable.

## Run SQL Migrations

Migrations are auto-run by the setup script. To run manually in Supabase Studio:

Open `http://localhost:54323` → SQL Editor → run files in order:
1. `packages/db/sql/migrations/001_users.sql`
2. `packages/db/sql/functions/handle_new_user.sql`
3. `packages/db/sql/policies/users_rls.sql`
4-11: remaining migrations + policies

## Teardown

```powershell
.\scripts\teardown-dev.ps1
```

Stops local Supabase, cleans build artifacts.

## Before Committing

```bash
pnpm check        # Run format, lint, typecheck, and tests
```

## Adding a New Package

1. Create directory under `apps/` or `packages/`
2. Add `package.json` with `name` matching `@chat/<name>`
3. Extend `../../tsconfig.base.json` in your `tsconfig.json`
4. Add scripts: `dev`, `build`, `lint`, `typecheck`, `test`
5. Wire into `turbo.json` if you add a new task type
