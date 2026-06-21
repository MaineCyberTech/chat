# Phase 7 — Patch Set Design / Execution Plan

## Patch Set 1: Supabase Structure Alignment

- **Objective**: Add seeds, extract policies, create functions placeholder
- **Areas touched**: `supabase/seeds/`, `supabase/policies/`, `supabase/functions/`
- **Why together**: All Supabase organizational improvements, no code changes
- **Benefit**: Reproducible local dev, browsable policy files
- **Risk**: None
- **Prerequisites**: None
- **Validation**: `supabase start` loads seed data correctly, policies are parseable SQL
- **Rollback**: Delete the created directories
- **Visual QA**: No
- **Integration tests**: No

### Files

```
supabase/seeds/00_test_user.sql              [CREATE]
supabase/seeds/01_test_workspace.sql         [CREATE]
supabase/seeds/02_test_channel.sql           [CREATE]
supabase/seeds/README.md                     [CREATE]
supabase/policies/01_workspaces_rls.sql      [CREATE]
supabase/policies/02_channels_rls.sql        [CREATE]
supabase/policies/03_messages_rls.sql        [CREATE]
supabase/policies/04_audit_logs_rls.sql      [CREATE]
supabase/policies/05_webhooks_rls.sql        [CREATE]
supabase/functions/.gitkeep                  [CREATE]
```

---

## Patch Set 2: Shared Config Package

