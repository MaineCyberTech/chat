# API, Worker & Integrations Audit Summary

**Date**: 2026-06-21  
**Scope**: `apps/api/`, `apps/web/lib/api.ts`, `packages/db/src/types.ts`, `supabase/migrations/webhooks.sql`  
**Severity**: P0 (critical) / P1 (high) / P2 (medium) / P3 (low)

---

## 1. Frontend–Backend Contract Consistency

### 1.1 Unused Backend Routes (no frontend consumer)

| Route                    | File                                           | Missing Frontend Call                         |
| ------------------------ | ---------------------------------------------- | --------------------------------------------- |
| `GET /workspaces`        | `apps/api/src/modules/workspaces/routes.ts:10` | Workspace list never fetched by any component |
| `GET /workspaces/:id`    | `apps/api/src/modules/workspaces/routes.ts:55` | No single-workspace fetch                     |
| `PATCH /workspaces/:id`  | `apps/api/src/modules/workspaces/routes.ts:64` | No rename/update flow                         |
| `DELETE /workspaces/:id` | `apps/api/src/modules/workspaces/routes.ts:88` | No delete workspace UI                        |
| `PATCH /channels/:id`    | `apps/api/src/modules/channels/routes.ts:56`   | No update-channel UI                          |
| `DELETE /channels/:id`   | `apps/api/src/modules/channels/routes.ts:79`   | No delete-channel UI                          |
| `GET /auth/session`      | `apps/api/src/modules/auth/routes.ts:11`       | No explicit session fetch                     |
| `PATCH /auth/profile`    | `apps/api/src/modules/auth/routes.ts:20`       | No profile-editing UI                         |
| `GET /auth/online`       | `apps/api/src/modules/auth/routes.ts:37`       | Online list via socket presence, not REST     |

**Severity: P2** — dead code creates maintenance burden; not a runtime bug.

### 1.2 Response Shape Drift Risk

Frontend calls in `chat-view.tsx` and `search-bar.tsx` rely on implicit response shapes (`data.messages`, `data.channels`, `data.uploadUrl`). No shared TypeScript response types between `apps/api` and `apps/web`. Both sides independently define `Channel`, `Message`, `UserProfile` etc. via `@chat/db`, but **HTTP response wrapper types** (`{ messages: ... }`, `{ channels: ... }`) are not shared.

**Severity: P2** — brittle on refactor; a backend rename of `messages` to `results` would silently break the frontend.

### 1.3 Path Duplication: Channel Routes Mounted Without Prefix

`apps/api/src/app.ts:34` mounts channel routes at root level (`app.use(channelRoutes)`), so the router's own `/workspaces/:workspaceId/channels` and `/channels/:id` prefixes work, but this is non-standard and confusing compared to workspaces (`app.use("/workspaces", workspaceRoutes)`).

**Severity: P3**

---

## 2. Validation Coverage

### 2.1 Missing Zod Validation on Path/Query Parameters

| Location                                       | Parameter                | Issue                                                                           |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `apps/api/src/modules/workspaces/routes.ts:55` | `req.params.id`          | Not validated as UUID                                                           |
| `apps/api/src/modules/workspaces/routes.ts:64` | `req.params.id`          | Not validated as UUID                                                           |
| `apps/api/src/modules/workspaces/routes.ts:88` | `req.params.id`          | Not validated as UUID                                                           |
| `apps/api/src/modules/channels/routes.ts:47`   | `req.params.id`          | Not validated as UUID (get channel)                                             |
| `apps/api/src/modules/channels/routes.ts:56`   | `req.params.id`          | Not validated as UUID (update channel)                                          |
| `apps/api/src/modules/channels/routes.ts:79`   | `req.params.id`          | Not validated as UUID (delete channel)                                          |
| `apps/api/src/modules/channels/routes.ts:10`   | `req.params.workspaceId` | Not validated as UUID                                                           |
| `apps/api/src/modules/channels/routes.ts:15`   | `req.params.workspaceId` | Not validated as UUID                                                           |
| `apps/api/src/modules/messages/routes.ts:41`   | `req.params.channelId`   | Not validated as UUID                                                           |
| `apps/api/src/modules/messages/routes.ts:51`   | `req.params.channelId`   | Not validated as UUID                                                           |
| `apps/api/src/modules/messages/routes.ts:41`   | `req.query.before`       | Typed as `string \| undefined` from cast; no format/schema validation           |
| `apps/api/src/modules/messages/routes.ts:43`   | `limit` (hardcoded 50)   | No client-supplied limit; hardcoded value is fine, but no validation if changed |

