# Final Comprehensive API/Endpoint Audit

**Date**: July 24, 2026
**Scope**: Every route file, middleware, validator, lib, and service in `apps/api/src/`
**Files Read**: 27 route files, 12 service files, 15 middleware files, 16 lib files, 8 validator files, app.ts, route-registry.ts
**Total endpoints mapped**: 112

---

## Summary

| Severity | Count | Critical Areas                                           |
| -------- | ----- | -------------------------------------------------------- |
| **P0**   | 9     | Workspace deletion, message access bypass, data leaks    |
| **P1**   | 14    | Inconsistent admin checks, missing validation, DoS risk  |
| **P2**   | 21    | Perf issues, consistency gaps, reliability concerns      |
| **P3**   | 16    | Code quality, standards, polish                          |
| **Total**| **60** |                                                          |

---

## P0 — CRITICAL (Security / Data Breach / Catastrophic Loss)

### P0-01: Any workspace member can delete entire workspace
- **File**: `apps/api/src/modules/workspaces/routes.ts:270-287`
- **Finding**: `DELETE /v1/workspaces/:id` only applies `requireWorkspaceMembership("id")`. No owner/admin role check. Any member (even with role `member`) can permanently delete the workspace and all its data.
- **Fix**: Add `requireWorkspaceRole("owner")` middleware. Only workspace owners should be able to delete.

### P0-02: Reminder endpoints bypass message access control
- **File**: `apps/api/src/modules/messages/routes.ts:506-529`
- **Finding**: `POST /v1/messages/:id/remind` applies `authenticate` + `validateUuidParam` but **NOT** `requireMessageAccess`. Any authenticated user can create a reminder for any message in any channel, including private channels they cannot access.
- **Fix**: Replace `authenticate` with `requireMessageAccess("id")` (authenticate is already applied via `router.use` at line 35).

### P0-03: Reminder list leaks message content via inner join
- **File**: `apps/api/src/modules/messages/routes.ts:531-543`
- **Finding**: `GET /v1/reminders` applies `authenticate` (redundantly, already on router) and does `messages!inner(content, channel_id)` join. While RLS on the user client may filter by channel access, the worker processor (`apps/worker/src/processors/reminder.ts`) fetches messages via admin client and could deliver message content the user should not see.
- **Fix**: Add workspace membership + channel access verification before returning reminders.

### P0-04: Admin export endpoints export ALL data globally with no workspace filter
- **File**: `apps/api/src/modules/export/routes.ts:41-95`
- **Finding**: All 4 export endpoints (`admin/export/workspaces`, `/users`, `/channels`, `/messages`) use `getSupabaseAdmin()` with **no workspace filter**. An admin of any workspace can export ALL users, messages, and channels across the entire Supabase instance, not just their own workspaces.
- **Fix**: Use `requireAdmin("workspaceId")` with a workspaceId parameter and filter queries to that workspace. For users, only export users who are members of the admin's workspaces.

### P0-05: Any workspace member can delete channels (no admin check)
- **File**: `apps/api/src/modules/channels/routes.ts:139-156`
- **Finding**: `DELETE /v1/channels/:id` only applies `requireChannelAccess("id")`. Any workspace member who has channel access can delete the channel. Should require admin/owner role for destructive operations.
- **Fix**: Add role check middleware (require admin/owner) for channel deletion.

### P0-06: GDPR account deletion has no re-authentication
- **File**: `apps/api/src/modules/auth/routes.ts:301-331`
- **Finding**: `DELETE /v1/auth/account` only requires `authenticate`. Any valid bearer token can irreversibly delete the entire user account and all associated data with no password confirmation, email verification, or grace period.
- **Fix**: Require password re-entry or email confirmation. Add a 7-30 day soft-delete grace period.

### P0-07: LiveKit status endpoint exposes infrastructure details without auth
- **File**: `apps/api/src/modules/livekit/routes.ts:44-49`
- **Finding**: `GET /v1/livekit/status` has **NO authentication** and returns `process.env.LIVEKIT_HOST`, leaking internal infrastructure hostnames to unauthenticated users.
- **Fix**: Either remove the endpoint, add authentication, or redact the host value for unauthenticated requests.

### P0-08: Upload endpoint generates signed URLs without channel/workspace verification
- **File**: `apps/api/src/modules/messages/routes.ts:474-503`
- **Finding**: `POST /v1/messages/upload` applies only `authenticate`. Any authenticated user can generate Supabase Storage signed upload URLs. No check that the user is uploading to a valid workspace context. While the file path includes `req.userId`, there's no workspace or channel association.
- **Fix**: Require `channel_id` in the request body, verify channel access, and include workspace_id in the file path.

### P0-09: Channel export leaks user emails
- **File**: `apps/api/src/modules/messages/routes.ts:561-613`
- **Finding**: `GET /v1/channels/:channelId/export` selects `users!inner(display_name, email)` and includes email addresses in the export. Email addresses are PII and should not be exposed in channel-level exports.
- **Fix**: Remove `email` from the select, use display_name only, or require admin role for email-inclusive exports.

---

## P1 — HIGH (Access Control / Data Integrity / DoS)

### P1-01: Feature flag write endpoints grant global admin via any-workspace admin role
- **File**: `apps/api/src/modules/feature-flags/routes.ts:62,81,99`
- **Finding**: `POST/PATCH/DELETE /v1/feature-flags/*` use `requireAdmin()` with **no paramName**. This calls `requireAdmin(null)` which checks if the user is admin of ANY workspace, not a specific one. Any user who is admin of one workspace can create/update/delete global feature flags affecting all users.
- **Fix**: Feature flags should require a platform-level super-admin role (not workspace admin), or add a separate `is_platform_admin` check.