- **Objective**: Create `packages/config/` with shared ESLint + TSConfig, update existing packages to extend it
- **Areas touched**: `packages/config/`, various `tsconfig.json` and `eslint.config.mjs` files
- **Why together**: All config centralization — one cohesive change
- **Benefit**: Single source of truth for tooling config, easier maintenance
- **Risk**: Low — all changes are additive (extend, don't replace)
- **Prerequisites**: None
- **Validation**: `pnpm typecheck` passes across all packages, `pnpm lint` passes
- **Rollback**: Revert each tsconfig/eslint.config change, delete packages/config/
- **Visual QA**: No
- **Integration tests**: No

### Files

```
packages/config/package.json                 [CREATE]
packages/config/eslint.base.mjs              [CREATE]
packages/config/tsconfig.base.json           [CREATE]
apps/api/tsconfig.json                       [MODIFY — extend base]
apps/web/tsconfig.json                       [MODIFY — extend base]
packages/db/tsconfig.json                    [MODIFY — extend base]
packages/ui/tsconfig.json                    [MODIFY — extend base]
apps/api/eslint.config.mjs                   [MODIFY — extend base]
apps/web/eslint.config.mjs                   [MODIFY — extend base]
```

---

## Patch Set 3: Environment Variable Documentation

- **Objective**: Complete .env.example files with all documented env vars
- **Areas touched**: `apps/api/.env.example`, `apps/web/.env.example`
- **Why together**: Both are documentation-only changes
- **Benefit**: Easier onboarding, fewer runtime surprises
- **Risk**: None
- **Prerequisites**: None
- **Validation**: Visual inspection
- **Rollback**: Revert to previous .env.example content
- **Visual QA**: No
- **Integration tests**: No

### Files

```
apps/api/.env.example                        [MODIFY]
apps/web/.env.example                        [MODIFY]
```

---

## Patch Set 4: Legacy Cleanup

- **Objective**: Remove unused Traefik config, clean up empty integration tests dir
- **Areas touched**: `infra/docker/traefik/`, `tests/integration/`
- **Why together**: Both are cleanup of dead/empty directories
- **Benefit**: Less clutter, accurate repo representation
- **Risk**: Low — Traefik is unused (migrated to Caddy), integration tests dir is empty
- **Prerequisites**: Verify Traefik is not referenced in any active compose file or workflow
- **Validation**: `git grep -i traefik` returns no matches in active configs
- **Rollback**: Restore from git
- **Visual QA**: No
- **Integration tests**: No

### Files

```
infra/docker/traefik/traefik.yml             [REMOVE]
tests/integration/README.md                  [REMOVE]
```

---

## Patch Set 5: E2E Test Expansion

- **Objective**: Add Playwright tests for primary user flows
- **Areas touched**: `tests/e2e/`
- **Why together**: All e2e test additions
- **Benefit**: Regression protection for core features
- **Risk**: Low — tests don't affect production code
- **Prerequisites**: Local Supabase with seed data (Patch Set 1)
- **Validation**: `pnpm test:e2e` passes
- **Rollback**: Delete the test files
- **Visual QA**: No
- **Integration tests**: Yes — these ARE integration tests

### Files

```
tests/e2e/workspace.spec.ts                  [CREATE]
tests/e2e/channel.spec.ts                    [CREATE]
tests/e2e/message.spec.ts                    [CREATE]
```

---

## Patch Set 6: Local Stack Script

- **Objective**: Add bootstrap script for local dev environment setup
- **Areas touched**: `scripts/`
- **Why together**: One cohesive script addition
- **Benefit**: One-command local setup
- **Risk**: Low — scripts don't affect production
- **Prerequisites**: Patch Set 1 (seed data)
- **Validation**: Run script in clean environment, verify dev server starts
- **Rollback**: Delete the script
- **Visual QA**: No
- **Integration tests**: No

### Files

```
scripts/start-local-stack.ps1                [CREATE]
```

---

## Top 25 Prioritized Recommendations

| #   | Recommendation                                  | Patch Set  | Value  | Risk   | Effort |
| --- | ----------------------------------------------- | ---------- | ------ | ------ | ------ |
| 1   | Add seed data for local dev                     | PS1        | High   | None   | 30m    |
| 2   | Extract RLS policies to separate files          | PS1        | Medium | None   | 15m    |
| 3   | Create shared config package                    | PS2        | Medium | Low    | 30m    |
| 4   | Complete .env.example files                     | PS3        | Medium | None   | 15m    |
| 5   | Remove legacy Traefik config                    | PS4        | Low    | Low    | 5m     |
| 6   | Add workspace e2e test                          | PS5        | High   | None   | 1h     |
| 7   | Add channel e2e test                            | PS5        | High   | None   | 1h     |
| 8   | Add message e2e test                            | PS5        | High   | None   | 1h     |
| 9   | Add local stack bootstrap script                | PS6        | Medium | None   | 1h     |
| 10  | Add integration tests for API modules           | Future     | High   | Low    | 2d     |
| 11  | Add security headers middleware                 | Future     | Medium | Low    | 30m    |
| 12  | Add NOT NULL/unique constraints to schema       | Future     | Medium | Low    | 1h     |
| 13  | Add AGENTS.md update with updated architecture  | Continuous | Low    | None   | 30m    |
| 14  | Add JSDoc to public API module interfaces       | Future     | Low    | None   | 1h     |
| 15  | Add Supabase migration naming convention doc    | Future     | Low    | None   | 15m    |
| 16  | Add Docker compose health check troubleshooting | Future     | Low    | None   | 15m    |
| 17  | Add Pino logger pretty-print config for dev     | Future     | Low    | None   | 10m    |
| 18  | Add rate limit configuration docs               | Future     | Low    | None   | 10m    |
| 19  | Add CORS configuration docs                     | Future     | Low    | None   | 10m    |
| 20  | Add Socket.io event contract docs               | Future     | Medium | None   | 30m    |
| 21  | Add CI/CD pipeline documentation                | Future     | Low    | None   | 30m    |
| 22  | Add Terraform state backend setup               | Phase 3    | Medium | Medium | 1h     |
| 23  | Add worker app (BullMQ + Redis)                 | Phase 3    | High   | Medium | 3d     |
| 24  | Add notification system                         | Phase 3    | High   | Medium | 2d     |
| 25  | Add client SDK package                          | Phase 3    | Medium | Medium | 2d     |

---

## Quick Wins

Items 1-9 from the top 25 (Patch Sets 1-6) are all quick wins:

- **Zero risk**: PS1, PS3, PS4, PS6
- **Documentation only**: PS3
- **Tests only**: PS5

Estimated total: ~4-5 hours for all 9 quick wins.

---

## Needs-Tests-First List

Before any production code changes:

- Auth middleware changes → existing auth.service.test.ts + new auth.integration.test.ts
- Socket.io event contract changes → new socket.e2e.spec.ts
- Caddy route mapping changes → new deploy.e2e.spec.ts
- Database schema changes → migration dry-run + existing service tests
- Shared package restructuring → existing typecheck + build pass

---

## Copy-from-Reference List

| Item                       | Source                         | Destination                     | Notes                                          |
| -------------------------- | ------------------------------ | ------------------------------- | ---------------------------------------------- |
| Seed data pattern          | `supabase/seeds/` structure    | `supabase/seeds/`               | Adapt content for chat domain                  |
| Policy extraction pattern  | `supabase/policies/`           | `supabase/policies/`            | Extract from existing migrations               |
| Config package pattern     | `packages/config/` structure   | `packages/config/`              | Adapt for current toolchain (Vitest, not Jest) |
| Local stack script concept | `scripts/start-local-stack.sh` | `scripts/start-local-stack.ps1` | Adapt for chat domain                          |

---

## Adapt-Don't-Copy List

| Reference Pattern             | Adaptation Needed                                  | Reason                                 |
| ----------------------------- | -------------------------------------------------- | -------------------------------------- |
| `routes/` flat structure      | Already adapted — modules/ is better               | Keep current approach                  |
| `packages/sdk/`               | Adapt as simpler client wrapper                    | Don't need 21-module SDK for 5 modules |
| `supabase/migrations/` naming | Adopt systematic naming (YYYYMMDD_description.sql) | Current has no naming convention       |
| `scripts/backup-database.*`   | Adapt when data volume grows                       | Not needed yet                         |
| `scripts/load-testing/`       | Adapt with k6 or artillery                         | Use different tooling than reference   |

---

## Leave-Alone List

| Area                                | Reason                                             |
| ----------------------------------- | -------------------------------------------------- |
| `apps/api/src/modules/` (structure) | Superior to reference routes/ pattern              |
| Socket.io event contracts           | Core real-time feature, working well               |
| Same-domain Caddy routing           | Simpler than reference subdomain split             |
| Vitest test framework               | Modern, fast, ESM-native                           |
| Docker HEALTHCHECK                  | Reference lacks this — current is better           |
| Graceful shutdown handlers          | Current handles SIGTERM/SIGINT; reference doesn't  |
| `packages/ui/` component library    | Reference has no equivalent — current is better    |
| tailwindcss v4                      | Reference uses v3 — no reason to downgrade         |
| pnpm@9.15.4                         | Reference uses pnpm@10 — no benefit to upgrade yet |
| `apps/web/app/` route groups        | Current (auth, workspace) suits chat domain        |

---

## Best Order of Execution

```
Phase 1 (~1 day):
  1. Patch Set 1 — Supabase structural alignment
  2. Patch Set 2 — Shared config package
  3. Patch Set 3 — Environment variable docs
  ─────────────────────────────────────
  Validate: pnpm test, pnpm typecheck, pnpm lint, supabase start

Phase 2 (~2 days):
  4. Patch Set 4 — Legacy cleanup (Traefik, empty dirs)
  5. Patch Set 5 — E2E test expansion
  6. Patch Set 6 — Local stack bootstrap script
  ─────────────────────────────────────
  Validate: pnpm check, pnpm test:e2e, pnpm dev manual smoke

Phase 3 (future):
  7. Module integration tests
  8. Security headers audit
  9. API contract documentation
  ─────────────────────────────────────
  Validate: pnpm check, pnpm test:coverage ≥ 70%

Phase 4 (strategic, deferrable):
  10. Worker app + Redis (if droplet RAM allows)
  11. SDK package
  12. Notification system
  ─────────────────────────────────────
  Validate: Load testing, staged rollout, monitoring
```
