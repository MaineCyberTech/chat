# API/Worker/Integrations Re-Audit Report (v2)

**Date**: 2026-07-24 (re-audit of 2026-07-16 original)
**Auditor**: Principal Auditor (manual re-verification)
**Stage**: principal_audit (re-execution)
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

| Severity | Original | Resolved | New  | Current |
| -------- | -------- | -------- | ---- | ------- |
| **P0**   | 0        | 0        | 0    | 0       |
| **P1**   | 3        | 3        | 0    | 0       |
| **P2**   | 12       | 1        | 2    | 13      |
| **P3**   | 8        | 0        | 5    | 13      |
| **Total**| 23       | 4        | 7    | 26      |

### Decision: **GO WITH RISKS** (unchanged)

All 3 P1 findings from the original audit resolved. No new P0/P1 findings. 2 new P2 findings identified (audit log isolation, LiveKit workspace verification). The remaining P2/P3 findings represent hardening opportunities consistent with the pre-release development phase.

---

## Phase 1 — Verified Fixes (All P1 + Claimed Items)

### F16 (P1) — Webhook Routes Middleware Param — VERIFIED FIXED

**Original Finding**: `requireWorkspaceMembership("id")` used webhook UUID as workspace_id, causing all mutations to fail with 403.

**Fix Applied**: All three routes now use a pattern of loading the webhook record first, then calling standalone `requireWorkspaceAccess(webhook.workspace_id, req)`.

**Source**: `apps/api/src/modules/webhooks/routes.ts`
- Line 148-153: `GET /webhooks/:id` — loads webhook, then `requireWorkspaceAccess(webhook.workspace_id, req)` (line 153)
- Line 207-212: `PATCH /webhooks/:id` — loads existing, then `requireWorkspaceAccess(existing.workspace_id, req)` (line 212)
- Line 241-249: `DELETE /webhooks/:id` — loads webhook, then `requireWorkspaceAccess(webhook.workspace_id, req)` (line 249)
- Line 163-169: `POST /webhooks` — Zod validates `workspace_id` from body, then `requireWorkspaceAccess(parsed.data.workspace_id, req)` (line 169)

**Verdict**: **RESOLVED**. Workspace membership is now correctly verified using the webhook's own workspace_id.

### F17 (P1) — Feature Flag Mutation Lacks Admin Authorization — VERIFIED FIXED

**Original Finding**: POST/PATCH/DELETE `/feature-flags/*` required only `authenticate`, allowing any user to modify global feature flags.

**Fix Applied**: `requireAdmin` middleware added to all mutation endpoints.

**Source**: `apps/api/src/modules/feature-flags/routes.ts`
- Line 62: `POST /feature-flags` — `requireAdmin` present
- Line 81: `PATCH /feature-flags/:key` — `requireAdmin` present
- Line 98: `DELETE /feature-flags/:key` — `requireAdmin` present

**Verdict**: **RESOLVED**. Only workspace admins/owners can create, update, or delete feature flags.

### F18 (P1) — Duplicate Consent Logging Endpoints — VERIFIED FIXED

**Original Finding**: Both `/consent/log` and `/consent` performed the same insert, indicating dead code.

**Fix Applied**: The duplicate `/consent/log` route has been removed.

**Source**: `apps/api/src/modules/consent/routes.ts`
- Only two routes exist: `GET /consent` (line 10) and `POST /consent` (line 28)
- No `/consent/log` route present

**Verdict**: **RESOLVED**. Single, consolidated consent endpoint.

### F19 (P2) — Webhook Secret Exposed in Error Logs — VERIFIED FIXED

**Original Finding**: `webhooks/service.ts` `create()` method logged the validation error object which could include secret-related context.

**Fix Applied**: Error logging now uses a fixed string instead of the error object.

**Source**: `apps/api/src/modules/webhooks/service.ts`
- Line 191: `logger.error("webhook create failed", { error: "invalid secret" })` — generic message only

**Verdict**: **RESOLVED**. No secret information is logged on webhook creation failure.

