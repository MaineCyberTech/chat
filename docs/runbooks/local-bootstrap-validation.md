# Local Bootstrap & Validation

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (install with `npm install -g pnpm@9`)

## Bootstrap

```bash
pnpm install
cp .env.local.example .env.local   # Edit with Supabase credentials
pnpm dev                              # Start API (4000) + Web (3000)
```

## Validation Commands

```bash
pnpm format:check   # Check code formatting
pnpm lint           # Run ESLint (4 workspaces)
pnpm typecheck      # Run TypeScript type checking
pnpm test           # Run 49 unit tests (11 files)
pnpm build          # Build all packages + Next.js
pnpm check          # Run all of the above
```

## Running Apps Locally

```bash
pnpm dev            # Start all dev servers (Turbo)
# or individually:
pnpm --filter web dev    # Next.js at localhost:3000
pnpm --filter api dev    # Express at localhost:4000
```

## E2E Tests

```bash
pnpm exec playwright install chromium
pnpm test:e2e
# Web app must be running for E2E tests
```

## Troubleshooting

- **`pnpm` not found**: Install via `npm install -g pnpm@9`
- **Type errors in web app**: Run `pnpm build` from root first
- **Module resolution errors**: Delete `node_modules` and rerun `pnpm install`
- **API starts without database**: Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`
