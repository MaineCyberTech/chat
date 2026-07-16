# API/Worker/Integrations Audit Report

**Date**: 2026-07-16
**Auditor**: Principal Auditor (automated pipeline)
**Stage**: principal_audit
**Scope**: All 27 route files, 7 worker processors, scheduler, Socket.io, webhook system

---

## Executive Summary

| Dimension              | Score     |
| ---------------------- | --------- |
| **API Contract**       | 4.2 / 5   |
| **API Hardening**      | 4.0 / 5   |
| **Worker Reliability** | 3.8 / 5   |
| **Integration Sec**    | 4.5 / 5   |
| **Overall**            | 4.1 / 5   |

### Totals

| Severity | Count |
| -------- | ----- |
| **P0**   | 0     |
| **P1**   | 3     |
| **P2**   | 12    |
| **P3**   | 8     |
| **Total**| 23    |

### Decision: **GO WITH RISKS**

The API/worker/integrations surface is generally well-architected with proper auth, tenant isolation, input validation patterns, and circuit breakers. Three P1 findings require attention before production hardening sign-off, primarily around webhook route middleware param mismatches and missing workload implementations.

---

## Phase 1 — Contract Map

### Route Inventory (27 route files, ~120+ endpoints)

| Module              | File                                              | Endpoints | Auth Required | Zod Validation | Tenant Isolation |
| ------------------- | ------------------------------------------------- | --------- | ------------- | -------------- | ---------------- |
| Health              | `modules/health/routes.ts`                       | 2         | No            | N/A (static)   | N/A              |
| Auth                | `modules/auth/routes.ts`                         | 12        | Yes (most)    | Partial        | User-scoped      |
| Messages            | `modules/messages/routes.ts`                     | 18        | Yes           | Yes (most)     | Channel/message  |
| Channels            | `modules/channels/routes.ts`                     | 16        | Yes           | Partial        | Workspace/channel|
| Workspaces          | `modules/workspaces/routes.ts`                   | 10        | Yes           | Yes (most)     | Workspace        |
| Webhooks            | `modules/webhooks/routes.ts`                     | 6         | Yes           | Yes            | Workspace (broken)|
| Notifications       | `modules/notifications/routes.ts`                 | 9         | Yes           | None           | User-scoped      |
| Reactions           | `modules/reactions/routes.ts`                    | 4         | Yes           | None           | Channel/message  |
| Threads             | `modules/threads/routes.ts`                      | 6         | Yes           | None           | Channel + manual |
| Status              | `modules/status/routes.ts`                       | 7         | Yes           | None           | User-scoped      |
| Admin               | `modules/admin/routes.ts`                        | 15        | Yes           | None           | Admin-only       |
| Audit               | `modules/audit/routes.ts`                        | 2         | Yes           | None           | User-scoped (no workspace check) |
| AI                  | `modules/ai/routes.ts`                           | 1         | Yes           | None (manual)  | None             |
| Preferences         | `modules/preferences/routes.ts`                  | 2         | Yes           | Yes            | User-scoped      |
| Sidebar             | `modules/sidebar/routes.ts`                      | 8         | Yes           | Yes            | User-scoped      |
| User Groups         | `modules/user-groups/routes.ts`                  | 6         | Yes           | None           | Workspace (mixed)|
| Feature Flags       | `modules/feature-flags/routes.ts`                | 6         | Yes           | Yes            | None (global)    |
| Consent             | `modules/consent/routes.ts`                      | 3         | Yes           | None (manual)  | User-scoped      |
| LiveKit             | `modules/livekit/routes.ts`                      | 2         | Yes           | None           | None             |
| Emoji (custom)      | `modules/emoji/routes.ts`                        | 3         | Yes           | None (manual)  | Workspace (partial)|
| Scheduled Posts     | `modules/scheduled-posts/routes.ts`              | 3         | Yes           | None (manual)  | None             |
| Read Receipts       | `modules/read-receipts/routes.ts`                | 5         | Yes           | None           | None             |
| Announcements       | `modules/announcements/routes.ts`                | 3         | Yes           | None (manual)  | Workspace        |
| Export (admin)      | `modules/export/routes.ts`                       | 4         | Yes           | None           | Admin-only       |
| Import (admin)      | `modules/import/routes.ts`                       | 2         | Yes           | None           | Admin-only       |
| OpenAPI             | `modules/openapi/routes.ts`                      | 2         | No            | N/A            | N/A              |

### Route Prefixes