**Severity: P1** — missing UUID validation on all resource IDs opens the door to spurious 500s (Supabase returns errors on malformed UUID input) and potential NoSQL-style injection via malformed IDs.

### 2.2 Body Validation — Adequate

Every POST/PATCH route validates request body with a Zod schema. No gaps found for body payloads.

**Severity: OK**

---

## 3. Error Handling Patterns

### 3.1 Inconsistency: Leaking Internal Error Messages

| Route                          | Behavior                                                        | File                                              |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------- |
| `POST /workspaces`             | `catch` block returns `err.message` directly to client          | `apps/api/src/modules/workspaces/routes.ts:49-51` |
| `POST /workspaces` (null path) | Returns generic "Could not create workspace. Check server logs" | `workspaces/routes.ts:29-37`                      |
| `POST /messages/upload`        | Returns `error?.message` directly in catch and error paths      | `messages/routes.ts:140-158`                      |

Inconsistent patterns: some paths leak error details, some don't. `AppError` class exists in `apps/api/src/middleware/error-handler.ts:4` but is **never used by any route handler** — all routes manually call `res.status().json()` instead of throwing `AppError`.

**Severity: P2** — information leakage and inconsistent user-facing error messages.

### 3.2 Error Response Shape — Consistent

All error responses follow `{ error: { code, message } }` — including rate-limiter (`rate-limit.ts:9`). Rate limiter already uses the same shape.

**Severity: OK**

### 3.3 204 Responses Skip Audit Log Fire-and-Forget

`DELETE` routes in workspaces (`workspaces/routes.ts:94`), channels (`channels/routes.ts:85`), and messages (`messages/routes.ts:114`) call `res.status(204).send()` _before_ `logAuditEvent(...)`. If the audit DB insert fails, the client gets a successful 204 while the audit is silently lost (caught by the try/catch in `services/audit.ts:30`).

**Severity: P2** — audit events can be silently dropped on delete operations.

---

## 4. Async Safety & Socket.io Event Contracts

### 4.1 No Message Delivery Acknowledgment (ACK)

The server emits `message:new`, `message:updated`, `message:deleted` without Socket.io ACK callbacks. If the socket disconnects between the `emit` and client receipt, the event is silently lost. The client does not request missed messages on reconnect (no `lastEventId` / `from` parameter on reconnect).

**Severity: P1** — users can miss real-time messages during brief disconnections.

### 4.2 No Idempotency on Message Creation

`POST /channels/:channelId/messages` has no idempotency key. If the client retries (e.g., on network timeout), duplicate messages can be created. The frontend in `chat-view.tsx:121` does not send an `Idempotency-Key` header.

**Severity: P1** — users can experience duplicate message sends on unstable connections.

### 4.3 Socket.io Reconnection — No State Recovery

Frontend socket client (`apps/web/lib/socket.ts`) has `reconnection: true` with 10 attempts, but on reconnect it only re-joins the current channel via `onReconnect` callback in `chat-view.tsx:70`. It does not:

- Request missed messages since disconnect
- Re-fetch typing indicators
- Verify presence state is current

**Severity: P2** — transient state loss on reconnect.

### 4.4 `message:deleted` Event — Minimal Payload

