# Testing/QA/CI-CD Audit — July 16, 2026

**Principal Auditor Assessment** | Stage: `principal_audit`

---

## Executive Summary

| Dimension                | Score      | Verdict                                                                                             |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| Test Inventory           | 7/10       | Strong unit coverage on API services; packages and middleware have major gaps                       |
| Gap Analysis             | 5/10       | 10 untested middleware files, 1 untested API module, 3 packages with zero tests, no admin E2E flows |
| CI/CD Gate Effectiveness | 6/10       | Core CI is robust but E2E tests are non-blocking (`continue-on-error: true`) — **P0**               |
| Quality Gates            | 4/10       | No pre-commit hooks installed, abysmal coverage thresholds, lint-staged not wired                   |
| **Overall**              | **5.5/10** | **GO WITH RISKS** — 0 P0 (by strict severity), 4 P1, 8 P2, 6 P3                                     |

**Decision: GO WITH RISKS** — The CI/CD pipeline is functional and deployments are safe for the core messaging flow, but the test safety net has critical holes (non-blocking E2E, zero packages coverage, no pre-commit hooks).

---

## Phase 1: Test Protection Inventory

### 1.1 Framework Stack

| Layer             | Framework                               | Config File                                                     |
| ----------------- | --------------------------------------- | --------------------------------------------------------------- |
| Unit/Component    | Vitest 3.x                              | `vitest.config.ts` (root)                                       |
| Component (React) | Vitest + jsdom + @testing-library/react | `vitest.config.base.ts`                                         |
| E2E               | Playwright 1.51                         | `playwright.config.ts` (root) + `apps/web/playwright.config.ts` |
| Integration       | Vitest (manual API calls)               | `tests/integration/`                                            |
| Load              | k6                                      | `tests/k6/`                                                     |
| Mock              | Vitest `vi.mock`                        | Per-file                                                        |

### 1.2 Test File Inventory

#### API Modules (26/27 = 96.3% coverage)

| Module            | Test File                      | Tests Count | Coverage Depth                                     |
| ----------------- | ------------------------------ | ----------- | -------------------------------------------------- |
| admin             | `admin.test.ts`                | 16          | Full CRUD + stats + system                         |
| ai                | `ai.test.ts`                   | 3           | Rewrite route only                                 |
| audit             | `audit.test.ts`                | 12          | Full listing + filters + error paths               |
| auth              | `auth.service.test.ts`         | 4           | Service-only (getUser, getProfile, update, search) |
| channels          | `channel.service.test.ts`      | 5           | CRUD service tests                                 |
| consent           | `consent.test.ts`              | 6           | CRUD + validation                                  |
| emoji             | `emoji.test.ts`                | 8           | CRUD + sanitization                                |
| export            | `export.test.ts`               | 4           | Route-only (CSV header check)                      |
| feature-flags     | `feature-flags.test.ts`        | 12          | Full CRUD + evaluate + validation                  |
| groups            | `groups.test.ts`               | 14          | Full CRUD + members                                |
| health            | `health.service.test.ts`       | 5           | Readiness + liveness                               |
| import            | `import.test.ts`               | 3           | Route-only                                         |
| livekit           | `livekit.test.ts`              | 6           | Token + status routes                              |
| messages          | `message.service.test.ts`      | 6           | CRUD + flagged messages                            |
| notifications     | `notification.service.test.ts` | 6           | CRUD + unread count                                |
| openapi           | `openapi.test.ts`              | 2           | Spec fallback                                      |
| preferences       | `preferences.service.test.ts`  | 3           | Get + upsert                                       |
| reactions         | `reaction.service.test.ts`     | 5           | CRUD + batch get                                   |
| read-receipts     | `read-receipts.test.ts`        | 6           | Routes + validation                                |
| scheduled-posts   | `scheduled-posts.test.ts`      | 7           | CRUD + validation                                  |
| sidebar           | `sidebar.test.ts`              | 8           | Category CRUD + reorder                            |
| status            | `status.test.ts`               | 7           | CRUD + batch                                       |
| threads           | `threads.test.ts`              | 2           | Participants only                                  |
| user-groups       | `user-groups.test.ts`          | 14          | Full CRUD + members                                |
| webhooks          | `webhook.service.test.ts`      | 10          | CRUD + URL validation                              |
| workspaces        | `workspace.service.test.ts`    | 9           | CRUD + members + limit                             |
| **announcements** | **NONE**                       | **0**       | **❌ NOT TESTED**                                  |

