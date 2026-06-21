# Phase 6 — File-by-File / Area-by-Area Change Plan

## 1. Highest-Priority Target Areas

Based on the phased roadmap, the highest-priority targets are Phase 1 items (low-risk wins) that add structural alignment without breaking anything:

1. **Supabase seeds directory** — add test data for local dev
2. **Supabase policies directory** — extract existing RLS policies from migrations
3. **Supabase functions directory** — create empty placeholder
4. **Shared config package** — centralize ESLint/TSConfig
5. **Environment variable documentation** — complete .env.example files

---

## 2. Likely Files/Folders to Touch First

### Supabase Seeds

- **CREATE**: `supabase/seeds/00_test_user.sql` — test user for local auth
- **CREATE**: `supabase/seeds/01_test_workspace.sql` — test workspace
- **CREATE**: `supabase/seeds/02_test_channel.sql` — test channel
- **CREATE**: `supabase/seeds/03_test_message.sql` — test messages
- **CREATE**: `supabase/seeds/README.md` — instructions for loading seeds

### Supabase Policies

- **CREATE**: `supabase/policies/01_workspaces_rls.sql` — extract from migration
- **CREATE**: `supabase/policies/02_channels_rls.sql` — extract from migration
- **CREATE**: `supabase/policies/03_messages_rls.sql` — extract from migration
- **CREATE**: `supabase/policies/04_audit_logs_rls.sql` — extract from migration
- **CREATE**: `supabase/policies/05_webhooks_rls.sql` — extract from migration

### Supabase Functions

- **CREATE**: `supabase/functions/.gitkeep` — empty placeholder

### Shared Config Package

- **CREATE**: `packages/config/package.json` — package manifest
- **CREATE**: `packages/config/eslint.base.mjs` — shared ESLint config
- **CREATE**: `packages/config/tsconfig.base.json` — shared TypeScript base
- **MODIFY**: `apps/api/eslint.config.mjs` — extend shared config
- **MODIFY**: `apps/web/eslint.config.mjs` — extend shared config
- **MODIFY**: `apps/api/tsconfig.json` — extend shared base
- **MODIFY**: `apps/web/tsconfig.json` — extend shared base
- **MODIFY**: `packages/db/tsconfig.json` — extend shared base
- **MODIFY**: `packages/ui/tsconfig.json` — extend shared base

### Environment Variable Documentation

- **MODIFY**: `apps/api/.env.example` — add any missing vars (LOG*LEVEL, SENTRY_DSN, SMTP*\*)
- **MODIFY**: `apps/web/.env.example` — add any missing vars (NEXT_PUBLIC_API_URL, ANALYZE)

---

## 3. Likely Files/Folders to Avoid Touching Early