Server emits `{ id, channel_id }` (`messages/service.ts:106-108`). The frontend expects `{ id }` (`chat-view.tsx:82`). The `channel_id` is present in the event but not consumed — this is fine, but the mismatch means the frontend cannot validate the event came from the right channel without internal state.

**Severity: P3**

### 4.5 Typing Events — No Debounce or Throttle

The client emits `typing:start` / `typing:stop` on every keystroke (implied from `chat-view.tsx`). There is no client-side debounce or server-side rate limiting on these events.

**Severity: P3** — high-volume typing events under heavy load.

---

## 5. Webhook Delivery Reliability

### 5.1 Webhook Delivery Pipeline Does Not Exist

The SQL migration (`supabase/migrations/webhooks.sql`) creates `webhook_endpoints` and `webhook_deliveries` tables with proper RLS policies. However, **no API route, background worker, or scheduled job ever reads from these tables** to deliver webhooks. The audit service (`apps/api/src/services/audit.ts`) logs to `audit_logs` but never triggers webhook delivery.

**Severity: P0** — the webhook infrastructure is entirely non-functional. Events are never delivered.

### 5.2 No Retry Queue for Deliveries

Even if a worker existed, there is no retry mechanism, dead-letter queue, or exponential backoff. The `webhook_deliveries` table stores `error` and `response_status` but nothing consumes it for retries.

**Severity: P0** (part of 5.1)

### 5.3 No Webhook API Routes

There are no REST endpoints for CRUD on `webhook_endpoints` or viewing `webhook_deliveries`. The tables exist only in SQL.

**Severity: P1** — even if a worker were written, there's no way to create webhook endpoints via the API.

---

## 6. Hidden Coupling Between Modules

### 6.1 Message Service Imports Socket.io Directly

`apps/api/src/modules/messages/service.ts:2` imports `getIO` from `../../lib/socket.js` and calls `io.to(...)` inside the service layer. This tightly couples the message domain to the transport layer, making unit tests harder (the try/catch with no-op on line 64-66 is a workaround for this).

**Severity: P2** — violates separation of concerns; test fragility.

### 6.2 Workspace/Channel Create Uses `getAdminOrAnon()` (Service Role)

`workspaces/service.ts:42` and `channels/service.ts:43` use `getAdminOrAnon()` which bypasses RLS. The workspace creator is added as a member manually. If `getAdminOrAnon()` resolves to the anon key (when `SUPABASE_SERVICE_ROLE_KEY` is unset), the insert will fail or bypass intended security.

**Severity: P2** — ambiguous auth context; could silently degrade security in certain env configs.

### 6.3 Health Service Uses Dynamic Import

`apps/api/src/modules/health/service.ts:36` does `await import("../../lib/supabase.js")` at runtime. This is fragile (TypeScript loses compile-time type safety) and was added to avoid circular dependency at module init.

**Severity: P2** — brittle; dynamic import defeats static analysis.

### 6.4 Audit Service Fire-and-Forget — No Transactional Guarantee

`logAuditEvent` in `services/audit.ts` is called after the response is sent (or before, in the case of deletes). It runs in a separate DB query with no relation to the main operation's transaction. A workspace create could succeed but its audit entry fail silently.

**Severity: P2** — audit trail is eventually-consistent at best, lossy at worst.

### 6.5 Shared Types But No Shared Response Types

Both `apps/api` and `apps/web` import `@chat/db` types (`Message`, `Channel`, etc.), but the HTTP response wrapper types (e.g., `{ messages: Message[] }`) are not shared. Each side independently infers or hardcodes the response shape.

**Severity: P3**

---

## 7. Prioritized Implementation Roadmap

### Phase 1 — Critical (P0)

| #   | Task                                                                                                                                                                        | Files                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Build webhook delivery worker (background job reading `webhook_endpoints`, delivering to URLs, recording results in `webhook_deliveries`, with retry + exponential backoff) | `apps/api/src/services/` (new), `supabase/migrations/webhooks.sql`     |
| 2   | Add CRUD API routes for `webhook_endpoints` (GET/POST/PATCH/DELETE per workspace)                                                                                           | `apps/api/src/modules/webhooks/routes.ts` (new), `apps/api/src/app.ts` |

