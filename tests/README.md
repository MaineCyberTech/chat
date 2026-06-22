# Tests

```
tests/
  e2e/           End-to-end tests (Playwright)
  integration/   Integration tests (future phases)
  setup/         Test setup files (Vitest configuration)
```

## Running Tests

```bash
pnpm test          # Run unit tests
pnpm test:e2e      # Run end-to-end tests
pnpm test:e2e:ui   # Run E2E tests with Playwright UI
```

## Current Status

- Unit tests: 54 tests across 12 files (API services, middleware, UI components, auth flow, web components)
- E2E tests: Playwright scaffold with basic homepage check
- Integration tests: Placeholder directory for future phases