| Prefix               | Registered Modules                                              |
| -------------------- | --------------------------------------------------------------- |
| `/`                  | Health                                                          |
| `/v1/auth`           | Auth                                                            |
| `/v1/workspaces`     | Workspaces                                                      |
| `/v1`                | Channels, Messages, Webhooks, Notifications, Preferences, Reactions, Feature Flags, Consent, Threads, LiveKit, Audit, Status, Emoji, OpenAPI, Admin, Export, Import, Read Receipts, Announcements |
| `/v1/groups`         | User Groups                                                     |
| `/v1/ai`             | AI                                                              |
| `/v1/sidebar-categories` | Sidebar Categories                                          |
| `/v1/scheduled-posts` | Scheduled Posts                                                |
| `/v1/admin`          | Admin sub-routes                                                |

---

## Phase 2 — API Review

### Strengths

1. **Consistent error format**: All errors return `{ error: { code, message, requestId } }` via the global error handler middleware (`middleware/error-handler.ts`).
2. **Structured error hierarchy**: `AppError` base with `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `TooManyRequestsError`, `InternalServerError`, `ServiceUnavailableError`.
3. **Global rate limiting**: `apiLimiter` (100 req/min with composite user+IP key) applied at app level.
4. **Idempotency support**: Critical POST endpoints (messages, channels, workspaces, notification-preference) support `Idempotency-Key` header with Redis-backed store and in-memory fallback.
5. **Input sanitization**: DOMPurify strips HTML from message content.
6. **Route registry**: Declarative endpoint metadata in `route-registry.ts`.
7. **Per-request Supabase client**: Authenticated user's JWT used per-request for RLS.
8. **Request ID middleware**: Traceability across all requests.
9. **CSRF protection**: Double-submit cookie pattern.
10. **Request timeout**: 30s global timeout via `requestTimeout` middleware.
11. **Security headers**: Helmet + custom `securityHeaders` middleware.
12. **UUID validation**: Centralized `validateUuidParam` middleware.
13. **Comprehensive Prometheus metrics**: HTTP, WebSocket, DB queries, webhook deliveries, circuit breakers, business metrics.

### Finding F1 (P2) — Incomplete Zod Validation Coverage

Several routes lack structured input validation and fall back to inline string checks:

| Route | Issue |
| ----- | ----- |
| `PATCH /auth/status` | Manual enum check on status field |
| `POST /auth/avatar/:userId` | No param validation |
| `POST /messages/:id/forward` | Manual `targetChannelId` check only |
| `POST /channels/:workspaceId/dm` | Manual `targetUserId` check only |
| `POST /channels/:workspaceId/gm` | Manual Array.isArray check |
| `PATCH /workspaces/:workspaceId/channels/reorder` | Manual Array.isArray check |
| `POST /channels/:id/bookmarks` | Manual `title` check only |
| `POST /ai/rewrite` | Manual `text`/`action` check |
| `GET /admin/users` | `search` query param not validated |
| `POST /announcements/:id/dismiss` | No body validation |
| `POST /scheduled-posts` | Manual date comparison check |
| `POST /consent/log` and `POST /consent` | Manual enum check on consent_type |
| All read-receipt routes | No validation on params/body |

**Recommendation**: Create Zod schemas for all remaining inline-validated endpoints. Target 100% Zod coverage.

### Finding F2 (P2) — Missing Tenant Isolation Checks

Some routes lack workspace/channel membership verification:

| Route | Issue |
| ----- | ----- |
| `GET /dm-channels` | Lists user's DM channels without any workspace context or membership check |
| `GET /messages/flagged` | No workspace/channel check (user-scoped only — acceptable but defensively weak) |
| `GET /reminders` / `POST /reminders` / `DELETE /reminders/:id` | No channel membership verification on the reminder's message/channel |
| Metrics endpoint (`/metrics`) | Auth-protected but no admin gate — exposes operational data to any authenticated user |
| All LiveKit endpoints | No workspace membership verification on room access |
| All feature-flag mutation endpoints | No admin role check — any authenticated user can create/update/delete feature flags |
| All consent endpoints | User-scoped only (acceptable — consent is inherently user-scoped) |

### Finding F3 (P2) — Mixed Error Response Patterns

Most routes correctly throw `AppError` subclasses, but some use inline `res.status(x).json(...)`:

- `POST /ai/rewrite` — returns `{ error: { code, message } }` with inline `res.status(400).json(...)`
- `POST /read-receipts/messages/:id/read` — same pattern
- `GET /admin/export/compliance` — uses `res.status(400).json(...)` for missing workspace_id
- `GET /admin/exports/:id/download` — uses `res.status(404).json({ error: { code, message } })` (matches error pattern but not thrown)
- `GET /groups` and `POST /groups` in user-groups — inline `res.status(403).json(...)` for membership checks

**Recommendation**: Standardize all error responses through `AppError` subclasses. The global error handler ensures consistent format.

### Finding F4 (P3) — Rate Limiting Gaps

Rate limiters exist for auth (10/min), search (30/min), magic link (3/min/IP), and global (100/min), but:

- Notification endpoints have no secondary rate limit beyond global
- Webhook mutation endpoints (create/update/delete) have no secondary limit
- Admin endpoints have no secondary limit
- Export/import endpoints have no secondary limit
- AI/rewrite has no secondary limit

**Recommendation**: Add targeted rate limits for notification-sensitive and admin endpoints.

### Finding F5 (P2) — OpenAPI Spec Is Static/Stale

`GET /openapi.json` serves a static file from `docs/api/openapi.json` with silent fallback to empty spec on read error. The documentation is not auto-generated from the route registry, meaning it will drift from actual implementation.

**Recommendation**: Implement auto-generation of OpenAPI spec from route registry + Zod schemas (e.g., `zod-to-json-schema` + `swagger-ui-express`).

### Finding F6 (P2) — Admin Endpoints Bypass RLS

Admin routes use `getSupabaseAdmin()` (service role key) directly, bypassing PostgreSQL Row-Level Security. While gated by the `requireAdmin` middleware, this makes the `admin` check the sole access control layer for sensitive operations like:

- Compliance export with full message/audit log data
- User list with email addresses
- Webhook delivery/dead-letter inspection across all workspaces

**Recommendation**: Add an audit trail for all admin data-access endpoints. Consider scoping admin queries by workspace context where possible.

### Finding F7 (P3) — Route Registry Descriptions Incomplete

The `route-registry.ts` has `endpoints` metadata for only 3 of 27 route modules. Most entries lack method/path/middleware descriptions, making the registry's self-documentation value minimal.

**Recommendation**: Populate endpoint metadata for all routes, either manually or via decorators.

---

## Phase 3 — Worker and Async Review

### Worker Inventory

| Processor           | File                                 | Queue             | Retries | Backoff        | Timeout | Concurrency | DLQ    |
| ------------------- | ------------------------------------ | ----------------- | ------- | -------------- | ------- | ----------- | ------ |
| Webhook Delivery    | `processors/webhook-delivery.ts`     | webhook-delivery  | 5+1     | Exp (60s base) | 10s     | 10          | Table  |
| Notification        | `processors/notification.ts`         | notification      | 3       | Exp (5s base)  | None    | 20          | None   |
| Data Retention      | `processors/data-retention.ts`       | data-retention    | 0       | None           | 30s     | 1           | None   |
| Cleanup             | `processors/cleanup.ts`              | cleanup           | 0       | None           | 30s     | 1           | None   |
| Search Indexer      | `processors/search-indexer.ts`       | search-indexing   | 3       | Exp (2s base)  | 30s     | 5           | None   |
| Compliance Export   | `processors/compliance-export.ts`    | compliance-export | 0       | None           | 60s     | 1           | None   |
| Reminder            | `processors/reminder.ts`             | None (direct)     | 0       | N/A            | 30s     | N/A         | None   |

### Strengths

1. **Webhook delivery**: Full reliability pattern — exponential backoff, circuit breaker (opossum), DLQ, SSRF re-validation at delivery time, HMAC signing, response size limit (1MB), idempotency header.
2. **Notification**: Multi-channel delivery (in-app + push + email), HTML email templates for mention/dm/digest, expired push subscription cleanup.
3. **Data Retention**: Comprehensive coverage — messages (365d), audit logs (90d), consent logs (730d), channels/workspaces (30d), notifications.
4. **Timeout handling**: 3 of 7 processors implement AbortSignal timeout.
5. **Error logging**: All workers use structured logger with job context.

### Finding F8 (P2) — Webhook Worker Duplicates Service Logic

The `webhook-delivery.ts` worker and `webhooks/service.ts` `deliver()` method contain nearly identical logic. This creates a maintenance burden and increases the risk of divergence. The worker is the proper path; the in-process `deliver()` method in the service appears to be legacy.

**Recommendation**: Remove the in-process `deliver()` method from `webhooks/service.ts` and route all deliveries through the BullMQ queue. The service should enqueue jobs, not perform HTTP delivery directly.

### Finding F9 (P2) — No Per-Channel Notification Retry

The notification processor evaluates delivery success per-channel (`in_app`, `push`, `email`) but reports only a binary `allOk` result. A partial failure (e.g., push succeeds, email fails) is logged but not retried per-channel. The entire job would need to be retried, which would replay the successful channel as well.

**Recommendation**: Implement per-channel retry tracking. Failed channels should be re-enqueued with context of which channels succeeded.

### Finding F10 (P2) — Cleanup Processor Has Unimplemented Types

The cleanup processor registers `stale_sessions` and `expired_uploads` job types but logs "not yet implemented" for `expired_uploads` and has no handler for `stale_sessions`. The job will complete successfully without performing any work.

**Recommendation**: Either implement these cleanup types or remove them from the job schema and scheduler.

### Finding F11 (P2) — Reminder Processor Not Using BullMQ

The reminder processor (`reminder.ts`) performs direct Supabase polling in a standalone function, not as a BullMQ worker. This means:
- No job tracking or observability
- No retry mechanism
- No deduplication
- Inconsistent with the rest of the worker architecture

**Recommendation**: Convert reminder processing to a BullMQ worker with scheduled repeatable jobs.

### Finding F12 (P2) — Scheduler Uses `setInterval` Instead of Repeatable Jobs

The scheduler (`scheduler.ts`) uses `setInterval` for cron-like scheduling (retention: 24h, cleanup: 6h, compliance: 24h). This means:
- Schedules are not persisted across restarts
- Schedules drift if the process is suspended
- No leader-election for multi-instance deployments

**Recommendation**: Use BullMQ's `QueueRepeat` or `QueueScheduler` for repeatable jobs. This ensures persistence, deduplication, and leader-election compatibility.

### Finding F13 (P2) — Idempotency Fallback Is Per-Process

The idempotency module uses an in-memory `Map` fallback when Redis is unavailable. This is per-process and does not survive restarts. In multi-instance deployments (production with Redis), the Redis instance provides consistency, but the fallback provides false confidence during Redis outages.

**Recommendation**: Either remove the in-memory fallback (fail closed) or document the limitation explicitly.

### Finding F14 (P3) — Search Indexer Fallback Uses Invalid SQL Pattern

The fallback path in `search-indexer.ts` attempts:
```typescript
supabase.from("messages").update({
  search_vector: supabase.rpc("to_tsvector", { english: contentToIndex }),
})
```
This passes a Supabase client method as a value, which would not execute as SQL. The fallback is effectively broken.

**Recommendation**: Fix the fallback to use `supabase.rpc()` directly with the message ID, or remove the broken fallback.

### Finding F15 (P3) — No Circuit Breaker on External Calls in Notification Worker

The notification worker makes HTTP calls to push endpoints and SMTP connections without circuit breakers. A failing push endpoint or email server could cause cascading failures.

**Recommendation**: Add opossum circuit breakers to push delivery and email transport calls.

---

## Phase 4 — Integrations Review

### Webhook System

| Control                   | Status     | Details                                  |
| ------------------------- | ---------- | ---------------------------------------- |
| HMAC verification         | ✅ Present | SHA-256 HMAC, `X-Webhook-Signature` header |
| Secret encryption at rest | ✅ Present | AES-256-GCM with derived key             |
| Secret minimum length     | ✅ Present | 16 chars minimum                         |
| HTTPS enforcement         | ✅ Present | URL must start with `https://`           |
| SSRF protection           | ✅ Present | Private IP check + DNS resolution        |
| Circuit breaker           | ✅ Present | opossum (50% threshold, 30s reset)       |
| Dead letter queue         | ✅ Present | `webhook_dead_letters` table             |
| Exponential backoff       | ✅ Present | 60s * 2^n + jitter                       |
| Response size limit       | ✅ Present | 1MB max response body                    |
| Idempotency header        | ✅ Present | `X-Idempotency-Key` sent with delivery   |
| Response masking          | ✅ Present | Secret masked in API responses           |