### P1-02: Three different `requireAdmin` implementations exist with different behavior
- **Files**: `admin/routes.ts:14-37`, `workspaces/routes.ts:166-173`, `middleware/require-admin.ts`
- **Finding**: Three divergent admin check implementations:
  - `middleware/require-admin.ts`: Checks if user is admin of ANY workspace when paramName is null, or a specific workspace when provided
  - `admin/routes.ts:14-37`: Checks if user is admin of ANY workspace and sets `adminWorkspaceIds`
  - `workspaces/routes.ts:166-173`: Checks `workspaceRole` from `requireWorkspaceMembership` — only valid AFTER the membership middleware
- **Fix**: Consolidate to a single implementation in `middleware/require-admin.ts`. Remove inline implementations.

### P1-03: GDPR export fetches 21 parallel DB queries with no pagination (DoS risk)
- **File**: `apps/api/src/modules/auth/routes.ts:217-298`
- **Finding**: `GET /v1/auth/export` fires 21 parallel `select("*")` queries using `getSupabaseAdmin()` with **no pagination**. For active users with thousands of messages/reactions/etc., this could OOM the server or timeout the connection.
- **Fix**: Add pagination to large tables (messages, notifications, reactions). Use streaming JSON output.

### P1-04: Admin stats endpoint leaks global counts across workspaces
- **File**: `apps/api/src/modules/admin/routes.ts:67-84`
- **Finding**: `GET /v1/admin/stats` uses `admin.from("users").select("*", { count: "exact", head: true })` without workspace filter, exposing total user count. Messages count also unfiltered. A workspace admin can see global platform metrics.
- **Fix**: Filter all count queries to the admin's workspace scope.

### P1-05: Bookmark endpoints have no ownership verification
- **Files**: `apps/api/src/modules/channels/routes.ts:331-371`
- **Finding**: `PATCH /v1/channels/:id/bookmarks/:bookmarkId` and `DELETE /v1/channels/:id/bookmarks/:bookmarkId` only require `requireChannelAccess("id")`. Any channel member can edit or delete any bookmark, not just their own.
- **Fix**: Add `created_by = req.userId` check before allowing bookmark mutation.

### P1-06: Bookmark POST endpoint has no Zod input validation
- **File**: `apps/api/src/modules/channels/routes.ts:302-329`
- **Finding**: `POST /v1/channels/:id/bookmarks` reads `title, messageId, url, emoji` directly from `req.body` with only a manual `if (!title)` check. No Zod schema, no URL format validation, no emoji validation.
- **Fix**: Add a `createBookmarkSchema` Zod validator and use it.

### P1-07: Channel member add endpoint has no admin check
- **File**: `apps/api/src/modules/channels/routes.ts:175-200`
- **Finding**: `POST /v1/channels/:id/members` only requires `requireChannelAccess`. Any channel member can add anyone else to the channel. Should require workspace admin or channel management permission.
- **Fix**: Add `requireWorkspaceRole("admin")` or a channel-specific management permission check.

### P1-08: Scheduled posts POST has no content sanitization
- **File**: `apps/api/src/modules/scheduled-posts/routes.ts:57-80`
- **Finding**: `POST /v1/scheduled-posts` accepts `content` from `req.body` without Zod validation, without content length limit, and without HTML sanitization. When the worker posts the message, it could contain XSS payloads.
- **Fix**: Apply the same `createMessageSchema` validation and `sanitizeContent` function used in message creation.

### P1-09: AI rewrite endpoint has no input validation or length limits
- **File**: `apps/api/src/modules/ai/routes.ts:8-47`
- **Finding**: `POST /v1/ai/rewrite` reads `text` and `action` from `req.body` without Zod schema. No max text length, no action whitelist validation. A malicious client could send megabytes of text.
- **Fix**: Add Zod validation with max length (e.g., 4000 chars) and enum validation for action values.

### P1-10: `requireMessageAccess` middleware does redundant DB queries
- **File**: `apps/api/src/middleware/require-membership.ts:149-225`
- **Finding**: `requireMessageAccess` does up to 5 sequential DB lookups per request (message → channel → workspace_member → deny_override → private_channel_member). This is called on every message patch, delete, pin, flag, forward, and reaction operation.
- **Fix**: Combine queries where possible. Cache workspace membership for the request duration.

### P1-11: `GET /v1/dm-channels` has no workspace filter — cross-workspace data leak
- **File**: `apps/api/src/modules/channels/routes.ts:248-255`
- **Finding**: `GET /v1/dm-channels` queries all DM channels via `dm_members` table without any workspace filter. While the user client has RLS, DM channels span workspaces — a user could see DM channels from workspaces they've left but still have DM records.
- **Fix**: Add workspace_id filter. DM channels should be scoped to a workspace context.

### P1-12: `emitToUser()` is a dead code path — user:${userId} room never joined
- **File**: `apps/api/src/lib/socket.ts:308-311`
- **Finding**: `emitToUser()` emits to `user:${userId}` room, but socket connections only join `channel:${channelId}` rooms (in the `channel:join` handler at line 196). The `user:${userId}` room is never created or joined. Any code calling `emitToUser()` silently fails.
- **Fix**: Either add `socket.join("user:${userId}")` in the connection handler, or remove the function. If kept, ensure all sockets auto-join their user room on connect.

### P1-13: CSV user import inserts into `public.users` without creating `auth.users`
- **File**: `apps/api/src/modules/import/routes.ts:49-82`
- **Finding**: `POST /v1/admin/import/users` inserts rows into `public.users` directly with `admin.from("users").insert()`. No corresponding `auth.users` entry is created. Imported users cannot log in. The `public.users` table likely has an FK to `auth.users.id` which would cause constraint violations.
- **Fix**: Use Supabase Admin API to create auth users first, then insert into public.users. Or document that this endpoint is for importing into existing auth users.

### P1-14: `POST /v1/status/presence/batch` has no input size validation
- **File**: `apps/api/src/modules/status/routes.ts:120-147`
- **Finding**: Accepts `userIds` array with no maximum length limit. An attacker could send thousands of UUIDs to cause a large `IN` query.
- **Fix**: Add `max(100)` Zod validation or manual length check.

---