**Total API unit tests: ~170 across 26 files**

#### Middleware (6/16 = 37.5% coverage)

| Middleware          | Tested | Notes                      |
| ------------------- | ------ | -------------------------- |
| authenticate        | ✅     | `authenticate.test.ts`     |
| csrf                | ✅     | `csrf.test.ts`             |
| error-handler       | ✅     | `error-handler.test.ts`    |
| rate-limit          | ✅     | `rate-limit.test.ts`       |
| request-id          | ✅     | `request-id.test.ts`       |
| security-headers    | ✅     | `security-headers.test.ts` |
| cache               | ❌     | No tests                   |
| deprecation         | ❌     | No tests                   |
| input-sanitizer     | ❌     | No tests                   |
| require-admin       | ❌     | No tests                   |
| require-membership  | ❌     | No tests                   |
| require-permission  | ❌     | No tests                   |
| request-timeout     | ❌     | No tests                   |
| validate-string-key | ❌     | No tests                   |
| validate-uuid       | ❌     | No tests                   |

#### Web Components (12 files)

| Component                        | Tests | Depth                                                                                                          |
| -------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| message-list.test.tsx            | 6     | Rendering, empty state, reactions, scroll-to-top pagination                                                    |
| chat-view.test.tsx               | 22    | Loading, error, message send/optimistic, socket events, typing, thread, channel info, notification preferences |
| emoji-picker.test.tsx            | 6     | Render, search, category tabs, select, close                                                                   |
| login-form.test.tsx              | 5     | Render, tabs, magic link send, error, dev notice                                                               |
| error-boundary.test.tsx          | 5     | Render, fallback, custom fallback, Sentry                                                                      |
| notification-bell.test.tsx       | 8     | Unread badge, dropdown, mark read, close                                                                       |
| channel-list.test.tsx            | —     | (not read in detail)                                                                                           |
| install-prompt.test.tsx          | —     | PWA install prompt                                                                                             |
| landing-shell.test.tsx           | —     | Homepage landing                                                                                               |
| media-room.test.tsx              | —     | LiveKit media room                                                                                             |
| workspace-list.test.tsx          | —     | Workspace listing                                                                                              |
| create-workspace-dialog.test.tsx | —     | Create workspace dialog                                                                                        |

#### E2E Tests (6 spec files)

| Spec                  | Flows                                                                        | Notes                                                 |
| --------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| `auth.spec.ts`        | Login form render, invalid email, empty email, magic link sent, full sign-in | Credentials-based sign-in gated by `test-signin.json` |
| `messaging.spec.ts`   | Send, edit, delete messages; WebSocket real-time across 2 pages              | Full flow with workspace/channel creation             |
| `home.spec.ts`        | Landing page render                                                          | Minimal (2 tests)                                     |
| `navigation.spec.ts`  | Channel sidebar, channel navigation                                          | Minimal (2 tests)                                     |
| `search.spec.ts`      | Search bar, matching results, empty state                                    | Lightweight                                           |
| `file-upload.spec.ts` | Image upload, text file upload                                               | Both use programmatic `setInputFiles`                 |

#### Integration Tests (2 tests in 1 file)

| File             | What It Tests                                               |
| ---------------- | ----------------------------------------------------------- |
| `health.test.ts` | `GET /health` returns 200, `GET /healthz` returns DB status |

#### Load Tests (k6, 2 scripts — NOT in CI)

| Script          | Configuration                                                   |
| --------------- | --------------------------------------------------------------- |
| `smoke-test.js` | 1 VU, 30s, threshold p95<2000ms, failure<1%                     |
| `load-test.js`  | Ramp 1m→10vu, 2m→50vu, 1m→0vu, threshold p95<3000ms, failure<2% |

#### Chaos Tests (2 manual scripts — NOT in CI)