| File/Folder                                 | Reason                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/api/src/modules/auth/`                | Auth is critical path. No changes until Phase 3+ and comprehensive test coverage.   |
| `apps/api/src/modules/messages/`            | Core real-time feature. No changes to Socket.io event contracts.                    |
| `apps/web/components/chat/`                 | Chat UI is the primary user-facing surface. Avoid layout/behavior changes.          |
| `apps/web/components/auth/`                 | Auth context + login form — critical UX path.                                       |
| `infra/docker/Caddyfile`                    | Current route mappings are production contracts. Changes require extensive testing. |
| `infra/docker/docker-compose.devremote.yml` | Production deployment manifest. Changes risk downtime.                              |
| `apps/api/server.ts`                        | Entry point with graceful shutdown logic.                                           |
| `.github/workflows/deploy-development.yml`  | 219 lines of fragile SSH-based deployment.                                          |
| `.github/workflows/deploy-production.yml`   | Untested but needed for production.                                                 |

---

## 4. Structural Cleanup Candidates

| Current Structure                                                  | Suggestion                                                        | Effort             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------ |
| `infra/docker/traefik/` (legacy)                                   | Remove directory — no longer used (migrated to Caddy)             | 5 min              |
| `infra/docker/Caddyfile.prod` vs `Caddyfile`                       | Consolidate into single Caddyfile with conditional includes       | 15 min             |
| `packages/db/sql/` contains migrations, policies, functions, seeds | Rename to match reference pattern or keep as-is (current is fine) | —                  |
| `tests/` integration directory (empty except README)               | Either populate with integration tests or remove                  | 10 min if removing |

---

## 5. UI/UX Alignment Candidates

| Current Component                               | Reference Equivalent                              | Action                 | Notes                                             |
| ----------------------------------------------- | ------------------------------------------------- | ---------------------- | ------------------------------------------------- |
| `packages/ui/src/components/button.tsx`         | Not in reference (no shared UI)                   | **Keep current**       | Current is better — part of shared library        |
| `packages/ui/src/components/avatar.tsx`         | Not in reference                                  | **Keep current**       | Shared component                                  |
| `packages/ui/src/components/dialog.tsx`         | Not in reference                                  | **Keep current**       | Shared component                                  |
| `apps/web/components/workspace/app-sidebar.tsx` | Reference `components/portal/PortalSubnav.tsx`    | **Keep current**       | Different UX needs (sidebar vs subnav)            |
| `apps/web/components/chat/chat-view.tsx`        | Reference `SupportCenterClient.tsx` (ticket view) | **Adapt conceptually** | Both are thread-based views but different domains |

**UI Alignment Decision**: Do NOT attempt to copy reference UI components. The domains are fundamentally different (portal vs. real-time chat). Current UI is purpose-built and appropriate.

---

## 6. API/Service Layer Alignment Candidates

| Current Module        | Reference Route                | Action                 | Notes                                      |
| --------------------- | ------------------------------ | ---------------------- | ------------------------------------------ |
| `modules/auth/`       | `routes/auth.ts`               | **Keep current**       | Both use Supabase auth + JWT               |
| `modules/health/`     | `routes/health.ts`             | **Keep current**       | Current has DB latency check ref hasn't    |
| `modules/workspaces/` | `routes/organizations.ts`      | **Adapt conceptually** | Similar tenant model; different naming     |
| `modules/channels/`   | (no equivalent)                | **Keep current**       | Chat-specific concept                      |
| `modules/messages/`   | `routes/tickets.ts` (comments) | **Keep current**       | Similar threaded content, different domain |

**Decision**: No API restructuring needed. Feature-based modules/ pattern is superior to flat routes/.

---

## 7. Shared Utility / Abstraction Candidates

| Utility                 | Current Location                      | Reference Equivalent        | Action                                           |
| ----------------------- | ------------------------------------- | --------------------------- | ------------------------------------------------ |
| cn() utility            | `packages/ui/src/styles.css` (inline) | `packages/ui/src/lib/cn.ts` | **Adapt** — extract cn() to a dedicated file     |
| Rate limiter            | Inline in API modules                 | `middleware/rate-limit.ts`  | **Keep current**                                 |
| Zod validation          | Inline in API routes                  | `validators/` directory     | **Keep current** — co-located validation is fine |
| Supabase client factory | `packages/db/src/config.ts`           | `packages/sdk/client.ts`    | **Keep current** — simpler for current needs     |
| Pino logger setup       | `apps/api/src/lib/`                   | `packages/sdk/audit.ts`     | **Keep current**                                 |

---

## 8. Test Coverage Needed Before Refactor

| Area              | Current Tests                      | Needed Before Changes                                                  |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Auth module       | 1 test (auth.service.test.ts)      | Additional: token validation, session refresh, logout, magic link flow |
| Workspaces module | 1 test (workspace.service.test.ts) | Additional: CRUD, RLS enforcement, member management                   |
| Channels module   | 1 test (channel.service.test.ts)   | Additional: CRUD, membership checks                                    |
| Messages module   | 1 test (message.service.test.ts)   | Additional: send, edit, delete, thread replies, file attachments       |
| Health module     | 1 test (health.service.test.ts)    | Sufficient — simple endpoint                                           |
| UI components     | 7 test files                       | Sufficient — one per component                                         |
| E2E               | 1 test (home.spec.ts)              | Additional: workspace creation, channel navigation, message sending    |

**Minimum test gate before Phase 2+ refactors**: All 5 API modules have `service.test.ts` files (already done). E2E covers the primary user flow (workspace → channel → send message).

---

## 9. Documentation / Runbook Improvements

| Doc                      | Current State                                               | Improvement                                       |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------- |
| `AGENTS.md`              | Good — concise architecture overview                        | Update after each phase                           |
| `apps/api/.env.example`  | Has SUPABASE_URL, SUPABASE_ANON_KEY                         | Add: LOG_LEVEL, SENTRY_DSN, port                  |
| `apps/web/.env.example`  | Has NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | Add: NEXT_PUBLIC_APP_URL, ANALYZE                 |
| `infra/docker/README.md` | Good — compose setup docs                                   | Update with Caddy cert troubleshooting            |
| `tests/README.md`        | Skeleton                                                    | Add test run instructions, test data setup        |
| `supabase/README.md`     | None                                                        | Add migration workflow, seed loading instructions |

---

## 10. Safe Patch Grouping Proposal

### Patch Set A: Supabase Structure Alignment (Phase 1)

```
supabase/seeds/00_test_user.sql          [CREATE]
supabase/seeds/01_test_workspace.sql     [CREATE]
supabase/seeds/02_test_channel.sql       [CREATE]
supabase/seeds/README.md                 [CREATE]
supabase/policies/01_workspaces_rls.sql  [CREATE]
supabase/policies/02_channels_rls.sql    [CREATE]
supabase/policies/03_messages_rls.sql    [CREATE]
supabase/policies/04_audit_logs_rls.sql  [CREATE]
supabase/policies/05_webhooks_rls.sql    [CREATE]
supabase/functions/.gitkeep              [CREATE]
```

### Patch Set B: Shared Config Package (Phase 1)

```
packages/config/package.json             [CREATE]
packages/config/eslint.base.mjs          [CREATE]
packages/config/tsconfig.base.json       [CREATE]
packages/db/tsconfig.json                [MODIFY]
packages/ui/tsconfig.json                [MODIFY]
apps/api/tsconfig.json                   [MODIFY]
apps/web/tsconfig.json                   [MODIFY]
apps/api/eslint.config.mjs               [MODIFY]
apps/web/eslint.config.mjs               [MODIFY]
```

### Patch Set C: Environment Variable Documentation (Phase 1)

```
apps/api/.env.example                    [MODIFY]
apps/web/.env.example                    [MODIFY]
```

### Patch Set D: Legacy Cleanup (Phase 2)

```
infra/docker/traefik/                    [REMOVE]
tests/integration/README.md              [REMOVE or POPULATE]
```

### Patch Set E: Test Expansion (Phase 2)

```
tests/e2e/workspace.spec.ts              [CREATE]
tests/e2e/channel.spec.ts                [CREATE]
tests/e2e/message.spec.ts                [CREATE]
```

### Patch Set F: Local Stack Script (Phase 2)

```
scripts/start-local-stack.ps1            [CREATE]
scripts/teardown-local-stack.ps1         [MODIFY — enhance existing]
```

**Execution order**: A → B → C → D → E → F. Each patch set can be validated independently before proceeding to the next.