## P2 — MEDIUM (Consistency / Reliability / Performance)

### P2-01: Duplicate `authenticate` middleware on reminder endpoints
- **File**: `apps/api/src/modules/messages/routes.ts:508,533,548`
- **Finding**: `POST /messages/:id/remind`, `GET /reminders`, `DELETE /reminders/:id` all explicitly pass `authenticate` as middleware, but the router already applies `router.use(authenticate)` at line 35. Auth runs twice.
- **Fix**: Remove the duplicate `authenticate` from all three route definitions.

### P2-02: Route registry `endpoints` field incomplete for 25 of 27 routers
- **File**: `apps/api/src/route-registry.ts:93-115`
- **Finding**: Only `health` and `auth` have populated `endpoints` arrays. The other 25 routers have only `path`, `router`, and `description`. The `endpoints` field is declared in the `RouteEntry` interface but unused for registration — only the `router` is mounted. This means the registry is misleading as documentation.
- **Fix**: Either populate endpoints for all routers or remove the `endpoints` field from the interface.

### P2-03: `responseCache` never invalidated on mutations
- **File**: `apps/api/src/middleware/cache.ts`
- **Finding**: The `responseCache` middleware caches GET responses but `invalidateCache()` is never called from any route handler after create/update/delete operations. Channel list, member list, and other cached endpoints serve stale data.
- **Fix**: Call `invalidateCache(pattern)` in route handlers after mutations. At minimum, invalidate channel and workspace caches when related data changes.

### P2-04: OpenAPI spec endpoints have no authentication
- **File**: `apps/api/src/modules/openapi/routes.ts:77-83`
- **Finding**: `GET /v1/openapi.json` and `GET /v1/changelog` have no authentication. While the spec itself is not sensitive, it exposes the full API surface to unauthenticated scanners.
- **Fix**: Add authentication or at minimum a rate limit.

### P2-05: `responseCache` wraps `res.json` after route handler starts — potential data corruption
- **File**: `apps/api/src/middleware/cache.ts:131-138`
- **Finding**: The cache middleware overrides `res.json` to intercept the response data. If the route handler calls `res.json` multiple times or the response is streamed, only the first call is cached. Additionally, if an error is thrown after `res.json` but before the response is sent, the cache stores potentially incorrect data.
- **Fix**: Use `res.on("finish")` to capture the final response body instead of overriding `res.json`.

### P2-06: Message search uses ILIKE with no index support
- **File**: `apps/api/src/modules/messages/routes.ts:100`
- **Finding**: `GET /v1/messages/search` uses `ILIKE '%query%'` pattern matching which cannot use a standard B-tree index. On large message volumes (>100K), this will require a sequential scan and timeout.
- **Fix**: Use PostgreSQL full-text search (`to_tsvector`/`to_tsquery`) with a GIN index, or use the `search_index` table populated by the search-indexer worker.

### P2-07: Channel export loads all messages without pagination
- **File**: `apps/api/src/modules/messages/routes.ts:561-613`
- **Finding**: `GET /v1/channels/:channelId/export` fetches ALL messages in a channel without pagination. A channel with 10,000+ messages will OOM the server.
- **Fix**: Add pagination with cursor-based export, or enforce a maximum row limit.

### P2-08: `GET /v1/messages/flagged` uses raw parseInt instead of parsePaginationParams
- **File**: `apps/api/src/modules/messages/routes.ts:350-351`
- **Finding**: Uses `parseInt(req.query.limit as string) || 50` with manual `Math.min` for capping. Inconsistent with other routes that use the shared `parsePaginationParams()` utility.
- **Fix**: Replace with `parsePaginationParams(req.query.limit, req.query.offset, 50, 100)`.

### P2-09: CSV export in messages/routes.ts duplicates CSV logic from lib/csv.ts
- **File**: `apps/api/src/modules/messages/routes.ts:588-603`
- **Finding**: The channel export endpoint has its own inline CSV generation code (manual header, manual quote escaping) instead of using the shared `rowsToCsv()` function from `lib/csv.ts`.
- **Fix**: Use `rowsToCsv(rows, columns)` and `sendExportResponse()` from the shared CSV library.

### P2-10: Admin `requireAdmin` inline middleware sets `adminWorkspaceIds` as ANY workspace admin
- **File**: `apps/api/src/modules/admin/routes.ts:14-37`
- **Finding**: The inline `requireAdmin` in admin routes queries `workspace_members` with `.in("role", ["owner", "admin"])` without workspace param, collecting ALL workspace IDs where the user is admin. This gives admin users visibility into every workspace they administer, which may not be the intended scope for every admin endpoint.
- **Fix**: Scope admin access to a specific workspaceId parameter, similar to how `requireWorkspaceMembership` works. Or clearly document this is intentional "super-admin" behavior.

### P2-11: Thread list uses deeply nested inner joins that break on deleted messages
- **File**: `apps/api/src/modules/threads/routes.ts:16-24`
- **Finding**: `GET /v1/threads` uses `thread_metadata!inner(messages!inner(...))`. If the parent message is soft-deleted, the inner join returns no row, silently hiding the thread from the user's thread list.
- **Fix**: Use `LEFT JOIN` semantics or filter deleted messages at the application level.

### P2-12: Channel creation has no slug validation on the service layer
- **File**: `apps/api/src/modules/channels/routes.ts:51-96`
- **Finding**: `POST /v1/workspaces/:workspaceId/channels` validates input with `createChannelSchema` which makes `slug` optional. But the service layer (`channelService.create`) always generates a slug from the name. If the client provides a slug, it's silently ignored.
- **Fix**: Use client-provided slug if valid. Document slug generation behavior.

### P2-13: DM channel creation is race-prone (check-then-create pattern)
- **File**: `apps/api/src/modules/channels/service.ts:244-308`
- **Finding**: `createGroupChannel` for 2-person DMs checks for existing DM via `dm_members` SELECT, then creates a new channel if not found. Two concurrent requests could both pass the check and create duplicate DMs.
- **Fix**: Use a database-level uniqueness constraint with `ON CONFLICT` handling, or use a transaction with `SELECT ... FOR UPDATE`.

