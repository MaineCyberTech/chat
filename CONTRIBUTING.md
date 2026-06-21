# Contributing

## Getting Started

```bash
pnpm install
pnpm dev
```

See `scripts/setup-dev.ps1` for full local environment setup.

## Development Workflow

1. Branch from `develop`
2. Make changes
3. Run `pnpm check` (format + lint + typecheck + test)
4. Push and open a PR to `develop`

## Code Standards

- TypeScript strict mode
- Zod validation on all API inputs
- ESLint + Prettier enforced via husky pre-commit
- Vitest for unit/integration tests, Playwright for E2E
- Feature-based module organization in `apps/api/src/modules/`

## Testing

```bash
pnpm test         # unit + integration
pnpm test:e2e     # Playwright E2E
pnpm test -- --coverage  # with coverage report
```

## Pull Request Guidelines

- Keep PRs focused on a single concern
- Include tests for new functionality
- Update AGENTS.md if architecture changes
- All CI checks must pass before merge

## Questions

Open an issue or reach out to the maintainers.