### Additional Claimed Fixes — All Verified

| Item | Source | Verdict |
| ---- | ------ | ------- |
| **Shared circuit breaker for worker Supabase** | `apps/worker/src/lib/circuit-breaker.ts` — `executeWithCircuitBreaker()` with label-based sliding window (30s, 5 failures) | CONFIRMED |
| **Shared supabase client (singleton)** | `apps/worker/src/lib/supabase.ts` — `createSupabaseClient()` returns cached instance, `supabaseQuery()` wraps with CB | CONFIRMED |
| **Scheduled posts cross-tenant** | `apps/api/src/modules/scheduled-posts/routes.ts:65-66` — `getChannelWorkspaceId()` + `requireWorkspaceMember()` on POST/DELETE | CONFIRMED |
| **API versioning documented** | `docs/api/versioning.md` — URL prefix + Accept-Version header, 6-month sunset policy, deprecation middleware | CONFIRMED |

---

## Phase 2 — API Review (Remaining Findings)

### Finding F1 (P2) — Incomplete Zod Validation Coverage — STILL PRESENT

13+ routes still lack structured Zod validation. Manual inline checks remain:

| Route | Issue | Lines |
| ----- | ----- | ----- |
| `POST /ai/rewrite` | Manual `text`/`action` check | `ai/routes.ts:12-16` |
| `POST /scheduled-posts` | Manual inline field check | `scheduled-posts/routes.ts:62-63` |
| `POST /consent` | Manual `consent_type`/`granted` check | `consent/routes.ts:32-36` |
| `PATCH /announcements/:id/dismiss` | No body validation at all | `announcements/routes.ts:67-96` |
| All read-receipt routes | No Zod on params/body | `read-receipts/routes.ts:16-59` |
| `GET /admin/users` | `search` query param not validated | `admin/routes.ts:60` |
| `POST /emoji/:workspaceId` | Manual `name`/`imageUrl` check | `emoji/routes.ts:25-26` |
| `PATCH /groups/:id` (user-groups) | Manual `name`/`description` check | `user-groups/routes.ts:91-94` |
| `POST /groups` (user-groups) | Manual `workspace_id`/`name` check | `user-groups/routes.ts:47-48` |
| `POST /groups/:id/members` (user-groups) | Manual `Array.isArray` check | `user-groups/routes.ts:165` |

**Verdict**: No change since original audit. Recommendation unchanged.

### Finding F2 (P2) — Missing Tenant Isolation Checks — STILL PRESENT (2 new items downgraded to individual findings)

Some routes still lack workspace/channel membership verification:

| Route | Issue | Severity |
| ----- | ----- | -------- |
| `GET /audit/logs` | No workspace filter enforcement — any authenticated user can query all audit logs | NEW F22 |
| `GET /livekit/token` | No workspace membership verification on room access | NEW F23 |
| `GET/POST/DELETE /emoji/*` | No workspace membership check | P3 sub-finding |
| `GET /metrics` | Exposed to all authenticated users, no admin gate | NEW F25 |

Additional items from original F2 still present but previously documented:
- `GET /dm-channels` — no workspace context
- `GET /messages/flagged` — no workspace/channel check
- Reminders — no channel membership verification on the reminder's message

### Finding F3 (P2) — Mixed Error Response Patterns — STILL PRESENT

Routes still using inline `res.status(x).json(...)` instead of throwing `AppError` subclasses:

| Route | Pattern | Lines |
| ----- | ------- | ----- |
| `POST /ai/rewrite` | `res.status(400).json(...)` | `ai/routes.ts:14-16` |
| `POST /messages/:id/read` | `res.status(400).json(...)` | `read-receipts/routes.ts:36` |
| `GET /groups` (user-groups) | `res.status(403).json(...)` | `user-groups/routes.ts:24-26` |
| `POST /groups` (user-groups) | `res.status(403).json(...)` | `user-groups/routes.ts:57-59` |

**Verdict**: No change since original audit. Recommendation unchanged.

### Finding F5 (P2) — OpenAPI Spec Is Static/Stale — STILL PRESENT