### P2-14: Webhook `enforceBodyLimit` only checks Content-Length header
- **File**: `apps/api/src/modules/webhooks/routes.ts:19-28`
- **Finding**: The `enforceBodyLimit` middleware reads `Content-Length` header which can be spoofed. The actual body size enforcement comes from `express.json({ limit: "1mb" })` in app.ts. The middleware is redundant and misleading.
- **Fix**: Remove the middleware and rely on Express's built-in body size limit. If custom behavior is needed, use a streaming body parser.

### P2-15: `GET /v1/threads/:id/participants` replicates full channel access check inline
- **File**: `apps/api/src/modules/threads/routes.ts:43-96`
- **Finding**: The participants endpoint manually replicates the entire workspace membership + private channel check logic (50+ lines) instead of using `requireChannelAccess` middleware.
- **Fix**: Refactor to extract the `channel_id` from the thread metadata and delegate to `requireChannelAccess`.

### P2-16: `GET /v1/status/batch` filter query is vulnerable to SQL structure issues
- **File**: `apps/api/src/modules/status/routes.ts:107-108`
- **Finding**: `or('expires_at.gt.${new Date().toISOString()}')` uses string interpolation to build a Supabase filter. While Supabase uses parameterized queries internally, the date format could vary between environments.
- **Fix**: Use Supabase's parameterized filter: `.or('expires_at.gt.' + now)` or use `.gt('expires_at', new Date().toISOString())` with `.is('expires_at', null)` combined.

### P2-17: `GET /v1/channels/:id/members/history` has no pagination
- **File**: `apps/api/src/modules/channels/routes.ts:399-414`
- **Finding**: Only applies `.limit(50)` but no offset, making pagination impossible. To get the next page, there's no cursor or offset mechanism.
- **Fix**: Add offset/cursor-based pagination.

### P2-18: `requireChannelAccess` middleware may bypass channel deny overrides for admin users
- **File**: `apps/api/src/middleware/require-membership.ts:109-124`
- **Finding**: The deny override check at lines 109-124 queries `channel_role_overrides` but this runs AFTER the workspace membership check. If a user is a workspace owner/admin, they get access regardless. But the deny override should be able to explicitly deny access even to admins.
- **Fix**: Move the deny override check to run regardless of role. An explicit deny should always win.

### P2-19: Admin audit-logs endpoint uses `organization_id` column name inconsistent with workspace_id
- **File**: `apps/api/src/modules/admin/routes.ts:467`
- **Finding**: `GET /v1/admin/audit-logs` filters by `organization_id` (line 467) but the query parameter is named `workspaceId`. The column name `organization_id` is inconsistent with the rest of the codebase which uses `workspace_id`.
- **Fix**: Rename `organization_id` to `workspace_id` in the database schema (via migration) or at minimum document the mapping.

### P2-20: `GET /v1/threads/:id/unread` and `POST /v1/threads/:id/join` have no workspace membership check
- **File**: `apps/api/src/modules/threads/routes.ts:99-137`
- **Finding**: These endpoints only validate that the thread ID is a valid UUID. No check that the user is a member of the workspace containing the thread's parent message.
- **Fix**: Add workspace membership verification by resolving the thread's parent message → channel → workspace.

### P2-21: Socket.io `emitToUser()` declared but dead — user rooms never joined
- **File**: `apps/api/src/lib/socket.ts:308-311`
- **Finding**: `emitToUser()` emits to `user:${userId}` but sockets only ever join `channel:${channelId}` rooms (line 196). The `user:${userId}` room concept doesn't exist, making `emitToUser()` silently fail.
- **Fix**: Add `socket.join("user:${userId}")` in the connection handler after successful auth, or remove the function if user-room targeting isn't needed.

---

## P3 — LOW (Code Quality / Standards / Polish)

### P3-01: Error response format inconsistent across routes
- **Finding**: Multiple competing formats:
  - `{ error: { code, message } }` — standard via AppError
  - `{ success: false, error: { code, message, status } }` — deprecated from `response.ts`
  - `{ ok: true }` — read receipts use this
  - `{ success: true }` — workspace ops, reactions, pins use this
  - `{ data: { ... } }` — specified in response.ts conventions but rarely used
- **Files**: `read-receipts/routes.ts:23`, `workspaces/routes.ts:204`, `reactions/routes.ts`, `messages/routes.ts:285`
- **Fix**: Standardize on `{ data: T }` for success and `{ error: { code, message } }` for errors per the documented conventions in `response.ts`.

### P3-02: UUID param validation not applied consistently
- **Files**: Multiple route files
- **Finding**: `validateUuidParam` is used on most route params like `:id`, `:workspaceId`, `:channelId`, but NOT on:
  - `scheduled-posts/routes.ts` — no UUID validation on `:id`
  - `user-groups/routes.ts` — no UUID validation on `:id`, `:userId`
  - `notifications/routes.ts` — no UUID validation on `trigger-words/:id`
- **Fix**: Add `validateUuidParam` to all UUID route parameters.

### P3-03: `responseCache` has no cache eviction strategy
- **File**: `apps/api/src/middleware/cache.ts`
- **Finding**: The in-memory `Map` cache grows unbounded. No TTL-based cleanup, no max size limit, no LRU eviction. Under sustained load, this will cause a memory leak.
- **Fix**: Implement periodic cleanup of expired entries. Add max cache size with LRU eviction.

### P3-04: `GET /v1/messages/flagged` has no workspace filter
- **File**: `apps/api/src/modules/messages/routes.ts:346-360`
- **Finding**: Returns flagged messages from ALL workspaces without filtering by workspace. A user might see flagged messages from workspaces they've left (assuming RLS on the message_flags table allows access to old records).
- **Fix**: Accept optional `workspace_id` query parameter to filter flagged messages.