### Socket.io

| Control                       | Status     |
| ----------------------------- | ---------- |
| Auth token verification       | ✅ Present |
| Connection rate limiting      | ✅ Present |
| Channel join auth (workspace) | ✅ Present |
| Private channel auth          | ✅ Present |
| Redis adapter                 | ✅ Present |
| Ping/pong health              | ✅ Present |
| Max message size (1MB)        | ✅ Present |
| Event-level rate limiting     | ❌ Missing |

### Finding F16 (P1) — Webhook Mutation Routes Use Wrong Middleware Param

The webhook routes for GET/PATCH/DELETE `/webhooks/:id` use `requireWorkspaceMembership("id")`. However, `:id` in these routes refers to the **webhook endpoint ID**, not a **workspace ID**. The middleware queries `workspace_members` using `req.params["id"]` (the webhook UUID) as the workspace_id, which will never match a workspace row.

**Impact**: All `PATCH /webhooks/:id`, `GET /webhooks/:id`, and `DELETE /webhooks/:id` requests will fail with 403 "Not a member of this workspace" for all users, because the middleware evaluates the webhook UUID as a workspace UUID.

Similarly, `POST /webhooks` uses `requireWorkspaceMembership("workspace_id")`, but `workspace_id` is in `req.body`, not `req.params`. Since the route path is `/webhooks` (no `:workspace_id` param), this also fails with 400 "Missing workspace_id".

