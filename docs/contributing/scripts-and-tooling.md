# Scripts & Tooling

## Root Scripts

| Script              | What It Does                                         |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Start all dev servers (Turbo)                        |
| `pnpm build`        | Build all apps/packages                              |
| `pnpm lint`         | Run ESLint across all workspaces                     |
| `pnpm format`       | Format code with Prettier                            |
| `pnpm format:check` | Check formatting (CI-friendly)                       |
| `pnpm typecheck`    | Run TypeScript type checking                         |
| `pnpm test`         | Run unit tests (Vitest)                              |
| `pnpm test:unit`    | Run unit tests directly                              |
| `pnpm test:e2e`     | Run Playwright E2E tests                             |
| `pnpm test:e2e:ui`  | Run E2E tests with Playwright UI                     |
| `pnpm check`        | Full validation: format + lint + typecheck + test    |
| `pnpm clean`        | Clean build artifacts                                |
| `pnpm ci`           | CI-equivalent (frozen lockfile + full check + build) |

## Package Scripts

Each package in `apps/*` and `packages/*` exposes a consistent set:

| Script      | API          | Web          | UI           | DB           |
| ----------- | ------------ | ------------ | ------------ | ------------ |
| `dev`       | tsx watch    | next dev     | —            | —            |
| `build`     | tsc          | next build   | tsc          | tsc          |
| `lint`      | eslint       | next lint    | eslint       | eslint       |
| `typecheck` | tsc --noEmit | tsc --noEmit | tsc --noEmit | tsc --noEmit |
| `test`      | vitest run   | vitest run   | vitest run   | placeholder  |
| `start`     | node dist/   | next start   | —            | —            |

## Config Files

| File                   | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `tsconfig.base.json`   | Shared TS config inherited by all packages  |
| `eslint.config.mjs`    | Flat ESLint config with TypeScript support  |
| `.prettierrc.json`     | Prettier formatting rules + Tailwind plugin |
| `vitest.config.ts`     | Unit/integration test runner config         |
| `playwright.config.ts` | E2E test runner config                      |
| `turbo.json`           | Turborepo task pipeline                     |

## Conventions

- All TypeScript, strict mode enabled
- ES modules (`"type": "module"`)
- Test files in `__tests__/` directories next to source
- Environment variables validated with `zod`
- Components use Tailwind CSS classes
- API imports use `.js` extensions (Node.js ESM)
- Frontend imports are extensionless (bundler/Next.js resolution)