### P3-05: `POST /v1/messages/upload` filename sanitization causes collisions
- **File**: `apps/api/src/modules/messages/routes.ts:486`
- **Finding**: `fileName.replace(/[^a-zA-Z0-9._-]/g, "_")` replaces ALL non-alphanumeric chars with underscore. Two different filenames like `my file.jpg` and `my-file.jpg` both become `my_file.jpg`, causing upload collisions.
- **Fix**: Preserve the original filename in a metadata field. Use UUID prefixes to avoid collisions.

### P3-06: Admin security endpoint has misleading OAuth provider detection
- **File**: `apps/api/src/modules/admin/routes.ts:375-377`
- **Finding**: Google and GitHub OAuth providers are reported as enabled if `!!env.SUPABASE_URL` is truthy, regardless of whether those providers are actually configured in Supabase Auth. SUPABASE_URL is always set if Supabase is initialized.
- **Fix**: Query the Supabase Auth admin API for actual provider configuration, or add explicit env vars.

### P3-07: `initSocket` middleware errors disconnect without logging error details
- **File**: `apps/api/src/lib/socket.ts:85-131`
- **Finding**: Socket middleware calls `next(new Error(...))` for auth failures but never logs the actual error stack. Only `logger.warn` is called for the invalid token case.
- **Fix**: Add logging for all auth middleware error paths including stack traces.

### P3-08: Route registry comment says `/health` is at root but it's at `/health`
- **File**: `apps/api/src/route-registry.ts:37-38`
- **Finding**: Comment says "The health endpoint at / is a legacy exception" but registered as `{ path: "/", router: healthRoutes }` where healthRoutes has `GET /health`. So the actual URL is `/health`, not `/`.
- **Fix**: Correct the comment. `/` returns full health via app.ts:97, `/health` returns the health service check.

### P3-09: `POST /v1/webhooks` requires HTTPS URLs but doesn't enforce on PATCH
- **File**: `apps/api/src/modules/webhooks/routes.ts:37,44`
- **Finding**: `createWebhookSchema` requires `.url().startsWith("https://")` but `updateWebhookSchema` uses `.url()` without the HTTPS prefix requirement. A webhook could be created with HTTPS then updated to HTTP.
- **Fix**: Add `startsWith("https://")` to `updateWebhookSchema.url`.

### P3-10: GDPR export Promise.all has no error isolation for individual queries
- **File**: `apps/api/src/modules/auth/routes.ts:247-268`
- **Finding**: All 21 queries run in a single `Promise.all`. If any one query fails, the entire export returns an error via the `asyncHandler` catch. The user gets no partial data.
- **Fix**: Use `Promise.allSettled` and return partial data with errors attached, similar to the compliance export approach in `admin/routes.ts:552-568`.

### P3-11: `GET /v1/admin/config` leaks implementation details
- **File**: `apps/api/src/modules/admin/routes.ts:422-443`
- **Finding**: Returns `smtpConfigured`, `redisConfigured`, `vapidConfigured`, `sentryConfigured` booleans and the Supabase project ref. While behind admin auth, this exposes internal configuration that could aid targeted attacks.
- **Fix**: Limit to non-sensitive configuration, or restrict to owner-only.

### P3-12: No rate limiting on expensive search endpoint
- **File**: `apps/api/src/modules/messages/routes.ts:37-154`
- **Finding**: `GET /v1/messages/search` uses the general `apiLimiter` (100 req/min) but has no dedicated, stricter rate limit despite being one of the most expensive endpoints (ILIKE on messages table).
- **Fix**: Apply `searchLimiter` to the messages search endpoint.

### P3-13: Scheduled posts have no Zod input validation
- **File**: `apps/api/src/modules/scheduled-posts/routes.ts:57-80`
- **Finding**: `POST /v1/scheduled-posts` reads `channel_id`, `content`, `scheduled_at` directly from `req.body` with only truthiness checks. No Zod schema, no content sanitization, no future-date format validation beyond basic Date parsing.
- **Fix**: Add a Zod schema with all required validations and apply `sanitizeContent`.

### P3-14: Emoji delete endpoint uses `BadRequestError` for auth failures instead of `ForbiddenError`
- **File**: `apps/api/src/modules/emoji/routes.ts:57,67`
- **Finding**: `DELETE /v1/emoji/:id` throws `BadRequestError("Emoji not found")` and `BadRequestError("Not a member...")` for cases that should be 404 and 403 respectively.
- **Fix**: Use `NotFoundError` for missing emoji, `ForbiddenError` for non-member access.

### P3-15: Workspace bootstrap endpoint fetches ALL channels without pagination
- **File**: `apps/api/src/modules/workspaces/routes.ts:55-68`
- **Finding**: `GET /v1/workspaces/bootstrap` calls `channelService.listByWorkspace(ws.id)` for each workspace without limit/offset. A user with access to workspaces containing hundreds of channels each would get a massive response.
- **Fix**: Add a reasonable limit per workspace (e.g., 50 channels) to the bootstrap endpoint.

### P3-16: Admin log endpoint exposes in-memory error buffer without rate limiting
- **File**: `apps/api/src/modules/admin/routes.ts:410-420`
- **Finding**: `GET /v1/admin/logs` returns `getErrors(limit, level)` from the in-memory error buffer. The default limit is 100 and max is 200, but there's no type safety on the `level` filter param.
- **Fix**: Add Zod validation for limit/level query params.

---

## Endpoint Inventory (Complete)

### Auth (`/v1/auth`) — 12 endpoints