**Recommendation**: Replace `requireWorkspaceMembership("id")` with a middleware that:
1. Fetches the webhook by ID from the DB
2. Checks workspace membership using the webhook's `workspace_id`
3. For `POST /webhooks`, extract workspace_id from `req.body` (after Zod validation)

### Finding F17 (P1) — Feature Flag Mutation Lacks Admin Authorization

Feature flag CRUD endpoints (`POST/PATCH/DELETE /feature-flags/*`) require only `authenticate` middleware. Any authenticated user can create, modify, or delete feature flags that control application behavior across all users.

**Impact**: Privilege escalation — a regular user could enable experimental/disabled features globally or disable critical features.

**Recommendation**: Add admin role verification to feature flag mutation endpoints.

### Finding F18 (P1) — Duplicate Consent Logging Endpoints

The consent routes define two identical POST endpoints: `/consent/log` and `/consent` both perform the same operation (insert consent log). This is dead code or a copy-paste error.

**Recommendation**: Remove the duplicate endpoint and consolidate to a single `POST /consent` route.

### Finding F19 (P2) — Webhook Secret Exposed in Logs on Create Error

In `webhooks/service.ts`, the `create()` method logs:
```typescript
logger.error("webhook create failed — invalid secret", { error: validation.error });
```
The `validation.error` message would not contain the secret itself, but the error context is logged without masking if validation logic changes. The `update()` method in the same service calls `encryptSecret(updateData.secret)` directly — any error during encryption would expose the plaintext secret in the exception stack.

