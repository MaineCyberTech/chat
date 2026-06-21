# Testing, QA & CI Quality Gates Audit

**Audit date:** 2026-06-21
**Repo:** chat-platform (`C:\temp\chat`)
**Scope:** Unit, integration, E2E coverage; CI pipeline; quality enforcement

---

## 1. Test Coverage Breadth

### 1.1 Inventory

| Layer                                          | Files        | Tests         | Type                   |
| ---------------------------------------------- | ------------ | ------------- | ---------------------- |
| **UI components** (`packages/ui`)              | 4 files      | ~12 cases     | Unit (jsdom)           |
| **API services** (`apps/api/src/modules/*`)    | 5 files      | ~22 cases     | Unit (mocked Supabase) |
| **API middleware** (`apps/api/src/middleware`) | 1 file       | 4 cases       | Unit                   |
| **Web components** (`apps/web/components`)     | 1 file       | 5 cases       | Unit (jsdom)           |
| **E2E** (`tests/e2e/`)                         | 1 file       | 2 cases       | Playwright             |
| **Total**                                      | **12 files** | **~45 cases** |                        |

### 1.2 Untested Source Files

#### `packages/ui/src/components/` (7 components, 4 tested)

| File                | Tested? |
| ------------------- | ------- |
| `button.tsx`        | ✅      |
| `input.tsx`         | ✅      |
| `badge.tsx`         | ✅      |
| `avatar.tsx`        | ✅      |
| `dialog.tsx`        | ❌      |
| `sidebar-group.tsx` | ❌      |
| `skeleton.tsx`      | ❌      |

#### `apps/api/src/modules/*/` (5 modules, 10 files)

| File                    | Tested? |
| ----------------------- | ------- |
| `auth/service.ts`       | ✅      |
| `auth/routes.ts`        | ❌      |
| `workspaces/service.ts` | ✅      |
| `workspaces/routes.ts`  | ❌      |
| `channels/service.ts`   | ✅      |
| `channels/routes.ts`    | ❌      |
| `messages/service.ts`   | ✅      |
| `messages/routes.ts`    | ❌      |
| `health/service.ts`     | ✅      |
| `health/routes.ts`      | ❌      |

#### `apps/api/src/middleware/` (5 middleware, 1 tested)

| File                  | Tested? |
| --------------------- | ------- |
| `authenticate.ts`     | ✅      |
| `error-handler.ts`    | ❌      |
| `security-headers.ts` | ❌      |
| `request-id.ts`       | ❌      |
| `rate-limit.ts`       | ❌      |

#### `apps/api/src/lib/` (4 libs, 0 tested)

| File          | Tested?          |
| ------------- | ---------------- |
| `supabase.ts` | ❌ (only mocked) |
| `socket.ts`   | ❌ (only mocked) |
| `sentry.ts`   | ❌               |
| `logger.ts`   | ❌ (only mocked) |

#### `apps/web/components/` (14 components + pages, 1 tested)

| File                                    | Tested?   |
| --------------------------------------- | --------- |
| `home/landing-shell.tsx`                | ✅        |
| `auth/auth-context.tsx`                 | ❌ **P1** |
| `auth/login-form.tsx`                   | ❌        |
| `chat/chat-view.tsx`                    | ❌ **P1** |
| `chat/message-list.tsx`                 | ❌ **P1** |
| `chat/message-input.tsx`                | ❌ **P1** |
| `chat/search-bar.tsx`                   | ❌        |
| `workspace/workspace-list.tsx`          | ❌        |
| `workspace/create-workspace-dialog.tsx` | ❌        |
| `workspace/app-sidebar.tsx`             | ❌        |
| `channel/channel-list.tsx`              | ❌        |
| `channel/create-channel-dialog.tsx`     | ❌        |
| `app-header.tsx`                        | ❌        |

#### `apps/web/app/` (7 pages, 0 tested)

| Page                                               | Tested?   |
| -------------------------------------------------- | --------- |
| `page.tsx` (home)                                  | ❌        |
| `layout.tsx` (root)                                | ❌        |
| `auth/callback/page.tsx`                           | ❌        |
| `(auth)/login/page.tsx`                            | ❌        |
| `(workspace)/layout.tsx`                           | ❌        |
| `(workspace)/[workspaceSlug]/page.tsx`             | ❌        |
| `(workspace)/[workspaceSlug]/[channelId]/page.tsx` | ❌ **P1** |