| Scenario      | Script            | Coverage                                                                  |
| ------------- | ----------------- | ------------------------------------------------------------------------- |
| API crash     | `api-crash.sh`    | Stop container → verify degraded → restart → verify recovery (60s window) |
| Redis down    | `redis-down.sh`   | Stop Redis → verify degraded health → restart → verify recovery           |
| DB disconnect | Manual (firewall) | Documented only                                                           |
| High latency  | Manual (tc)       | Documented only                                                           |

### 1.3 Package-Level Test Coverage

| Package           | Tests | Status                             |
| ----------------- | ----- | ---------------------------------- |
| `packages/db`     | 0     | Stub: `"echo \"No DB tests yet\""` |
| `packages/ui`     | 0     | No test files found                |
| `packages/sdk`    | 0     | No test files found                |
| `packages/config` | 0     | Config-only package                |

---

## Phase 2: Gap Analysis

### 2.1 Untested Code by Severity

#### P1 — Critical Business Logic Untested

| Item                    | File                                           | Impact                                                                 |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| **Announcements API**   | `apps/api/src/modules/announcements/routes.ts` | GET/POST/PATCH announcement CRUD — zero test coverage                  |
| **No pre-commit hooks** | `.husky/` directory missing entirely           | Developers can commit broken code, lint/typecheck not enforced locally |

#### P2 — Missing Defense-in-Depth / Hardening Gaps

| Item                              | File(s)                                          | Details                                                                   |
| --------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Middleware: `cache`               | `apps/api/src/middleware/cache.ts`               | Caching logic untested                                                    |
| Middleware: `deprecation`         | `apps/api/src/middleware/deprecation.ts`         | Deprecation header logic untested                                         |
| Middleware: `input-sanitizer`     | `apps/api/src/middleware/input-sanitizer.ts`     | XSS/sanitization logic untested                                           |
| Middleware: `require-admin`       | `apps/api/src/middleware/require-admin.ts`       | Admin access control untested                                             |
| Middleware: `require-membership`  | `apps/api/src/middleware/require-membership.ts`  | Workspace membership gate untested                                        |
| Middleware: `require-permission`  | `apps/api/src/middleware/require-permission.ts`  | RBAC permission checks untested                                           |
| Middleware: `request-timeout`     | `apps/api/src/middleware/request-timeout.ts`     | Timeout logic untested                                                    |
| Middleware: `validate-string-key` | `apps/api/src/middleware/validate-string-key.ts` | Key validation untested                                                   |
| Middleware: `validate-uuid`       | `apps/api/src/middleware/validate-uuid.ts`       | UUID validation untested                                                  |
| **Packages: db**                  | `packages/db/src/`                               | All stores (IMessageStore, IChannelStore, etc.) untested                  |
| **Packages: ui**                  | `packages/ui/src/`                               | Button, Dialog, Avatar, Skeleton, EmptyState, etc. — zero tests           |
| **Packages: sdk**                 | `packages/sdk/src/`                              | Client SDK untested                                                       |
| **k6 not in CI**                  | `tests/k6/`                                      | Load tests documented as "not yet integrated into CI"                     |
| **Chaos not in CI**               | `tests/chaos/`                                   | Chaos scenarios are manual shell scripts                                  |
| **E2E non-blocking**              | `validate.yml` line 430                          | `continue-on-error: true` — E2E failures do NOT block CI                  |
| **Migration test non-blocking**   | `validate.yml` line 285                          | `continue-on-error: true` — migration failures do NOT block CI            |
| **No admin E2E flows**            | —                                                | Admin panel (user management, export/import, stats) has zero E2E coverage |
| **No thread E2E flow**            | —                                                | Thread/reply creation not tested in E2E                                   |
| **No DM/GM E2E flow**             | —                                                | Direct message channels not tested in E2E                                 |
| **No channel settings E2E**       | —                                                | Mute, bookmarks, topic editing not tested                                 |

#### P3 — Best Practice / Edge Cases