`GET /openapi.json` serves a static file from `docs/api/openapi.json` with silent fallback to empty spec on read error.

**Source**: `apps/api/src/modules/openapi/routes.ts:9-15` — reads file at startup, falls back to `{ info: { title: "Chat API", version: "1.0.0" }, paths: {} }`

**Verdict**: No auto-generation from Zod schemas or route registry. Recommendation unchanged.

### Finding F6 (P2) — Admin Endpoints Bypass RLS — STILL PRESENT

Admin routes use `getSupabaseAdmin()` (service role key) on multiple endpoints, bypassing RLS:

**Source**: `apps/api/src/modules/admin/routes.ts`
- `GET /stats` (line 42): service role on all 4 count queries
- `GET /users` (line 59): service role on user listing
- `GET /channels` (line 80): service role on channel listing
- `GET /workspaces` (line 98): service role on workspace listing
- `GET /integrations` (line 113): service role on webhook endpoint listing

The `requireAdmin` middleware is present (line 40 for stats, line 57 for users, etc.) but uses the user's Supabase client for the admin check (RLS-gated), not the admin client. The data queries then use `getSupabaseAdmin()` directly.

**Verdict**: No change. The `requireAdmin` middleware from `require-admin.ts` (shared) is used on export/import routes, but `admin/routes.ts` defines its own inline `requireAdmin` (line 14) with identical logic.

### Finding F7 (P3) — Route Registry Descriptions Incomplete — STILL PRESENT

Only 3 of 27 route modules have endpoint metadata (the `endpoints` array):
- Health (`path: "/"`)
- Auth (`path: "/v1/auth"`)
- Workspaces (`path: "/v1/workspaces"`)

The remaining 24 entries have only `path`, `router`, and `description` — no endpoint-level metadata.

**Source**: `apps/api/src/route-registry.ts:93-115`

**Verdict**: No change. A group routes module was also identified (`groups/routes.ts`) that is NOT in the route registry — it's functionally a duplicate of user-groups (`user-groups/routes.ts`). See F26.

---

## Phase 3 — Worker and Async Review (Remaining Findings)

### Finding F8 (P2) — Webhook Worker Duplicates Service Logic — STILL PRESENT

Both `webhooks/service.ts` (lines 258-429) and `processors/webhook-delivery.ts` contain near-identical delivery logic:
- HMAC signing with sha256
- SSRF validation via `validateWebhookUrl`
- Circuit breaker via `executeWithCircuitBreaker`
- Exponential backoff (60s * 2^n + jitter)
- Dead letter queue
- Response size limit (1MB)
- Idempotency header

**Source**: `apps/api/src/modules/webhooks/service.ts:258-429` and `apps/worker/src/processors/webhook-delivery.ts:78+`

**Verdict**: No change. The in-process `deliver()` method in the service is still present alongside the BullMQ worker.

### Finding F9 (P2) — No Per-Channel Notification Retry — STILL PRESENT

The notification processor evaluates delivery success per-channel (`in_app`, `push`, `email`) but reports only a binary `allOk` result:

**Source**: `apps/worker/src/processors/notification.ts:241`: `const allOk = Object.values(results).every((r) => r);`

The job returns `{ status: allOk ? "sent" : "partial", channels, results }` — but BullMQ retries replay the entire job including successful channels.

**Verdict**: No change.

### Finding F10 (P2) — Cleanup Processor Has Unimplemented Types — PARTIALLY IMPROVED

Improvements noted since original audit:
- `message_edit_history` type added (lines 13, 122-152) — fully implemented cleanup function

Still present:
- `expired_uploads` still logs "not yet implemented" (line 186) — no actual cleanup
- `stale_sessions` type is defined in the union (line 12) but has NO case in the switch statement — falls through to `default: logger.warn({ type }, "Unknown cleanup job type")` at line 189

**Source**: `apps/worker/src/processors/cleanup.ts:172-189`