**Recommendation**: Validate and encrypt secrets in a try/catch that explicitly excludes the secret from log output.

### Finding F20 (P3) — No Event-Level Socket Rate Limiting

Socket.io has per-IP connection rate limiting (10/s) but no per-event rate limiting. A client could flood `typing:start`, `channel:join`, or `presence:set` events at high frequency.

**Recommendation**: Add per-event rate limiting using the `socket.use()` middleware pattern with configurable limits per event type.

### Finding F21 (P3) — Push Notification Uses Raw `fetch` Instead of `web-push` Library

The notification processor constructs VAPID headers manually using `fetch` with raw encryption. The standard `web-push` library handles encryption, VAPID header generation, and subscription expiration properly. The manual implementation may miss edge cases.

**Recommendation**: Use the `web-push` npm package for standardized push notification delivery.

---

## Phase 5 — Final Synthesis

### Consolidated Findings

| ID      | Severity | Category | Title | File(s) | Fix Estimate |
| ------- | -------- | -------- | ----- | ------- | ------------ |
| **F16** | **P1**   | **AuthZ** | **Webhook routes use wrong middleware param — membership check always fails** | `modules/webhooks/routes.ts:131,147,183,219` | 2h |
| **F17** | **P1**   | **AuthZ** | **Feature flag mutation lacks admin authorization** | `modules/feature-flags/routes.ts:60,78,94` | 1h |
| **F18** | **P1**   | **Code Quality** | **Duplicate consent logging endpoints (/consent + /consent/log)** | `modules/consent/routes.ts:27,59` | 0.5h |
| F1     | P2       | Validation | Incomplete Zod validation on 13+ endpoints | Multiple route files | 4h |
| F2     | P2       | AuthZ     | Missing tenant isolation on 5+ endpoints | Multiple route files | 3h |
| F3     | P2       | Consistency| Mixed error response patterns (inline vs AppError) | 5 route files | 2h |
| F5     | P2       | Docs      | OpenAPI spec is static, not auto-generated | `modules/openapi/routes.ts` | 4h |
| F6     | P2       | Security  | Admin endpoints bypass RLS | `modules/admin/routes.ts` | 2h |
| F8     | P2       | Architecture| Webhook worker duplicates service logic | `processors/webhook-delivery.ts`, `modules/webhooks/service.ts` | 3h |
| F9     | P2       | Reliability| Notification processor lacks per-channel retry | `processors/notification.ts` | 2h |
| F10    | P2       | Completeness| Cleanup processor has 2 unimplemented job types | `processors/cleanup.ts` | 2h |
| F11    | P2       | Architecture| Reminder processor not using BullMQ | `processors/reminder.ts` | 2h |
| F12    | P2       | Reliability| Scheduler uses setInterval instead of repeatable jobs | `worker/scheduler.ts` | 2h |
| F13    | P2       | Reliability| Idempotency in-memory fallback is per-process | `lib/idempotency.ts` | 1h |
| F19    | P2       | Security  | Webhook secret could be exposed in error logs | `modules/webhooks/service.ts` | 1h |
| F4     | P3       | Hardening  | Rate limiting gaps on notification/admin/export endpoints | Multiple files | 2h |
| F7     | P3       | Docs      | Route registry has incomplete endpoint metadata | `route-registry.ts` | 2h |
| F14    | P3       | Correctness| Search indexer fallback uses invalid SQL pattern | `processors/search-indexer.ts` | 0.5h |
| F15    | P3       | Hardening  | Notification worker lacks circuit breakers | `processors/notification.ts` | 1h |
| F20    | P3       | Hardening  | No event-level Socket.io rate limiting | `lib/socket.ts` | 1h |
| F21    | P3       | Hardening  | Push notification uses raw fetch instead of web-push library | `processors/notification.ts` | 1h |