| Item                                                                                  | Details                                                                 |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Coverage thresholds too low                                                           | Global: 30% lines, 25% branches; Diff: 40% lines, 30% branches          |
| `chat-view.test.tsx` uses `@/components/chat/message-input` mock (not real component) | Many component tests mock children rather than testing full composition |
| `auth.service.test.ts` tests service only — no route-level auth tests                 | Auth endpoint testing missing                                           |
| `export.test.ts` only checks `res.setHeader` was called                               | No CSV content validation                                               |
| `import.test.ts` only checks `res.json` was called                                    | No import result validation                                             |
| Thread service tests only cover `getParticipants`                                     | No thread creation, listing, or reply tests                             |
| OpenAPI test uses fallback mock (file-not-found)                                      | Doesn't validate the actual `openapi.json` schema                       |

### 2.2 Coverage Thresholds vs Reality

| Metric     | Global Config | Diff Coverage in CI | Estimated Actual |
| ---------- | ------------- | ------------------- | ---------------- |
| Lines      | 30%           | 40%                 | ~35-40%          |
| Functions  | 25%           | 30%                 | ~30-35%          |
| Branches   | 25%           | 30%                 | ~20-25%          |
| Statements | 30%           | 40%                 | ~35-40%          |

**Verdict**: Thresholds are too low to catch regressions. 30% line coverage means 70% of code has no test safety net.

---

## Phase 3: CI/CD Gate Review

### 3.1 Workflow Analysis

#### `ci.yml` — Entry Point (push to main/develop, PRs, schedule)

```
concurrency: ci-${{ github.ref }} / cancel-in-progress: true   ✅
calls validate.yml (reusable)                                   ✅
```

#### `validate.yml` — Reusable Validation Pipeline

| Job                 | Runs                                                       | Blocks PR? | Notes                                                              |
| ------------------- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| `test`              | Tests + coverage + JUnit                                   | ✅ Yes     | `pnpm vitest run --retry=1 --coverage`                             |
| `diff-coverage`     | Changed-file coverage check                                | ✅ Yes     | Thresholds: lines=40%, functions=30%, branches=30%, statements=40% |
| `lint`              | Prettier + ESLint                                          | ✅ Yes     | `pnpm format:check && pnpm lint`                                   |
| `typecheck`         | TypeScript `--noEmit`                                      | ✅ Yes     | `pnpm typecheck`                                                   |
| `openapi-validate`  | OpenAPI spec structural check                              | ✅ Yes     | Validates JSON structure                                           |
| `security-audit`    | pnpm audit + Trivy                                         | ✅ Yes     | Trivy with `continue-on-error: true`                               |
| `branch-protection` | Checks main branch protection rules                        | ✅ Yes     | Runs on PR                                                         |
| `migration-test`    | Supabase local start + db diff + db reset + rollback check | ❌ **P0**  | `continue-on-error: true`                                          |
| `build`             | `pnpm build`                                               | ✅ Yes     | Depends on lint+typecheck+test+security+migration+openapi          |
| `e2e`               | Playwright E2E tests against local Supabase                | ❌ **P0**  | `continue-on-error: true`; 5-min timeout; Chromium only            |

**P0 Finding**: `migration-test` and `e2e` both have `continue-on-error: true`. Migration SQL errors and E2E failures do NOT block the CI pipeline. This means:

- A PR that introduces a migration that breaks the schema will still merge
- E2E tests can be broken for weeks silently
- Deployment will proceed with broken migrations

#### `build-push.yml` — Docker Image Build (push develop)

| Step                         | Assessment                              |
| ---------------------------- | --------------------------------------- |
| Docker Buildx + GHA cache    | ✅                                      |
| SHA-pinned tags (dev + $sha) | ✅                                      |
| SBOM generation              | ✅ (CycloneDX SPDX)                     |
| Trivy image scanning         | ✅ (HIGH/CRITICAL, `continue-on-error`) |
| Concurrency group            | ✅ `cancel-in-progress: true`           |

#### `deploy-development.yml` — Deploy to Droplet