| Method | Path                                          | Auth                 | Validation | Membership |
| ------ | --------------------------------------------- | -------------------- | ---------- | ---------- |
| POST   | `/v1/auth/magic-link`                         | authLimiter+magicLink| Zod email  | N/A        |
| GET    | `/v1/auth/session`                            | authenticate         | N/A        | N/A        |
| PATCH  | `/v1/auth/profile`                            | authenticate         | Zod profile| N/A        |
| GET    | `/v1/auth/online`                             | authenticate         | N/A        | N/A        |
| POST   | `/v1/auth/profiles`                           | authenticate         | Zod batch  | N/A        |
| GET    | `/v1/auth/search`                             | authenticate+search  | Manual     | N/A        |
| POST   | `/v1/auth/avatar`                             | authenticate         | Zod avatar | N/A        |
| GET    | `/v1/auth/avatar/:userId`                     | authenticate         | N/A        | N/A        |
| GET    | `/v1/auth/status`                             | authenticate         | N/A        | N/A        |
| PATCH  | `/v1/auth/status`                             | authenticate         | Manual     | N/A        |
| GET    | `/v1/auth/export`                             | authenticate+gdpr    | N/A        | N/A        |
| DELETE | `/v1/auth/account`                            | authenticate         | N/A        | N/A        |

### Workspaces (`/v1/workspaces`) — 10 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/workspaces`                              | authenticate         | parsePagination   | N/A (RLS)                 |
| GET    | `/v1/workspaces/bootstrap`                    | authenticate         | N/A               | N/A (RLS)                 |
| POST   | `/v1/workspaces`                              | authenticate         | Zod workspace     | N/A                        |
| GET    | `/v1/workspaces/:id`                          | authenticate         | UUID              | requireWorkspaceMembership|
| PATCH  | `/v1/workspaces/:id`                          | authenticate         | UUID+Zod          | requireWorkspaceMembership|
| GET    | `/v1/workspaces/:id/members`                  | authenticate         | UUID              | requireWorkspaceMembership|
| POST   | `/v1/workspaces/:id/members`                  | authenticate         | UUID+Zod          | membership+requireAdmin   |
| PATCH  | `/v1/workspaces/:id/members/:userId`          | authenticate         | UUID+Zod          | membership+requireAdmin   |
| DELETE | `/v1/workspaces/:id/members/:userId`          | authenticate         | UUID              | membership+requireAdmin   |
| DELETE | `/v1/workspaces/:id`                          | authenticate         | UUID              | requireWorkspaceMembership|

### Channels (`/v1`) — 20 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/workspaces/:workspaceId/channels`        | authenticate         | UUID+parsePag     | requireWorkspaceMembership|
| POST   | `/v1/workspaces/:workspaceId/channels`        | authenticate         | UUID+Zod          | requireWorkspaceMembership|
| PATCH  | `/v1/workspaces/:workspaceId/channels/reorder`| authenticate         | UUID              | requireWorkspaceMembership|
| GET    | `/v1/workspaces/:workspaceId/channel-ids`     | authenticate         | UUID              | requireWorkspaceMembership|
| GET    | `/v1/channels/:id`                            | authenticate         | UUID              | requireChannelAccess      |
| PATCH  | `/v1/channels/:id`                            | authenticate         | UUID+Zod          | requireChannelAccess      |
| DELETE | `/v1/channels/:id`                            | authenticate         | UUID              | requireChannelAccess      |
| GET    | `/v1/channels/:id/members`                    | authenticate         | UUID+parsePag     | requireChannelAccess      |
| POST   | `/v1/channels/:id/members`                    | authenticate         | UUID+Zod          | requireChannelAccess      |
| DELETE | `/v1/channels/:id/members/:userId`            | authenticate         | UUID              | requireChannelAccess      |
| GET    | `/v1/channels/:id/members/history`            | authenticate         | UUID              | requireChannelAccess      |
| GET    | `/v1/channels/:id/bookmarks`                  | authenticate         | UUID              | requireChannelAccess      |
| POST   | `/v1/channels/:id/bookmarks`                  | authenticate         | UUID              | requireChannelAccess      |
| PATCH  | `/v1/channels/:id/bookmarks/:bookmarkId`      | authenticate         | UUID              | requireChannelAccess      |
| DELETE | `/v1/channels/:id/bookmarks/:bookmarkId`      | authenticate         | UUID              | requireChannelAccess      |
| POST   | `/v1/workspaces/:workspaceId/dm`              | authenticate         | UUID              | requireWorkspaceMembership|
| POST   | `/v1/workspaces/:workspaceId/gm`              | authenticate         | UUID              | requireWorkspaceMembership|
| GET    | `/v1/dm-channels`                             | authenticate         | N/A               | N/A                        |

### Messages (`/v1`) — 18 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/messages/search`                         | authenticate         | Zod search        | N/A (RLS on channels)     |
| GET    | `/v1/channels/:channelId/messages`            | authenticate         | UUID              | requireChannelAccess      |
| POST   | `/v1/channels/:channelId/messages`            | authenticate         | UUID+Zod          | requireChannelAccess      |
| PATCH  | `/v1/messages/:id`                            | authenticate         | UUID+Zod          | requireMessageAccess      |
| DELETE | `/v1/messages/:id`                            | authenticate         | UUID              | requireMessageAccess      |
| POST   | `/v1/messages/:id/pin`                        | authenticate         | UUID              | requireMessageAccess      |
| DELETE | `/v1/messages/:id/pin`                        | authenticate         | UUID              | requireMessageAccess      |
| GET    | `/v1/channels/:channelId/pinned`              | authenticate         | UUID              | requireChannelAccess      |
| POST   | `/v1/messages/:id/flag`                       | authenticate         | UUID              | requireMessageAccess      |
| DELETE | `/v1/messages/:id/flag`                       | authenticate         | UUID              | requireMessageAccess      |
| GET    | `/v1/messages/flagged`                        | authenticate         | N/A               | N/A                        |
| POST   | `/v1/messages/:id/forward`                    | authenticate         | UUID              | requireMessageAccess      |
| GET    | `/v1/messages/:id/history`                    | authenticate         | UUID              | requireMessageAccess      |
| POST   | `/v1/messages/upload`                         | authenticate         | Zod upload        | N/A                        |
| POST   | `/v1/messages/:id/remind`                     | 2x authenticate      | UUID              | N/A                        |
| GET    | `/v1/reminders`                               | 2x authenticate      | N/A               | N/A                        |
| DELETE | `/v1/reminders/:id`                           | 2x authenticate      | N/A               | N/A                        |
| GET    | `/v1/channels/:channelId/export`              | authenticate         | UUID              | requireChannelAccess      |