#### `tests/e2e/` (1 spec, 2 assertions)

| Spec           | Coverage                    |
| -------------- | --------------------------- |
| `home.spec.ts` | Homepage heading + CTA only |
| Auth flow      | ❌ **P1**                   |
| Messaging flow | ❌ **P1**                   |
| File upload    | ❌ **P1**                   |
| Search         | ❌                          |
| Webhooks       | ❌                          |

---

## 2. Critical Flow Coverage Gaps

### P0 — Missing entirely from test suite

| Flow                    | What's missing                                                          | Impact                  |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------- |
| **Auth flow**           | No login, signup, magic link, callback, session expiry tests            | Core user onboarding    |
| **Real-time messaging** | No Socket.io connection, message send, typing indicator, presence tests | Core product feature    |
| **File upload**         | No upload, download, signed URL, file type validation tests             | Documented in AGENTS.md |

### P1 — Severely under-tested

| Flow                     | What's missing                                     | Impact                       |
| ------------------------ | -------------------------------------------------- | ---------------------------- |
| **Message CRUD routes**  | Routes have no tests; only service layer is tested | API contract not validated   |
| **Threaded replies**     | No tests for parent_id, thread view, pagination    | Documented feature           |
| **Message edit/delete**  | No route-level tests for edit/delete permissions   | Data integrity risk          |
| **Channel membership**   | No RLS or permission boundary tests                | Authorization gap            |
| **Workspace membership** | No tests for member CRUD or role enforcement       | Authorization gap            |
| **Search**               | No tests for full-text search service or API       | Documented feature           |
| **Webhooks**             | No webhook delivery or retry tests                 | Documented in AGENTS.md      |
| **Rate limiting**        | Rate-limit middleware untested                     | DoS protection not validated |
| **Error handler**        | No tests for error formatting, Sentry reporting    | Error observability gap      |

### P2 — Untested but lower risk

| Flow                            | What's missing                                    |
| ------------------------------- | ------------------------------------------------- |
| Security headers middleware     | CSP, HSTS headers not validated                   |
| Request ID middleware           | Correlation ID propagation not tested             |
| Health routes                   | Only service tested, not Express routes           |
| Dialog/Skeleton/SidebarGroup UI | 3 of 7 UI components untested                     |
| All app pages                   | 7 Next.js page files untested                     |
| Bundle analyzer                 | Build-time config only, no regressions detectable |

---

## 3. CI Gate Effectiveness

### 3.1 Current Pipeline (`validate.yml`)

```
test       ──► runs independently (no deps)
lint       ──► runs independently (no deps)
typecheck  ──► runs independently (no deps)
build      ──► depends on lint, typecheck (NOT test)
```

### 3.2 Findings

| Gate             | Status                                     | Issue                                                   |
| ---------------- | ------------------------------------------ | ------------------------------------------------------- |
| Lint             | ✅ Runs `eslint .` via turbo               | No lint-staged eslint check on pre-commit               |
| Format           | ✅ Runs `prettier --check .`               | Pre-commit only runs prettier on staged                 |
| Typecheck        | ✅ Runs `tsc --noEmit` per package         | —                                                       |
| Test             | ✅ Runs `turbo test`                       | **No coverage threshold, no E2E, no integration tests** |
| Build            | ⚠️ Runs `turbo build`                      | **Does NOT depend on test** — can merge broken tests    |
| E2E              | ❌ **Not in CI**                           | Playwright tests never run automatically                |
| Dependency graph | ⚠️ build needs lint+typecheck but not test | Test can fail while build passes                        |

### 3.3 CI Efficiency

| Issue                 | Details                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| No pnpm cache sharing | Each job reruns `pnpm install` independently (4 installs per CI run)        |
| No job matrix         | 4 sequential/parallel jobs, no parallelism within jobs                      |
| No test splitting     | All tests run in single process; could split by package                     |
| Timeout limits        | 5min for test/lint/typecheck, 10min for build — reasonable for current size |
| Path filters          | ci.yml has no path filters — runs on every push to main/develop             |

---

## 4. Quality Enforcement Gaps

### P0 — No coverage thresholds