### Phase 2 — High (P1)

| #   | Task                                                                                                                                                                             | Files                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | Add Zod UUID validation middleware/helper for all `req.params.id`, `req.params.workspaceId`, `req.params.channelId`                                                              | `apps/api/src/middleware/validate-id.ts` (new), all route files                                                                              |
| 4   | Add UUID/format validation for `req.query.before` in `GET /channels/:channelId/messages`                                                                                         | `apps/api/src/modules/messages/routes.ts:41`                                                                                                 |
| 5   | Implement Socket.io ACK pattern for `message:new` events; add `lastEventId` / `from` query param to `GET /channels/:channelId/messages` for missed-message recovery on reconnect | `apps/api/src/lib/socket.ts`, `apps/api/src/modules/messages/service.ts`, `apps/web/lib/socket.ts`, `apps/web/components/chat/chat-view.tsx` |
| 6   | Add idempotency key support to `POST /channels/:channelId/messages` (check `Idempotency-Key` header, deduplicate within TTL)                                                     | `apps/api/src/modules/messages/routes.ts`, `apps/api/src/modules/messages/service.ts`, `apps/web/lib/api.ts`                                 |

### Phase 3 — Medium (P2)

| #   | Task                                                                                                                                       | Files                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 7   | Standardize error responses: never leak `err.message` to client; use `AppError` class consistently instead of inline `res.status().json()` | All route files, `apps/api/src/middleware/error-handler.ts`              |
| 8   | Extract Socket.io emit calls from `messageService` into a transport adapter or event emitter pattern                                       | `apps/api/src/modules/messages/service.ts`                               |
| 9   | Fix DELETE audit ordering: call `logAuditEvent` before sending 204 response (or await it)                                                  | Workspace/channel/message route files                                    |
| 10  | Extract `getAdminOrAnon()` ambiguity; use explicit service-role client for write operations with a clear fallback policy                   | `apps/api/src/lib/supabase.ts`, workspace/channel service files          |
| 11  | Replace dynamic import in health service with direct import (fix circular dependency at module init level)                                 | `apps/api/src/modules/health/service.ts`, `apps/api/src/lib/supabase.ts` |
| 12  | Add client-side debounce to typing events (300ms)                                                                                          | `apps/web/components/chat/chat-view.tsx`                                 |
| 13  | Make audit logging best-effort within the same request lifecycle (non-blocking but awaited within a reasonable timeout)                    | `apps/api/src/services/audit.ts`, all callers                            |

### Phase 4 — Low (P3)

| #   | Task                                                                                                    | Files                                                            |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 14  | Create shared HTTP response type definitions in `packages/db/` or a new `packages/api-types/`           | Cross-package                                                    |
| 15  | Normalize channel route mounting prefix to `app.use("/workspaces", channelRoutes)` or add sub-router    | `apps/api/src/app.ts`, `apps/api/src/modules/channels/routes.ts` |
| 16  | Remove unused routes or add frontend consumers (workspace update/delete, profile update, session check) | Route files + corresponding UI components                        |

---

## Summary Statistics

| Category                 | P0    | P1    | P2    | P3    | OK  |
| ------------------------ | ----- | ----- | ----- | ----- | --- |
| Contract Consistency     | 0     | 0     | 2     | 1     | —   |
| Validation Coverage      | 0     | 1     | 0     | 0     | 1   |
| Error Handling           | 0     | 0     | 2     | 0     | 2   |
| Async Safety / Socket.io | 0     | 2     | 1     | 2     | —   |
| Webhook Delivery         | 2     | 1     | 0     | 0     | —   |
| Hidden Coupling          | 0     | 0     | 4     | 1     | —   |
| **Total**                | **2** | **4** | **9** | **4** | —   |
