# Principal Audit Report

- Prompt: **feature_test_expansion**
- Domain: **features**
- Run ID: **feature_test_expansion_20260703_055347**
- Generated: **2026-07-03T12:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **2**, P3: **0**
- Readiness: **34.30**

## Findings

### P1 — All 30+ E2E test scenarios are test.skip('Requires Supabase test project setup') — zero E2E execution for threads, mentions, notifications, RBAC, webhooks, search, media
- **File:** `apps/web/e2e/comprehensive.spec.ts`
- **Category:** e2e_coverage
- **Impact:** Feature regressions in UI interactions cannot be caught before release; no confidence in cross-feature workflows.
- **Fix:** Set up test Supabase project or mock local Supabase; unskip critical-path E2E tests; add Playwright project for Supabase-local E2E in CI.

### P1 — k6 load tests only exercise GET /healthz — no load scenarios for message send, search, WebSocket connections, or notification fanout
- **File:** `tests/k6/load-test.js`
- **Category:** performance_testing
- **Impact:** Performance regressions in search, message throughput, realtime event fanout go undetected; no capacity planning data.
- **Fix:** Add k6 scenarios: message send throughput, search query latency, WebSocket connect rate (100 concurrent); set p95 thresholds.

### P2 — No test coverage for search_messages RPC — date ranges, author filters, channel scoping, and edge cases all untested
- **File:** `apps/api/src/modules/messages/__tests__/message.service.test.ts`
- **Category:** test_matrix
- **Impact:** Search query breakages silently reach production; RPC signature changes or permission changes undetected.
- **Fix:** Add service tests for search: basic text search, date range, author filter, channel filter, empty query, special characters, XSS.

### P2 — No test data factory functions — every test manually creates workspace, channel, members, messages with raw Supabase inserts
- **File:** ``
- **Category:** fixtures
- **Impact:** 30+ lines of setup per test discourages test creation; shared state leads to flakiness.
- **Fix:** Create test factories (buildUser, buildWorkspace, buildChannel, buildMessage) in packages/db/test-utils/ with sensible defaults and auth fixtures.