### Notifications (`/v1`) — 10 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/notifications`                           | authenticate         | parsePagination   | N/A                        |
| GET    | `/v1/notifications/unread`                    | authenticate         | N/A               | N/A                        |
| GET    | `/v1/notifications/preferences`               | authenticate         | N/A               | N/A                        |
| GET    | `/v1/channels/:id/notification-preference`    | authenticate         | UUID              | requireChannelAccess      |
| PUT    | `/v1/channels/:id/notification-preference`    | authenticate         | UUID              | requireChannelAccess      |
| DELETE | `/v1/channels/:id/notification-preference`    | authenticate         | UUID              | requireChannelAccess      |
| GET    | `/v1/trigger-words`                           | authenticate         | N/A               | N/A                        |
| POST   | `/v1/trigger-words`                           | authenticate         | Manual            | N/A                        |
| DELETE | `/v1/trigger-words/:id`                       | authenticate         | N/A               | N/A                        |
| GET    | `/v1/notifications/trigger-words`             | authenticate         | N/A               | N/A                        |

### Webhooks (`/v1`) — 6 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/webhooks`                                | authenticate         | Workspace query   | workspace member check    |
| POST   | `/v1/webhooks`                                | authenticate         | Zod+SSRF          | workspace member check    |
| GET    | `/v1/webhooks/:id`                            | authenticate         | UUID              | workspace member check    |
| PATCH  | `/v1/webhooks/:id`                            | authenticate         | UUID+Zod+SSRF     | workspace member check    |
| DELETE | `/v1/webhooks/:id`                            | authenticate         | UUID              | workspace member check    |
| GET    | `/v1/webhooks/deliveries`                     | authenticate         | Workspace query   | workspace member check    |

### Reactions (`/v1`) — 4 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/messages/:id/reactions`                  | authenticate         | UUID              | requireMessageAccess      |
| GET    | `/v1/reactions/batch`                         | authenticate         | Manual            | Inline check              |
| POST   | `/v1/messages/:id/reactions`                  | authenticate         | UUID              | requireMessageAccess      |
| DELETE | `/v1/messages/:id/reactions/:emoji`            | authenticate         | UUID              | requireMessageAccess      |

### Threads (`/v1`) — 6 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/threads`                                 | authenticate         | N/A               | N/A (RLS)                 |
| GET    | `/v1/messages/:id/thread`                     | authenticate         | UUID              | requireChannelAccess("id")|
| GET    | `/v1/threads/:id/participants`                | authenticate         | UUID              | Inline check              |
| POST   | `/v1/threads/:id/join`                        | authenticate         | UUID              | N/A                        |
| POST   | `/v1/threads/:id/leave`                       | authenticate         | UUID              | N/A                        |
| GET    | `/v1/threads/:id/unread`                      | authenticate         | UUID              | N/A                        |

### Preferences / Status / Feature Flags / Consent — 12 endpoints

| Method | Path                                          | Auth                 | Validation        | Membership                |
| ------ | --------------------------------------------- | -------------------- | ----------------- | ------------------------- |
| GET    | `/v1/preferences`                             | authenticate         | N/A               | N/A                        |
| PATCH  | `/v1/preferences`                             | authenticate         | Zod               | N/A                        |
| GET    | `/v1/status`                                  | authenticate         | N/A               | N/A                        |
| PUT    | `/v1/status`                                  | authenticate         | Manual            | N/A                        |
| DELETE | `/v1/status`                                  | authenticate         | N/A               | N/A                        |
| POST   | `/v1/status/batch`                            | authenticate         | N/A               | N/A                        |
| POST   | `/v1/status/presence/batch`                   | authenticate         | N/A               | N/A                        |
| GET    | `/v1/auto-responder`                          | authenticate         | Manual            | N/A                        |
| PUT    | `/v1/auto-responder`                          | authenticate         | Manual            | N/A                        |
| GET    | `/v1/feature-flags`                           | authenticate         | N/A               | N/A                        |
| GET    | `/v1/feature-flags/:key`                      | authenticate         | N/A               | N/A                        |
| POST   | `/v1/feature-flags`                           | authenticate         | Zod               | requireAdmin (global)     |
| PATCH  | `/v1/feature-flags/:key`                      | authenticate         | StringKey+Zod     | requireAdmin (global)     |
| DELETE | `/v1/feature-flags/:key`                      | authenticate         | StringKey         | requireAdmin (global)     |
| POST   | `/v1/feature-flags/:key/evaluate`             | authenticate         | Zod               | N/A                        |
| GET    | `/v1/consent`                                 | authenticate         | N/A               | N/A                        |
| POST   | `/v1/consent`                                 | authenticate         | Manual            | N/A                        |

### Remaining Modules — 24 endpoints