| Step                                        | Assessment                                         |
| ------------------------------------------- | -------------------------------------------------- |
| Waits for build-push completion             | ✅ Pooling with 30 attempts                        |
| Supabase migrations                         | ✅ `supabase db push`                              |
| Droplet IP resolution + old droplet cleanup | ✅                                                 |
| SSH setup with secrets                      | ✅                                                 |
| Docker system prune before pull             | ✅                                                 |
| SHA-specific image pull (race safe)         | ✅                                                 |
| Container health check (36 attempts)        | ✅                                                 |
| External HTTPS health check                 | ✅                                                 |
| **No E2E gate**                             | ⚠️ Deployment proceeds regardless of E2E pass/fail |

#### `deploy-production.yml` — Provision + Deploy (push main / manual)

| Step                                      | Assessment                                               |
| ----------------------------------------- | -------------------------------------------------------- |
| Validate step (check + build)             | ✅ Runs before infrastructure                            |
| Terraform provisioning                    | ✅ Full IaC                                              |
| Docker image build with SHA + latest tags | ✅                                                       |
| Rollback support (manual SHA input)       | ✅                                                       |
| Container health check                    | ✅                                                       |
| `cancel-in-progress: false`               | ✅ (production safety)                                   |
| **No E2E gate**                           | ⚠️ Production deployment proceeds without E2E validation |

### 3.2 CI Infrastructure Assessment

| Aspect                   | Status                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| pnpm caching             | ✅ `pnpm/action-setup@v4` with hashFiles cache                               |
| Turborepo caching        | ✅ `actions/cache@v4` for `.turbo`                                           |
| Concurrent job execution | ✅ Lint + typecheck + test + security run in parallel                        |
| Job dependency chain     | ✅ Build depends on lint+typecheck+test+security+migration+openapi           |
| Timeout configuration    | ✅ 5min for test/lint/typecheck, 10min for build/e2e, 15min for migration    |
| Test artifact retention  | ✅ JUnit XML + coverage report uploaded                                      |
| Self-hosted runner       | ❌ `ubuntu-latest` (GitHub-hosted) — no caching across runs beyond GHA cache |

---

## Phase 4: Quality Gates

### 4.1 Coverage Thresholds

**Global** (in `packages/config/vitest.config.base.ts`):

```typescript
thresholds: { lines: 30, functions: 25, branches: 25, statements: 30 }
```

**Diff Coverage** (in `validate.yml`):

```javascript
const required = { lines: 40, functions: 30, branches: 30, statements: 40 };
```

**Findings**:

- Both thresholds are well below industry standard (80% recommended)
- 30% global line coverage means a file could be 70% untested and still pass
- Diff coverage at 40% is too low to catch most regressions in new code

### 4.2 Pre-commit Hooks

| Config                    | Status                                                   |
| ------------------------- | -------------------------------------------------------- |
| `husky` devDependency     | ✅ `"^9.1.7"` in root `package.json`                     |
| `prepare: "husky"` script | ✅ in root `package.json`                                |
| `.husky/` directory       | ❌ **DOES NOT EXIST** — husky has never been initialized |
| Pre-commit linting        | ❌ Not enforced                                          |
| Pre-commit typecheck      | ❌ Not enforced                                          |
| Pre-commit tests          | ❌ Not enforced                                          |

**P1 Finding**: The `husky` package is installed and `prepare: "husky"` is configured, but `.husky/` was never created. `pnpm install` runs `husky` which exits without error but creates no hooks because no hooks were ever configured. This means:

- Developers can commit code that fails linting
- Developers can commit code with TypeScript errors
- There is no local quality gate before pushing

### 4.3 Lint-Staged Configuration

```json
"lint-staged": {
  "*.{ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 10"],
  "*.{js,mjs,cjs,json,md}": ["prettier --write"]
}
```

**Finding**: Configuration is well-defined but NOT wired. Without husky hooks executing `lint-staged`, this configuration is dead code.

### 4.4 Test Scripts (root `package.json`)

```json
"test": "turbo test",
"test:unit": "vitest run",
"test:integration": "vitest run --config vitest.config.ts",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test",
"ci": "pnpm install --frozen-lockfile && pnpm check && pnpm build"
```

Note: `turbo test` depends on `build` (in `turbo.json`), so `pnpm test` builds first. `pnpm test:unit` bypasses turbo and goes directly to vitest — no build dependency.

