# Contributing to Chat Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Workflow

### 1. Setup Local Development Environment

```bash
# One-time setup (Windows PowerShell)
.\scripts\setup-dev.ps1

# Or on Linux/macOS
bash scripts/setup-dev.sh

# Start development servers
pnpm dev
```

### 2. Code Quality Standards

Before submitting a PR, ensure your code passes all quality checks:

```bash
# Run all checks
pnpm check

# Individual checks
pnpm lint      # ESLint + Prettier
pnpm typecheck # TypeScript compilation
pnpm test      # Unit tests with coverage
pnpm build     # Build all packages
```

### 3. Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Keep commits atomic and focused
- Pre-commit hooks run Prettier automatically on staged files

### 4. Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with tests
3. Ensure all CI checks pass
4. Request review from maintainers
5. Address feedback
6. Squash and merge after approval

## Architecture Overview

```
apps/
  api/          # Express API server (port 4000)
  web/          # Next.js 15 frontend (port 3000)
packages/
  db/           # Supabase client, types, SQL migrations
  ui/           # Shared React component library
infra/
  docker/       # Docker Compose, Caddy configs
  terraform/    # DigitalOcean infrastructure
```

## Key Technologies

- **Monorepo**: PNPM + Turborepo
- **API**: Express + TypeScript + Zod validation
- **Frontend**: Next.js 15 + React 19 + Tailwind v4
- **Database**: Supabase (PostgreSQL) with RLS
- **Real-time**: Socket.io
- **Auth**: Supabase Magic Links + JWT
- **Deploy**: Docker + Caddy + GitHub Actions

## Testing

```bash
pnpm test              # Unit + integration tests (Vitest)
pnpm test:e2e          # E2E tests (Playwright, requires local Supabase)
pnpm test:e2e:ui       # E2E tests with Playwright UI inspector
pnpm test -- --coverage # Coverage report
```

Tests live in `__tests__/` directories next to source. E2E tests are in `apps/web/e2e/` and `tests/e2e/`.

## Database Migrations

Migrations use the Supabase CLI. Place SQL files in `supabase/migrations/` with a timestamp prefix:

```
supabase/migrations/20260718000000_add_feature.sql
```

Each migration must have a corresponding rollback in `supabase/rollback/`:

```
supabase/rollback/20260718000000_add_feature_down.sql
```

Apply locally:

```bash
supabase db push
# or
supabase db reset
```

Verify on CI before merge — the `supabase-migrations` workflow runs `supabase db push` against the hosted project.

Guidelines:

- One logical change per migration
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Include `-- up` / `-- down` comments at the top
- Test rollback locally before pushing

## Adding i18n Keys

All UI strings go through the i18n system. Translation files live in `apps/web/messages/` by locale (e.g. `en.json`).

1. Add new keys to `apps/web/messages/en.json` in the appropriate category:

```json
{
  "auth": {
    "login": {
      "emailLabel": "Email",
      "passwordLabel": "Password",
      "submitButton": "Sign In"
    }
  }
}
```

2. Use in components:

```tsx
import { useLocale } from "@/lib/i18n";

function LoginForm() {
  const { t } = useLocale();
  return <input aria-label={t("auth.login.emailLabel")} />;
}
```

3. For pluralization:

```tsx
t("messages.count", { count: 5 }); // resolves "5 messages" or "1 message"
```

4. To extract new keys for translation:

```bash
pnpm --filter @chat/web i18n:extract
```

Categories: `auth`, `chat`, `sidebar`, `settings`, `admin`, `search`, `notifications`, `onboarding`, `formatting`, `shortcuts`, `groups`, `status`, `errors`, `common`.

## PR Checklist

- [ ] All CI checks pass: `pnpm check` (format, lint, typecheck, test)
- [ ] New features include unit tests
- [ ] UI changes include i18n keys (added to `en.json`)
- [ ] Database changes include forward migration + rollback script
- [ ] API changes documented in `docs/api/changelog.json`
- [ ] New environment variables documented in `.env.example` and `docs/environments/env-vars.md`
- [ ] No secrets or keys committed
- [ ] Rebased on latest `develop`, conflicts resolved
- [ ] PR title follows conventional commits format (`feat:`, `fix:`, etc.)

## Documentation

- **Architecture**: `docs/architecture/`
- **Runbooks**: `docs/runbooks/`
- **Contributing**: `docs/contributing/`
- **Environments**: `docs/environments/`

## Reporting Issues

- **Security issues**: See [SECURITY.md](SECURITY.md)
- **Bug reports**: Use GitHub Issues with the bug template
- **Feature requests**: Use GitHub Issues with the feature template

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to uphold this code.