**Emoji** (3): GET/POST `/v1/workspaces/:workspaceId/emoji`, DELETE `/v1/emoji/:id`
**Sidebar Categories** (8): GET/POST `/v1/sidebar-categories`, PATCH/DELETE `/:id`, POST/DELETE `/:id/assignments`, PATCH `/reorder`, PATCH `/:id/assignments/reorder`
**Scheduled Posts** (3): GET/POST `/v1/scheduled-posts`, DELETE `/:id`
**User Groups** (7): GET/POST `/v1/groups`, PATCH/DELETE `/:id`, GET/POST/DELETE `/:id/members`
**Workspace Groups** (5): GET/POST `/v1/workspaces/:workspaceId/groups`, POST/DELETE `/v1/groups/:id/members`, DELETE `/:id`
**LiveKit** (2): GET `/v1/livekit/token`, GET `/v1/livekit/status`
**Audit** (2): GET `/v1/audit/logs`, GET `/v1/audit/logs/:id`
**AI** (1): POST `/v1/ai/rewrite`
**OpenAPI** (2): GET `/v1/openapi.json`, GET `/v1/changelog`
**Read Receipts** (5): POST `/v1/channels/:id/read`, GET `/last-viewed`, POST `/v1/messages/:id/read`, GET `/readers`, GET `/v1/unread/counts`
**Announcements** (3): GET/POST `/v1/workspaces/:workspaceId/announcements`, PATCH `/:id/dismiss`
**Admin** (17): stats, users, channels, workspaces, integrations, health, system, webhooks/deliveries, webhooks/dead-letters, dead-letters/:id/retry, security, logs, config, audit-logs, export/compliance, exports, exports/:id/download
**Export** (4): admin/export/workspaces, users, channels, messages
**Import** (2): admin/import/workspaces, users

---

## Middleware Chain Analysis (app.ts order)

```
1. trust proxy (1 hop)
2. compression
3. GET /healthz (pre-CORS, no auth)
4. CORS (origin === frontendUrl, credentials: true)
5. helmet (crossOriginResourcePolicy: false)
6. securityHeaders (CSP, HSTS, X-* headers)
7. express.json({ limit: "1mb" })
8. inputSanitizer (XSS + SQLi pattern blocking)
9. cookieParser
10. doubleSubmitCookieCsrf (origin check + CSRF token)
11. requestId (UUID per request)
12. apiLimiter (100 req/min composite key)
13. metricsMiddleware
14. deprecationMiddleware (sunset headers)
15. requestTimeout (30s)
16. route handlers (mounted from routeRegistry)
17. GET / (health check)
18. GET /metrics (authenticate required)
19. sentryErrorMiddleware
20. errorHandler (global catch-all)
```

### Middleware Gap Analysis

| Check                    | Status    | Notes                                                       |
| ------------------------ | --------- | ----------------------------------------------------------- |
| CORS                     | OK        | Strict: origin === frontendUrl only                         |
| CSRF                     | OK        | Double-submit cookie pattern + origin check                 |
| Rate Limiting            | OK        | Global 100/min. Auth 10/min. Search 30/min. Magic link 3/min|
| Security Headers         | OK        | CSP, HSTS, X-*, COEP/COOP/CORP, Permissions-Policy          |
| Input Sanitization       | OK        | XSS patterns + SQLi patterns. Exempts content/notification_prefs |
| Request ID               | OK        | UUID per request, logged                                    |
| Timeout                  | OK        | 30s request timeout                                         |
| Auth                     | OK        | JWT via Bearer token, per-request client with RLS            |
| Metrics                  | OK        | Prometheus metrics at /metrics (behind auth)                |
| Error Handling           | OK        | AppError → structured. 500 → generic message. No stack leak |
| Sentry                   | OK        | Error tracking + PII redaction                               |
| Cache                    | PARTIAL   | responseCache on some GETs. No invalidation. No max size.   |
| Deprecation              | PARTIAL   | Middleware in place. No routes registered as deprecated.    |
| OpenAPI                  | PARTIAL   | Dynamic spec generation works. Static spec may be stale.    |

---

## Response Format Conventions (Documented vs Actual)

Per `lib/response.ts`:
- SUCCESS: `{ data: T }` (e.g., `{ data: { workspace: {...} } }`)
- ERROR: `{ error: { code: string, message: string, details?: unknown } }`
- Deprecated: `{ success: true/false, data/error: {...} }`

**Actual formats observed** (non-conformant):
- `{ ok: true }` — read receipts (P3-01)
- `{ success: true }` — workspace members, pins, flags, reactions, webhooks
- `{ messages: [...] }` — message search (no `data` wrapper)
- `{ channels: [...] }` — channel list (no `data` wrapper)
- `{ workspaces: [...] }` — workspace list (no `data` wrapper)
- `{ workspace: {...} }` — workspace get (no `data` wrapper)
- `{ status: {...} }` — status endpoints
- `{ flags: [...] }` — feature flags
- `{ thread: {...} }` — thread endpoints

**Compliant examples**:
- Few endpoints use `{ data: { ... } }` wrapping. The convention is documented but rarely followed.

---

## Quick-Win Fixes (Under 1 hour each)

1. **P0-02: Add `requireMessageAccess` to POST /messages/:id/remind** — 1 line change
2. **P0-09: Remove `email` from channel export select** — 1 line change
3. **P1-06: Add Zod validation to bookmark POST** — add 5-line Zod schema
4. **P1-08: Add Zod to scheduled posts POST** — reuse createMessageSchema
5. **P1-09: Add Zod to AI rewrite POST** — add 5-line Zod schema
6. **P1-14: Add max length check to presence batch POST** — 1 line
7. **P2-01: Remove duplicate `authenticate` on 3 reminder endpoints** — 3 lines
8. **P3-02: Add UUID validation to scheduled-posts, user-groups, trigger-words** — ~10 lines
9. **P3-04: Add workspace_id filter to GET /messages/flagged** — 5 lines
10. **P3-09: Add HTTPS enforcement to updateWebhookSchema.url** — 1 character

---

## Verification Commands

```bash
# Count all endpoints by method
rg -r '$1' --no-filename 'router\.(get|post|put|patch|delete)\(' apps/api/src/modules/ -g '*.ts' | sort | uniq -c

# Check for missing validateUuidParam
rg -l 'req\.params\.' apps/api/src/modules/ -g '*.ts' | xargs rg -L 'validateUuidParam'

# Check for inline authenticate when router already has it  
rg 'router\.use\(authenticate\)' apps/api/src/modules/ -g '*.ts' -l | xargs rg 'authenticate,' apps/api/src/modules/ -g '*.ts'

# Check for getSupabaseAdmin usages (admin client bypasses RLS)
rg 'getSupabaseAdmin\(\)' apps/api/src/modules/ -g '*.ts'
```
