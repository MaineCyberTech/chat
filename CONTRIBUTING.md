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
# Unit tests
pnpm test

# E2E tests (requires local Supabase)
pnpm test:e2e

# Coverage report
pnpm test -- --coverage
```

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