`vitest.config.ts` has:

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html"],
  include: ["apps/*/src/**", "packages/*/src/**"],
  // ❌ No thresholds
}
```

No `thresholds` block means CI can pass with 0% coverage.

### P1 — No diff coverage enforcement

No mechanism to require coverage on new/changed lines in PRs.

### P2 — No test-only PR gate

No policy or workflow preventing PRs without test changes when modifying source code.

### P2 — Pre-commit hooks underpowered

`.husky/pre-commit` does not exist. `lint-staged` in root `package.json` only runs `prettier --write` — no eslint, no typecheck, no test.

### P2 — No required status checks on main

`ci.yml` triggers on push to main but there's no branch protection rule documented requiring all checks to pass before merge.

---

## 5. Prioritized Implementation Roadmap

### Phase 1 — Must-fix (P0, before any large refactors)

| #   | Task                         | Details                                                                                             | Effort |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| 1   | **Add coverage thresholds**  | Add to `vitest.config.ts`: `thresholds: { statements: 40, branches: 30, functions: 35, lines: 40 }` | 0.5h   |
| 2   | **Fix CI dependency graph**  | Make `build` depend on `test` (not just lint+typecheck)                                             | 0.5h   |
| 3   | **Add E2E smoke test to CI** | Run `pnpm test:e2e` in CI after build; test auth callback flow                                      | 4h     |
| 4   | **Add auth flow E2E test**   | Magic link → callback → workspace redirect in Playwright                                            | 8h     |

### Phase 2 — Core feature tests (P1)

| #   | Task                          | Details                                                                      | Effort |
| --- | ----------------------------- | ---------------------------------------------------------------------------- | ------ |
| 5   | **Test all API route files**  | Add route-level integration tests for auth, workspaces, channels, messages   | 12h    |
| 6   | **Test messaging E2E flow**   | WebSocket connect → send message → receive message → edit → delete           | 16h    |
| 7   | **Test file upload E2E flow** | Upload → signed URL → display → delete                                       | 8h     |
| 8   | **Test core web components**  | auth-context, chat-view, message-list, message-input (4 critical components) | 12h    |
| 9   | **Test remaining middleware** | error-handler, rate-limit, security-headers, request-id                      | 8h     |

### Phase 3 — Increased rigor (P2)

| #   | Task                               | Details                                                                       | Effort |
| --- | ---------------------------------- | ----------------------------------------------------------------------------- | ------ |
| 10  | **Add pre-commit hook**            | Create `.husky/pre-commit` running `lint-staged` with eslint + typecheck      | 2h     |
| 11  | **Add diff coverage checking**     | Use `vitest --changed` or codecov action to enforce coverage on changed lines | 4h     |
| 12  | **Test remaining UI components**   | dialog, sidebar-group, skeleton                                               | 4h     |
| 13  | **Add page-level component tests** | Workspace and channel page shells                                             | 8h     |
| 14  | **Increase coverage thresholds**   | Raise to 60/50/55/60 after Phase 2                                            | 1h     |

### Phase 4 — Optimization (P3)

| #   | Task                          | Details                                                         | Effort |
| --- | ----------------------------- | --------------------------------------------------------------- | ------ |
| 15  | **Add test splitting**        | Split vitest by project/package for parallel CI execution       | 4h     |
| 16  | **Cache pnpm across jobs**    | Use `actions/setup-node` cache key across all validate.yml jobs | 2h     |
| 17  | **Add path filters to CI**    | Only run relevant tests when packages change                    | 2h     |
| 18  | **Test search functionality** | Full-text search service + route + UI                           | 8h     |

---

## Summary Statistics

| Metric                         | Value                            |
| ------------------------------ | -------------------------------- |
| Source files (apps + packages) | ~35 files                        |
| Test files                     | 12 files                         |
| Test coverage (estimated)      | ~15% statements                  |
| CI jobs                        | 4 (lint, typecheck, test, build) |
| E2E specs in CI                | 0                                |
| Coverage threshold enforced    | No                               |
| Pre-commit checks              | Prettier only                    |
| P0 gaps                        | 4                                |
| P1 gaps                        | 9                                |
| P2 gaps                        | 7                                |

> **Bottom line:** The codebase has a solid testing foundation (mock patterns, test infrastructure, CI pipeline) but critical flow coverage is at ~15%. Auth, messaging, and file upload — the three core features — have no E2E or route-level tests. CI will pass even if tests are completely broken. Phase 1 (coverage thresholds, CI fix, auth E2E) should be completed before any large refactors.