**New Finding**: The scheduler in `apps/worker/src/scheduler.ts:37` enqueues `{ type: "stale_sessions", olderThanDays: 90 }` every 6h, which the worker logs as "Unknown cleanup job type" on every run. See F27.

**Verdict**: Partially improved (1 type added), 1 type still broken, 1 type missing handler.

### Finding F11 (P2) — Reminder Processor Not Using BullMQ — STILL PRESENT

The reminder processor still uses direct Supabase polling:

**Source**: `apps/worker/src/processors/reminder.ts:9-59`
- No BullMQ worker or queue
- Direct `supabase.from("message_reminders").select()` (line 14)
- Manual for-loop over results (line 27)
- No retry, no deduplication, no job tracking

**Verdict**: No change.

### Finding F12 (P2) — Scheduler Uses `setInterval` — STILL PRESENT

The scheduler still uses `setInterval()` for periodic jobs:

**Source**: `apps/worker/src/scheduler.ts`
- Line 126-133: `setInterval(() => { runDataRetention() }, 24h)`
- Line 135-139: `setInterval(() => { runCleanup() }, 6h)`
- Line 146-153: `setInterval(() => { runComplianceExport() }, 24h)`

**Verdict**: No change. Schedules not persisted across restarts, no leader-election.

### Finding F13 (P2) — Idempotency In-Memory Fallback Per-Process — STILL PRESENT

The in-memory `Map` fallback is still present:

**Source**: `apps/api/src/lib/idempotency.ts:34`: `const IN_MEMORY_FALLBACK = new Map<string, { messageId: string; expiresAt: number }>();`

**Verdict**: No change.

### Finding F14 (P3) — Search Indexer Fallback Uses Invalid SQL Pattern — STILL PRESENT

The fallback path still passes a Supabase client method as a value:

**Source**: `apps/worker/src/processors/search-indexer.ts:43-46`
```typescript
search_vector: supabase.rpc("to_tsvector", {
  english: contentToIndex,
}) as unknown as undefined,
```

This is invalid — it passes the RPC call promise/object as a column value.

**Verdict**: No change.

### Finding F15 (P3) — No Circuit Breaker on External Calls in Notification Worker — STILL PRESENT

The notification worker still makes direct HTTP calls without circuit breakers:

**Source**: `apps/worker/src/processors/notification.ts`
- Line 77: `fetch(sub.endpoint, ...)` — raw fetch to push endpoint, no CB
- Line 134: `nodemailer.createTransport(...)` — SMTP connection, no CB

**Verdict**: No change.

---

## Phase 4 — Integrations Review (Remaining Findings)

### Finding F4 (P3) — Rate Limiting Gaps — STILL PRESENT

Rate limiters exist for: global (100/min), auth (10/min), search (30/min), magic link (3/min/IP).