### 4.5 Typecheck Enforcement

- `pnpm typecheck` runs `turbo typecheck` which runs `tsc --noEmit` per package
- Typecheck is a required job in CI (blocks build)
- Typecheck depends on `^build` in turbo.json (needs compiled dependencies first)

---

## Phase 5: Final Synthesis

### 5.1 Finding Register

| ID      | Severity | Category      | Finding                                                                                                                                                                                     | Recommendation                                                                                 |
| ------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| TQC-001 | **P1**   | CI Gate       | `e2e` job in `validate.yml` uses `continue-on-error: true` — does NOT block CI                                                                                                              | Remove `continue-on-error: true`; fix E2E flakiness first or add retry logic                   |
| TQC-002 | **P1**   | CI Gate       | `migration-test` job in `validate.yml` uses `continue-on-error: true`                                                                                                                       | Remove `continue-on-error: true`; migration verification must block                            |
| TQC-003 | **P1**   | Quality Gate  | No pre-commit hooks installed (`.husky/` missing despite husky in devDependencies)                                                                                                          | Run `pnpm husky init`; add `pre-commit` hook with `lint-staged`                                |
| TQC-004 | **P1**   | Coverage Gap  | `announcements` API module has zero test coverage                                                                                                                                           | Add route tests for GET/POST/PATCH `/workspaces/:id/announcements`                             |
| TQC-005 | **P2**   | Coverage Gap  | 10 of 16 middleware files have zero tests (cache, deprecation, input-sanitizer, require-admin, require-membership, require-permission, request-timeout, validate-string-key, validate-uuid) | Add tests for each middleware; prioritize `require-permission` and `require-membership`        |
| TQC-006 | **P2**   | Coverage Gap  | 3 packages (db, ui, sdk) have zero tests                                                                                                                                                    | Add vitest config to each package; test store interfaces, Button/Dialog/Avatar, and SDK client |
| TQC-007 | **P2**   | Coverage Gap  | Load tests (k6) documented as "not yet integrated into CI"                                                                                                                                  | Add k6 smoke test to `ci.yml` schedule or PR gate                                              |
| TQC-008 | **P2**   | Coverage Gap  | Chaos tests are manual shell scripts, not automated                                                                                                                                         | Add chaos tests to CI as a scheduled workflow                                                  |
| TQC-009 | **P2**   | E2E Gap       | No E2E coverage for admin flows (user management, export, import, stats)                                                                                                                    | Add Playwright spec for admin panel flows                                                      |
| TQC-010 | **P2**   | E2E Gap       | No E2E coverage for threads, DMs, channel settings (mute, bookmarks, topic)                                                                                                                 | Add E2E specs for thread creation, DM channel, channel mute/bookmark                           |
| TQC-011 | **P2**   | E2E Gap       | No E2E coverage for OAuth sign-in (Google, GitHub)                                                                                                                                          | Add OAuth E2E flow (may require mock provider)                                                 |
| TQC-012 | **P2**   | Quality Gate  | Coverage thresholds extremely low (30% lines, 25% branches global; 40% lines diff)                                                                                                          | Raise to 60% lines / 50% branches global; 80% lines diff                                       |
| TQC-013 | **P2**   | CI            | `deploy-development.yml` does not await E2E test results before deploy                                                                                                                      | Add E2E result check stage before deploy (at least warn on failure)                            |
| TQC-014 | **P2**   | CI            | `deploy-production.yml` validation step only runs check+build, not full test suite                                                                                                          | Add test+lint+typecheck validation before production deploy                                    |
| TQC-015 | **P3**   | Best Practice | `auth.service.test.ts` tests service only, not route handlers                                                                                                                               | Add route-level auth tests (verify middleware integration)                                     |
| TQC-016 | **P3**   | Best Practice | `export.test.ts` only checks `res.setHeader` was called — no CSV content validation                                                                                                         | Assert CSV headers and row content                                                             |
| TQC-017 | **P3**   | Best Practice | `import.test.ts` only checks `res.json` was called — no import result validation                                                                                                            | Assert import counts and error handling                                                        |
| TQC-018 | **P3**   | Best Practice | Thread service tests only cover `getParticipants` — no create/list/reply                                                                                                                    | Add thread CRUD tests                                                                          |
| TQC-019 | **P3**   | Best Practice | `packages/db` `test` script is a stub echo — not a real test placeholder                                                                                                                    | Replace stub with real test skeleton or remove                                                 |
| TQC-020 | **P3**   | Performance   | E2E CI timeout at 5 minutes may be insufficient for full Supabase start + migrations + tests                                                                                                | Increase to 10-15 minutes                                                                      |