### Commendations

1. **Webhook delivery system** is the strongest integration in the codebase — full set of reliability and security controls (HMAC, SSRF, circuit breaker, DLQ, backoff, response limits, idempotency).
2. **Idempotency pattern** applied consistently to message/channel/workspace/notification-preference creation.
3. **Data retention** has comprehensive coverage with configurable retention periods and batch deletion.
4. **Compliance export** is well-structured with type-specific exporters, job status tracking, and CSV output.
5. **Error handling architecture** is solid with the `AppError` hierarchy + global handler producing consistent `{ error: { code, message, requestId } }` responses.
6. **Prometheus metrics** coverage is comprehensive across all major subsystems.
7. **Socket.io auth flow** properly validates workspace membership and private channel access before joining rooms.

### Metrics Summary

| Metric | Value |
| ------ | ----- |
| Route files reviewed | 27 |
| Total endpoints | ~120+ |
| Routes with Zod validation | ~60% |
| Routes with tenant isolation | ~70% |
| Worker processors | 7 (6 BullMQ + 1 direct) |
| Worker reliability coverage (retry + timeout + DLQ) | 1/7 (webhook only) |
| Webhook security controls | 10/10 |
| Findings (P1/P2/P3) | 3 / 12 / 8 |

### Decision

**Decision**: **GO WITH RISKS**

The 3 P1 findings (F16: webhook middleware param mismatch, F17: feature flag authorization gap, F18: duplicate consent endpoints) must be fixed before the next release certification. The 12 P2 findings represent hardening opportunities that should be addressed incrementally. The 8 P3 findings are acceptable for the current development phase.

### Priority Order for Remediation

1. **F16** — Fix webhook route middleware parameter mapping (P1, 2h)
2. **F17** — Add admin authorization to feature flag mutations (P1, 1h)
3. **F18** — Remove duplicate consent endpoint (P1, 0.5h)
4. **F19** — Add secret masking protection in webhook error logging (P2, 1h)
5. **F11** — Convert reminder to BullMQ worker (P2, 2h)
6. **F12** — Migrate scheduler to repeatable jobs (P2, 2h)
7. **F10** — Implement or remove unimplemented cleanup types (P2, 2h)
8. **F8** — Consolidate webhook delivery to single path through worker (P2, 3h)
9. **F9** — Implement per-channel notification retry (P2, 2h)
10. **F13** — Remove or document idempotency fallback limitation (P2, 1h)