No targeted rate limits on:
- Notification endpoints (/notifications, /notifications/preferences)
- Webhook mutation endpoints (/webhooks POST/PATCH/DELETE)
- Admin endpoints (/admin/*)
- Export/import endpoints
- AI/rewrite

**Source**: `apps/api/src/middleware/rate-limit.ts`

**Verdict**: No change.

### Finding F20 (P3) — No Event-Level Socket Rate Limiting — STILL PRESENT

Socket.io has per-IP connection rate limiting (10/s) but no per-event rate limiting:

**Source**: `apps/api/src/lib/socket.ts:8-22` — connection rate limiting present
No event-level rate limiting on `typing:start`, `channel:join`, `presence:set`, etc.

**Verdict**: No change.

### Finding F21 (P3) — Push Notification Uses Raw `fetch` Instead of `web-push` Library — STILL PRESENT

Push delivery still uses raw `fetch()` with manual VAPID headers:

**Source**: `apps/worker/src/processors/notification.ts:77-86`
```typescript
const response = await fetch(sub.endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "TTH-TTTP-Public-Key": env.VAPID_PUBLIC_KEY!,
    Authorization: `WebPush ${env.VAPID_PRIVATE_KEY}`,
  },
  body: payload,
  signal: AbortSignal.timeout(5000),
});
```

Note: The header `TTH-TTTP-Public-Key` appears to be a typo — the Web Push standard requires `Crypto-Key` or the newer `Content-Encoding: aes128gcm` approach. This manual implementation is likely non-standard and may fail on some push services.

**Verdict**: No change. Additionally, the VAPID header name is non-standard.

---

## Phase 5 — New Findings Identified in This Re-Audit

### Finding F22 (P2) — Audit Log Route Lacks Workspace Membership Check

**Source**: `apps/api/src/modules/audit/routes.ts:53-54`

The `/audit/logs` and `/audit/logs/:id` routes require only `authenticate` — no workspace membership check. Any authenticated user can query audit logs with any `workspaceId` parameter. If the underlying RLS policy on `audit_logs` does not restrict by workspace membership, this is an information disclosure vector.

**Impact**: An authenticated user could query audit logs for workspaces they don't belong to (e.g., `GET /audit/logs?workspaceId=<victim-workspace-uuid>`).

**Recommendation**: Add workspace membership verification middleware to both audit log routes, or scope the query to only the user's workspaces.

### Finding F23 (P2) — LiveKit Token Lacks Workspace Membership Verification

**Source**: `apps/api/src/modules/livekit/routes.ts:8`

The `GET /livekit/token` route requires only `authenticate`. Any authenticated user can generate a token for any room name. While the default `roomName` is `room_${req.userId}`, a user could explicitly specify any room name via the `room` query parameter (line 16).

**Impact**: A user could generate LiveKit tokens for rooms they shouldn't have access to, potentially eavesdropping on voice/video calls.

**Recommendation**: If rooms have workspace/channel context, add membership verification. Alternatively, scope room names to user-scoped identifiers.

### Finding F24 (P3) — Emoji Routes Lack Workspace Membership Check

**Source**: `apps/api/src/modules/emoji/routes.ts:9-57`

All three custom emoji routes use `:workspaceId` param but have no workspace membership middleware:
- `GET /workspaces/:workspaceId/emoji` (line 10) — no membership check
- `POST /workspaces/:workspaceId/emoji` (line 22) — no membership check
- `DELETE /emoji/:id` (line 46) — no workspace context at all

While the POST/DELETE should be caught by RLS (the user's Supabase client is used), the API layer has no explicit guard.

**Recommendation**: Add `requireWorkspaceMembership` middleware to emoji routes.

### Finding F25 (P3) — /metrics Endpoint Exposed to All Authenticated Users

**Source**: `apps/api/src/app.ts:100-103`

The `/metrics` endpoint requires `authenticate` but not `requireAdmin`. Any authenticated user can access operational metrics including request counts, response times (histograms), WebSocket connection counts, webhook delivery stats, etc.

**Impact**: Low — operational data exposure to authenticated users. No PII leakage, but reveals system internals.

**Recommendation**: Add `requireAdmin` middleware or restrict to a service-account token.

### Finding F26 (P3) — Duplicate Group Functionality in groups/ and user-groups/

**Source**: `apps/api/src/modules/groups/routes.ts` and `apps/api/src/modules/user-groups/routes.ts`

Two different route files implement overlapping user group functionality with different patterns:

| Feature | `groups/routes.ts` | `user-groups/routes.ts` |
| ------- | ------------------ | ----------------------- |
| Mount path | `/v1/workspaces/:workspaceId/groups` | `/v1/groups` |
| Membership check | `requireWorkspaceMembership("workspaceId")` | Manual inline queries |
| Error pattern | AppError (consistent) | Inline `res.status(403).json(...)` (inconsistent) |
| Route registry | **NOT REGISTERED** (missing from route-registry.ts) | Registered |

The `groups/routes.ts` file is NOT in the route registry (`route-registry.ts`), meaning its routes are unreachable. Meanwhile, `user-groups/routes.ts` IS registered but uses manual validation and inline error responses.

**Recommendation**: Consolidate into a single module. Use the middleware pattern from `groups/routes.ts` (it has proper `requireGroupAccess` with workspace context) but register it properly.

### Finding F27 (P3) — Scheduler Enqueues stale_sessions But Cleanup Processor Has No Handler

**Source**: `apps/worker/src/scheduler.ts:37` and `apps/worker/src/processors/cleanup.ts:172-189`

The scheduler enqueues `{ type: "stale_sessions", olderThanDays: 90 }` every 6 hours, but the cleanup processor's switch statement has no `case "stale_sessions"` handler. The job falls through to:

```typescript
default:
  logger.warn({ type }, "Unknown cleanup job type");
```

This means every 6 hours, a cleanup job runs that logs a warning for being an "Unknown type" even though the type is explicitly defined in the union.

**Impact**: Low — no data corruption, but repeated erroneous warnings in production logs.

**Recommendation**: Either implement the `stale_sessions` handler or remove it from the scheduler's `CLEANUP_SCHEDULE` array.

---

## Phase 6 — Additional Observations

### Code Quality: groups/routes.ts Not Registered

`apps/api/src/modules/groups/routes.ts` implements proper workspace-gated group CRUD with `requireGroupAccess` middleware, `validateUuidParam`, and consistent AppError usage. However, it is NOT listed in `route-registry.ts`, making all its routes unreachable. If this module was intended to replace `user-groups/routes.ts`, the migration is incomplete.

### VAPID Header Typo

`apps/worker/src/processors/notification.ts:81` uses `TTH-TTTP-Public-Key` as the VAPID header name. The correct header per RFC 8292 is `Crypto-Key: p256ecdsa=...` (older) or the newer `Authorization: vapid t=...,k=...` with `Content-Encoding: aes128gcm`. The current `Authorization: WebPush ${env.VAPID_PRIVATE_KEY}` format combined with `TTH-TTTP-Public-Key` does not conform to Web Push standards, meaning push notifications likely never reach actual browser push services.

**Recommendation**: Replace with the `web-push` npm package (as originally recommended in F21) which handles all encryption and header formatting correctly.

---

## Consolidated Findings Table

| ID      | Severity | Category      | Status    | Title |
| ------- | -------- | ------------- | --------- | ----- |
| **F16** | **P1**   | AuthZ         | RESOLVED  | Webhook routes use wrong middleware param |
| **F17** | **P1**   | AuthZ         | RESOLVED  | Feature flag mutation lacks admin authorization |
| **F18** | **P1**   | Code Quality  | RESOLVED  | Duplicate consent logging endpoints |
| **F19** | **P2**   | Security      | RESOLVED  | Webhook secret exposed in error logs |
| F1     | P2       | Validation    | REMAINING | Incomplete Zod validation on 13+ routes |
| F2     | P2       | AuthZ         | REMAINING | Missing tenant isolation on 5+ routes |
| F3     | P2       | Consistency   | REMAINING | Mixed error response patterns |
| F5     | P2       | Docs          | REMAINING | OpenAPI spec is static, not auto-generated |
| F6     | P2       | Security      | REMAINING | Admin endpoints bypass RLS |
| F8     | P2       | Architecture  | REMAINING | Webhook worker duplicates service logic |
| F9     | P2       | Reliability   | REMAINING | Notification processor lacks per-channel retry |
| F10    | P2       | Completeness  | PARTIAL   | Cleanup has 2 unimplemented types (1 fixed, 1 new gap) |
| F11    | P2       | Architecture  | REMAINING | Reminder processor not using BullMQ |
| F12    | P2       | Reliability   | REMAINING | Scheduler uses setInterval instead of repeatable jobs |
| F13    | P2       | Reliability   | REMAINING | Idempotency in-memory fallback is per-process |
| **F22** | **P2**   | AuthZ         | **NEW**   | Audit log routes lack workspace membership check |
| **F23** | **P2**   | AuthZ         | **NEW**   | LiveKit token lacks workspace membership verification |
| F4     | P3       | Hardening     | REMAINING | Rate limiting gaps on notification/admin/export routes |
| F7     | P3       | Docs          | REMAINING | Route registry has incomplete endpoint metadata |
| F14    | P3       | Correctness   | REMAINING | Search indexer fallback uses invalid SQL pattern |
| F15    | P3       | Hardening     | REMAINING | Notification worker lacks circuit breakers |
| F20    | P3       | Hardening     | REMAINING | No event-level Socket.io rate limiting |
| F21    | P3       | Hardening     | REMAINING | Push notification uses raw fetch (non-standard VAPID) |
| F24    | P3       | AuthZ         | NEW       | Emoji routes lack workspace membership check |
| F25    | P3       | Hardening     | NEW       | /metrics exposed to all authenticated users |
| F26    | P3       | Code Quality  | NEW       | Duplicate group routes (groups/ vs user-groups/) |
| F27    | P3       | Correctness   | NEW       | Scheduler enqueues stale_sessions with no cleanup handler |

---

## Commendations (unchanged)

1. **Webhook delivery system** — strongest integration: HMAC, SSRF, circuit breaker, DLQ, exponential backoff, response limits, idempotency.
2. **Idempotency pattern** — applied consistently to message/channel/workspace/notification-preference creation.
3. **Data retention** — comprehensive coverage: messages (365d), audit logs (90d), consent logs (730d), soft-deleted channels/workspaces (30d).
4. **Compliance export** — well-structured with type-specific exporters, job status tracking, CSV output.
5. **Error handling architecture** — solid with `AppError` hierarchy + global handler.
6. **Prometheus metrics** — comprehensive coverage across all major subsystems.
7. **Socket.io auth flow** — properly validates workspace membership and private channel access.
8. **Input sanitizer** — covers both body and query parameters, nested objects, with XSS and SQL injection pattern detection.
9. **API versioning documentation** — `docs/api/versioning.md` now documents the strategy, deprecation policy, and header-based alternative.
10. **Worker Supabase client** — shared singleton with circuit breaker wrapping via `supabaseQuery()`.

---

## Metrics Summary

| Metric | Original | Current |
| ------ | -------- | ------- |
| Route files reviewed | 27 | 27 |
| Total endpoints | ~120+ | ~120+ |
| Routes with Zod validation | ~60% | ~60% (unchanged) |
| Routes with tenant isolation | ~70% | ~72% (webhooks, scheduled posts improved) |
| Worker processors | 7 (6 BullMQ + 1 direct) | 7 (unchanged) |
| Worker reliability coverage (retry + timeout + DLQ) | 1/7 | 2/7 (webhook + compliance export) |
| Webhook security controls | 10/10 | 10/10 |
| P1 findings | 3 | **0** (all resolved) |
| P2 findings | 12 | **13** (1 resolved, 2 new) |
| P3 findings | 8 | **13** (0 resolved, 5 new) |

---

## Decision

**Decision**: **GO WITH RISKS** (unchanged)

All 3 P1 findings from the original audit are resolved. The API/worker/integrations surface has measurably improved in the areas of webhook authorization (F16), feature flag access control (F17), consent route hygiene (F18), webhook secret safety (F19), scheduled post tenant isolation, worker Supabase circuit breaking, and API versioning documentation.

Two new P2 findings (F22: audit log isolation, F23: LiveKit workspace verification) should be addressed before production. The 20 remaining P2/P3 findings represent hardening and code quality improvements suitable for post-launch iteration.

### Top Priority Actions (Post-Audit)

1. **F22** — Add workspace membership check to audit log routes (P2, 1h)
2. **F23** — Add workspace verification to LiveKit token endpoint (P2, 1h)
3. **F21** — Replace manual VAPID with `web-push` library (P3 but affects push notification delivery — likely broken currently, 2h)
4. **F10/F27** — Implement `stale_sessions` cleanup handler or remove from scheduler (P2/P3, 1h)
5. **F26** — Consolidate `groups/` and `user-groups/` route files (P3, 2h)
6. **F11** — Convert reminder processor to BullMQ (P2, 2h)
7. **F12** — Migrate scheduler to repeatable jobs (P2, 2h)