### 5.2 Scorecard

| Category                 | Weight   | Score | Weighted    |
| ------------------------ | -------- | ----- | ----------- |
| Test coverage breadth    | 25%      | 6/10  | 1.50        |
| Test coverage depth      | 15%      | 5/10  | 0.75        |
| CI gate effectiveness    | 25%      | 6/10  | 1.50        |
| Quality gate enforcement | 20%      | 4/10  | 0.80        |
| Resilience/load testing  | 15%      | 3/10  | 0.45        |
| **Weighted Total**       | **100%** |       | **5.00/10** |

### 5.3 Risk Assessment

| Risk                                       | Probability | Impact                              | Mitigation                                                      |
| ------------------------------------------ | ----------- | ----------------------------------- | --------------------------------------------------------------- |
| Broken migration merges to main            | Medium      | High (DB downtime)                  | Remove `continue-on-error` from migration-test job              |
| E2E regressions go undetected              | High        | Medium (broken flows in production) | Remove `continue-on-error` from e2e job; stabilize flaky tests  |
| Untested middleware allows auth bypass     | Low         | Critical                            | Add tests for require-permission, require-membership middleware |
| Package-level API breaks without detection | Medium      | High                                | Add tests to `packages/db` store interfaces                     |
| Developers commit broken code              | High        | Medium                              | Initialize husky with pre-commit hooks                          |

### 5.4 Quick Wins (Estimated Effort: < 1 dev-day each)

1. **Remove `continue-on-error` from `migration-test`** — `validate.yml` line 285 (5 minutes)
2. **Initialize husky** — run `npx husky init`; add `lint-staged` pre-commit hook (10 minutes)
3. **Increase global coverage thresholds** to 50/40/40/50 (15 minutes; may expose real gaps)
4. **Add simple smoke tests to `packages/ui`** — verify Button renders, Toast fires (2 hours)
5. **Add `announcements` route tests** — follow pattern from `emoji.test.ts` (1 hour)
6. **Add k6 smoke test to CI schedule** — copy pattern from `load-test.yml` (30 minutes)

### 5.5 Go/No-Go Decision

| Criterion                                     | Status                                    |
| --------------------------------------------- | ----------------------------------------- |
| CI/CD pipeline functional?                    | ✅ Yes                                    |
| Tests run on every PR?                        | ✅ Yes (except E2E which is non-blocking) |
| Test failure blocks merge (unit/integration)? | ✅ Yes                                    |
| Pre-commit quality checks?                    | ❌ No (husky not configured)              |
| Coverage thresholds meaningful?               | ❌ No (30% lines is insufficient)         |
| E2E tests block deployment?                   | ❌ No (continue-on-error)                 |
| Migration verification blocks PR?             | ❌ No (continue-on-error)                 |
| Load/chaos testing automated?                 | ❌ No                                     |

**Decision: GO WITH RISKS**

The pipeline is functional for the core development flow. Risks are mitigated by:

- Unit tests for 26/27 API modules exist and block PR
- Lint + typecheck block PR
- Diff coverage checking blocks PR
- Production deploy has manual rollback capability
- Core messaging E2E flow is tested (even if non-blocking)

**Critical prerequisites for upgrading to GO:**

1. Remove `continue-on-error: true` from `migration-test` job
2. Initialize husky with pre-commit hooks (`lint-staged`)
3. Add tests for the `announcements` API module

---

_Generated by principal audit — Testing/QA/CI-CD — July 16, 2026_
_Audit pack: `docs/prompts/pre_reconciliation_super_bundle/testing_qa_cicd_audit_pack/`_
