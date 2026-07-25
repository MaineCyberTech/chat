# Final Comprehensive Security Audit — July 24, 2026

**Scope**: `C:\temp\chat` — full codebase  
**Verdict**: **P0=4, P1=8, P2=10, P3=8 — 30 total findings**

---

## P0 — Critical (4)

### P0-01: Workspace delete allows any member (no admin check)

- **File**: `apps/api/src/modules/workspaces/routes.ts:270-287`
- **Current**: `requireWorkspaceMembership("id")` applied — any member can delete the entire workspace, including all channels, messages, and data.
- **Fix**: Add `requireAdmin` middleware before the handler, or add a workspace role check (owner only).
- **Impact**: Any workspace member can permanently destroy a workspace and all its data. No audit trail would prevent this.

### P0-02: Channel delete allows any member (no admin check)

- **File**: `apps/api/src/modules/channels/routes.ts:139-156`
- **Current**: `requireChannelAccess("id")` only verifies the user can access the channel, not that they have delete rights. Any workspace member can delete any public channel.
- **Fix**: Add a role check — channel delete should require workspace admin/owner OR the channel creator.
- **Impact**: Any workspace member can delete any public channel and all its messages. There is no permission check beyond basic access.

### P0-03: OpenAPI spec and changelog endpoints expose full API structure without auth

- **File**: `apps/api/src/modules/openapi/routes.ts:77-83`
- **Current**: `GET /v1/openapi.json` and `GET /v1/changelog` have **no authenticate middleware**, **no rate limit**, and **no admin check**. They dynamically enumerate ALL routes including admin endpoints from `routeRegistry`, exposing internal API topology.
- **Fix**: At minimum, add `authenticate` middleware. Consider admin-only access.
- **Impact**: Full API route enumeration including admin-only paths, parameter names, and method signatures is exposed anonymously. Aids reconnaissance for attackers.

### P0-04: `getSupabase()` (anon client) used extensively in service layer — RLS bypass vector

- **Files**:
  - `apps/api/src/modules/channels/service.ts:56, 154, 189, 222, 384, 395, 412`
  - `apps/api/src/modules/webhooks/service.ts:102, 112, 122, 143, 168, 180, 186, 389`
  - `apps/api/src/modules/status/routes.ts:44, 61, 87, 102, 128, 165, 194`
  - `apps/api/src/modules/notifications/routes.ts:50, 66, 96, 130, 144, 161, 184, 205`
  - `apps/api/src/modules/announcements/routes.ts:21, 49, 74`
- **Current**: Many service methods and route handlers call `getSupabase()` (anon client with `SUPABASE_ANON_KEY`) instead of `req.supabase` (per-user JWT client). The anon client has **no user context** — `auth.uid()` resolves to NULL for these queries. If any of these tables have `BYPASSRLS`, the query succeeds with no tenant isolation. Even without BYPASSRLS, future migration/policy changes could inadvertently create gaps.
- **Fix**: Audit all `getSupabase()` call sites. Replace with `req.supabase` where user context is needed, or `getSupabaseAdmin()` where admin operations are intentional (and ensure proper authorization checks precede them). The `addMember()`, `removeMember()`, `reorderChannel()`, and `listWorkspaceChannelIds()` methods in `channel/service.ts` should accept a `supabase` parameter like `create()` does.
- **Impact**: Cross-tenant data access possible if RLS policies are ever relaxed or BYPASSRLS is set. Even today, several operations pass authorization checks via routes but then execute database operations without user context.

---

## P1 — High (8)

### P1-01: LiveKit status endpoint exposes internal host with no auth

- **File**: `apps/api/src/modules/livekit/routes.ts:44-49`
- **Current**: `GET /v1/livekit/status` has **no authenticate middleware**. Returns `{ configured: true/false, host: "..." }` — exposes internal LiveKit server hostname.
- **Fix**: Add `authenticate` middleware, or at minimum restrict to admin role.
- **Severity**: P1

### P1-02: Web CSP — `'unsafe-inline'` on scripts and styles

- **File**: `apps/web/middleware.ts:6-7`
- **Current**: `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline'` allow inline `<script>` and `<style>` tags, enabling XSS if an attacker injects HTML.
- **Fix**: Remove `'unsafe-inline'` for script-src. For style-src, use nonces or hashes for any legitimately needed inline styles. If TipTap/Next.js requires style nonces, implement a CSP nonce strategy via `NextResponse.next()` headers.
- **Severity**: P1

### P1-03: Web `connect-src` overly permissive — `https:` and `ws:` (no domain restriction)

- **File**: `apps/web/middleware.ts:10`
- **Current**: `connect-src 'self' https: ws: wss:` allows WebSocket/fetch connections to ANY HTTPS/WS/WSS endpoint, enabling exfiltration to arbitrary third-party servers via XSS.
- **Fix**: Restrict to `'self' https://*.supabase.co wss://*.supabase.co` (matching the API server CSP at `security-headers.ts:9`).
- **Severity**: P1

### P1-04: Missing RLS INSERT policy for `channel_members` table

- **File**: `supabase/policies/03_channels.sql` — only SELECT policy for `channel_members`
- **Current**: `channel_members` has `channel_members_select_member` (SELECT only). No INSERT, UPDATE, or DELETE policies exist. The `channelService.addMember()` uses `getSupabase()` (anon, no user context). With RLS enabled and no INSERT policy, this should be DENY ALL, but `getSupabaseAdmin()` calls (in `channelService.getMembers()` at line 222) would bypass RLS entirely.
- **Fix**: Add INSERT policy for `channel_members` requiring workspace membership, and ensure all insert operations use the per-user client.
- **Severity**: P1

### P1-05: Missing RLS UPDATE/DELETE policies for `channel_bookmarks`

- **File**: `supabase/migrations/20260704000001_add_dm_presence_categories.sql` (where bookmarks are created) — no dedicated RLS policies
- **Current**: No RLS policy file exists for `channel_bookmarks`. If RLS is enabled on this table, all authenticated user operations would be DENY ALL (correct default). But the channel routes at `channels/routes.ts:302-371` use `req.supabase` which should work through RLS — but only if policies exist.
- **Fix**: Add RLS policies for `channel_bookmarks` (SELECT/INSERT/UPDATE/DELETE) scoped to workspace membership via the channel_id. Add a dedicated policy file `supabase/policies/12_channel_bookmarks.sql`.
- **Severity**: P1

### P1-06: Test accounts page exposed in production — all 21 test emails + shared password

- **File**: `apps/web/app/test-accounts/page.tsx:179`
- **Current**: The `/test-accounts` page contains ALL 21 seed user emails, display names, roles, and workspaces, with the hardcoded password `password123`. There is NO environment-gating — this page is accessible in production at `chat.mainecybertech.com/test-accounts` and allows one-click sign-in to any test account.
- **Fix**: Add environment gate — only render in development (`process.env.NODE_ENV !== "production"`), or add a secret query parameter. For production, this page must be completely inaccessible.
- **Severity**: P1

### P1-07: Notification routes use `getSupabase()` (anon client) instead of `req.supabase`

- **File**: `apps/api/src/modules/notifications/routes.ts:50, 66, 96, 130, 144, 161, 184, 205`
- **Current**: Multiple notification preference and trigger-word endpoints call `getSupabase()` (anon) directly. While RLS policies exist for `notifications`, `trigger_words`, and `channel_notification_preferences`, the anon client has no `auth.uid()` context. These operations would fail with strict RLS — but if any of these tables lack RLS or have BYPASSRLS, isolation fails.
- **Fix**: Replace `getSupabase()` with `req.supabase` throughout the file. All authenticated route handlers should use the per-user client.
- **Severity**: P1

### P1-08: Status and auto-responder routes use `getSupabase()` (anon client)

- **File**: `apps/api/src/modules/status/routes.ts:44, 61, 87, 102, 128, 165, 194`
- **Current**: Every handler in this file calls `getSupabase()` instead of `req.supabase`. Tables affected: `user_statuses`, `user_presence`, `auto_responders`.
- **Fix**: Replace all `getSupabase()` calls with `req.supabase` to ensure per-user RLS context.
- **Severity**: P1

---

## P2 — Medium (10)

### P2-01: Feature flags GET endpoint not guarded by admin role

- **File**: `apps/api/src/modules/feature-flags/routes.ts:41-58`
- **Current**: `GET /v1/feature-flags` and `GET /v1/feature-flags/:key` are protected only by `authenticate` (applied at router level). Any authenticated user can enumerate all feature flags including their rollout configuration, target user IDs, and target roles.
- **Fix**: Add `requireAdmin()` middleware to GET routes, or create a separate public endpoint that only returns enabled/disabled state without configuration details.
- **Severity**: P2

### P2-02: CORS allows non-GET/HEAD/OPTIONS requests without origin header for same-origin requests — potential bypass

- **File**: `apps/api/src/app.ts:66-78`
- **Current**: The CORS `origin` callback checks `if (!origin)` and returns `callback(null, true)` for GET/HEAD/OPTIONS only. For POST/PATCH/DELETE without an origin header (which shouldn't happen from browsers), it returns an error. However, same-origin requests (where origin matches `frontendUrl`) are allowed — but this check **does not verify SameSite or CSRF token presence** at the CORS layer (CSRF is handled separately by the `doubleSubmitCookieCsrf` middleware). The concern is that the origin check is string equality with `frontendUrl` — if `frontendUrl` contains a trailing slash or is misconfigured, this could be bypassed.
- **Fix**: Use `new URL(origin).origin === new URL(frontendUrl).origin` for origin comparison, or normalize both values.
- **Severity**: P2

### P2-03: Auth rate limiter applied at router level but not idempotent-key bypass aware

- **File**: `apps/api/src/modules/auth/routes.ts:22` — `router.use(authLimiter)` applies to all auth routes
- **Current**: The `authLimiter` (10 req/min) is applied to the entire auth router, including the `/magic-link` endpoint which gets an additional `magicLinkLimiter` (3 req/min). However, the `/session`, `/profile`, `/online`, `/search`, `/avatar`, and `/status` endpoints share the same 10/min bucket. The `/search` endpoint has an additional `searchLimiter`, but all others compete for the same auth limiter quota.
- **Fix**: Move specific rate limiters (e.g., `authLimiter`) to only the `/magic-link` route, or apply different rate limit profiles per endpoint.
- **Severity**: P2

### P2-04: GDPR export returns ALL user data in one unencrypted JSON response

- **File**: `apps/api/src/modules/auth/routes.ts:218-297`
- **Current**: The `/v1/auth/export` endpoint fetches data from 21 tables in parallel and sends as a single JSON file. No compression, no encryption at rest (transit is HTTPS), no pagination. For users with large message histories, this could be hundreds of MB and cause OOM on the API server.
- **Fix**: Add streaming/chunked response, compression (gzip), or offload to an async job with a download link.
- **Severity**: P2

### P2-05: GDPR delete is NOT atomic — API-level deletion after RPC failure leaves auth user orphaned

- **File**: `apps/api/src/modules/auth/routes.ts:301-331`
- **Current**: The RPC `gdpr_delete_user` is called first. On success, `supabase.auth.admin.deleteUser(userId)` is called. If the RPC succeeds but `admin.deleteUser` fails, the data is deleted but the auth user remains orphaned. Conversely, if the RPC fails, the auth user is NOT deleted (correct behavior since the handler returns early on RPC error). However, if the RPC partially succeeds (some DELETEs work, then an error occurs), the exception handler returns a failure JSON, but some data may already be deleted.
- **Fix**: Wrap RPC in a transaction if using `SECURITY DEFINER`. Alternatively, implement a soft-delete approach with a scheduled cleanup job that checks for orphaned auth users.
- **Severity**: P2

### P2-06: Redundant workspace membership check in DM channel listing

- **File**: `apps/api/src/modules/channels/routes.ts:248-255`
- **Current**: `GET /dm-channels` has only `responseCache(30)`. While `channelService.listDmChannels()` filters by user via `dm_members` table, there is NO explicit workspace membership check for the channels returned. A user could potentially see DM channels from workspaces they've been removed from, if `dm_members` still references them.
- **Fix**: Add workspace membership verification for each returned DM channel's workspace.
- **Severity**: P2

### P2-07: Announcements routes use `getSupabase()` (anon client) for database operations

- **File**: `apps/api/src/modules/announcements/routes.ts:21, 49, 74`
- **Current**: All three endpoints call `getSupabase()` for Supabase operations. The `POST` endpoint requires `requireWorkspaceRole("admin")` but then executes the INSERT with the anon client.
- **Fix**: Replace `getSupabase()` with `req.supabase`.
- **Severity**: P2

### P2-08: Redis connections in idempotency and admin health check lack TLS

- **File**: `apps/api/src/lib/idempotency.ts:12` and `apps/api/src/modules/admin/routes.ts:190`
- **Current**: All Redis connections use `REDIS_URL` directly without TLS configuration. In production, if Redis is accessed via a secure endpoint, this connection would be unencrypted. The `admin/routes.ts:223` creates a SECOND Redis connection for queue monitoring.
- **Fix**: Add `tls: {}` option when `REDIS_URL` starts with `rediss://`, or always enable TLS in production.
- **Severity**: P2

### P2-09: Socket auth timeout is 10 seconds — DoS vector

- **File**: `apps/api/src/lib/socket.ts:96-99`
- **Current**: Socket connections get a 10-second auth timeout. An attacker can open thousands of connections (each consuming a file descriptor and memory for 10s) before being disconnected. The rate limiter (10 connections/second/IP) helps but doesn't prevent sustained attacks from multiple IPs.
- **Fix**: Reduce auth timeout to 5 seconds. Consider adding a connection rate limit that tracks total concurrent unauthenticated sockets.
- **Severity**: P2

### P2-10: Helmet `crossOriginResourcePolicy: false` disables CORP protection

- **File**: `apps/api/src/app.ts:80`
- **Current**: `helmet({ crossOriginResourcePolicy: false })` explicitly disables Cross-Origin-Resource-Policy. This was likely done to allow image/asset loading from cross-origin sources, but it weakens the API server's side-channel protection.
- **Fix**: Set to `same-origin` for the API server (which doesn't serve user-facing assets). The frontend proxies via Caddy, so the API server itself can use strict CORP. Alternatively, configure `crossOriginResourcePolicy: { policy: "same-origin" }` and add exceptions for specific routes.
- **Severity**: P2

---

## P3 — Low (8)

### P3-01: Input sanitizer SQL injection patterns are regex-based and can be bypassed

- **File**: `apps/api/src/middleware/input-sanitizer.ts:17-21`
- **Current**: SQL injection detection uses regex patterns. While useful as a first line of defense, regex-based SQLi detection is well-known to be bypassable (e.g., using encoding, comments, or alternative SQL dialects). The patterns also produce false positives for legitimate text containing SQL keywords (e.g., "select" in a message).
- **Fix**: This is defense-in-depth. The primary defense should be parameterized queries (which Supabase SDK already provides). Consider narrowing the regex to only catch the most obvious patterns and log them as warnings rather than blocking requests.
- **Severity**: P3

### P3-02: Password hash visible in test-accounts page source (production)

- **File**: `apps/web/app/test-accounts/page.tsx:179, 222`
- **Current**: The page displays `password123` as plaintext in the UI description and passes it directly to `signInWithPassword()`. Related to P1-06.
- **Fix**: Same as P1-06 — gate page to development only.
- **Severity**: P3

### P3-03: Error handler buffer stores IP addresses in plaintext

- **File**: `apps/api/src/middleware/error-handler.ts:20-28`
- **Current**: `pushError()` sends error data to the error buffer (accessible at `GET /v1/admin/logs`). While the `error-handler.ts` itself doesn't explicitly include IP, the `pushError` call passes `requestId` and `path`. The admin logs endpoint (`admin/routes.ts:410-420`) returns these to authenticated admins.
- **Fix**: Consider masking IP addresses in the error buffer or adding a retention policy for error logs.
- **Severity**: P3

### P3-04: Webhook service stores response body in plaintext in DB

- **File**: `apps/api/src/modules/webhooks/service.ts:314-328`
- **Current**: The full `responseBody` from webhook deliveries is stored in the `webhook_deliveries` table. If the webhook recipient returns sensitive data, it's persisted indefinitely in the database.
- **Fix**: Truncate response body to a maximum size (e.g., 10KB) for storage, or offer a configurable retention policy.
- **Severity**: P3

### P3-05: Missing Content-Length check on message content upload route

- **File**: `apps/api/src/modules/messages/routes.ts:474-503`
- **Current**: `POST /messages/upload` has no body size limit beyond Express's global 1MB limit. The route handler creates signed upload URLs — it doesn't actually receive file content, so this is lower risk. However, there's no validation on `fileName` length beyond the santizer regex.
- **Fix**: Add a max length check on `fileName` in the Zod schema (should already exist in `uploadRequestSchema`).
- **Severity**: P3

### P3-06: `console.log` fallback in environment configuration logging

- **File**: `apps/api/src/config/env.ts:35`
- **Current**: `logEnvStatus()` falls back to `console.log` if the logger isn't initialized. Environment variable names are logged (not values), but if the logger is broken, critical errors will be silently output to stdout without structured logging.
- **Fix**: This is acceptable as a bootstrap fallback, but document that it doesn't go through the structured logging pipeline.
- **Severity**: P3

### P3-07: In-memory idempotency key fallback — lost on process restart

- **File**: `apps/api/src/lib/idempotency.ts:34`
- **Current**: When Redis is unavailable, idempotency keys are stored in a `Map` that's lost on restart. While the TTL is 24 hours, an API restart during that window would clear all in-memory keys. Duplicate message creation would be possible.
- **Fix**: Document this limitation. Consider using a database table as a tertiary fallback vs. in-memory Map.
- **Severity**: P3

### P3-08: `dm-channels` and `flagged` routes return other users' data without per-channel access verification

- **File**: `apps/api/src/modules/channels/routes.ts:248-255` and `apps/api/src/modules/messages/routes.ts:346-360`
- **Current**: `GET /dm-channels` uses `responseCache(30)` and lists the user's DM channels with other members' display names and avatars. `GET /messages/flagged` returns flagged messages across all workspaces. Neither verifies workspace membership per channel.
- **Fix**: Add workspace-level access verification for each returned channel. For flagged messages, add channel workspace checks.
- **Severity**: P3

---

## RLS Policy Audit Summary

| Table                        | SELECT       | INSERT      | UPDATE      | DELETE      | Notes                             |
| ---------------------------- | ------------ | ----------- | ----------- | ----------- | --------------------------------- |
| `users`                      | ✅ Own       | ✅ Own      | ✅ Own      | ❌ None     | No DELETE policy                  |
| `workspaces`                 | ✅ Member    | ❌ None     | ❌ None     | ❌ None     | No INSERT/UPDATE/DELETE policies  |
| `workspace_members`          | ✅ Member    | ❌ None     | ❌ None     | ❌ None     | No CUD policies                   |
| `channels`                   | ✅ Member    | ✅ Member   | ❌ None     | ❌ None     | No UPDATE/DELETE policies         |
| `channel_members`            | ✅ Member    | ❌ **NONE** | ❌ None     | ❌ None     | No CUD policies — **P1 gap**      |
| `messages`                   | ✅ Member    | ✅ Own      | ✅ Own      | ✅ Own      | Complete                          |
| `user_preferences`           | ✅ Own       | ✅ Own      | ✅ Own      | ❌ None     | No DELETE policy                  |
| `reactions`                  | ✅ Via ch    | ✅ Own      | ❌ None     | ✅ Own      | No UPDATE policy                  |
| `push_subscriptions`         | ✅ Own       | ✅ Own      | ✅ Own      | ✅ Own      | Complete                          |
| `notifications`              | ✅ Own       | ❌ None     | ✅ Own      | ❌ None     | No INSERT/DELETE                  |
| `webhook_endpoints`          | ✅ Member    | ✅ Admin    | ✅ Admin    | ✅ Admin    | Admin for CUD only                |
| `webhook_deliveries`         | ✅ Member    | ❌ None     | ❌ None     | ❌ None     | No CUD policies                   |
| `webhook_dead_letters`       | ✅ Member    | ❌ None     | ❌ None     | ❌ None     | No CUD policies                   |
| `audit_logs`                 | ✅ Own/Admin | ✅ Auth     | ❌ None     | ❌ None     | No UPDATE/DELETE                  |
| `feature_flags`              | ✅ Admin     | ✅ Admin    | ✅ Admin    | ✅ Admin    | Admin-only correctly              |
| `channel_bookmarks`          | ❌ **NONE**  | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | **No policies at all — P1 gap**   |
| `channel_notification_prefs` | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `trigger_words`              | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `auto_responders`            | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `user_statuses`              | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `user_presence`              | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `user_groups`                | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `sidebar_categories`         | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `scheduled_posts`            | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `announcements`              | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `consent_logs`               | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `compliance_exports`         | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies — served via API only |
| `dm_members`                 | ❌ None      | ❌ None     | ❌ None     | ❌ None     | No policies                       |

**Key**: ✅ = policy exists, ❌ = no policy. "Own" = scoped to `auth.uid() = user_id`. "Member" = scoped to workspace membership. "Admin" = role-checked.

**Critical observation**: 18+ tables lack RLS CUD policies entirely. This is acceptable **only if** ALL write operations go through the API server's per-user client (`req.supabase`) where the API enforces authorization, AND those write operations never use `getSupabase()` (anon) or `getSupabaseAdmin()` (bypasses RLS). Currently, this is violated in multiple places (see P0-04, P1-07, P1-08, P2-07).

---

## Middleware Application Audit

Route-by-route verification of all middleware:

| Route Group                |   authenticate   | Rate Limit  | CSRF | Input Sanitize | Membership Check  |      Role Check      |
| -------------------------- | :--------------: | :---------: | :--: | :------------: | :---------------: | :------------------: |
| `/healthz`                 | ❌ (intentional) |     ❌      |  ❌  |       ❌       |        ❌         |          ❌          |
| `/health`                  | ❌ (intentional) |     ❌      |  ❌  |       ❌       |        ❌         |          ❌          |
| `/metrics`                 |        ✅        |     ❌      |  ❌  |       ✅       |        ❌         |          ❌          |
| `/v1/auth/magic-link`      |        ✅        |   ✅ (2x)   |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/auth/session`         |        ✅        | ✅ (shared) |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/auth/profile`         |        ✅        | ✅ (shared) |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/auth/export`          |        ✅        |  ✅ (gdpr)  |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/auth/account`         |        ✅        |     ❌      |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/workspaces/*`         |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   | ✅ (members routes)  |
| `/v1/channels/*`           |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   | ❌ (delete missing!) |
| `/v1/messages/*`           |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   |          ❌          |
| `/v1/webhooks/*`           |        ✅        |     ❌      |  ✅  |       ✅       |    ✅ (inline)    |          ❌          |
| `/v1/notifications/*`      |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   |          ❌          |
| `/v1/preferences/*`        |        ✅        |     ❌      |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/reactions/*`          |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   |          ❌          |
| `/v1/feature-flags/*`      |        ✅        |     ❌      |  ✅  |       ✅       |        ❌         |    ✅ (CUD only)     |
| `/v1/consent`              |        ✅        |     ❌      |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/threads/*`            |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   |          ❌          |
| `/v1/livekit/status`       |    ❌ **GAP**    |     ❌      |  ❌  |       ✅       |        ❌         |          ❌          |
| `/v1/livekit/token`        |        ✅        |     ❌      |  ✅  |       ✅       |    ✅ (inline)    |          ❌          |
| `/v1/audit/*`              |        ✅        |     ❌      |  ✅  |       ✅       |    ✅ (inline)    |          ❌          |
| `/v1/groups/*`             |        ✅        |     ❌      |  ✅  |       ✅       |    ✅ (inline)    |          ❌          |
| `/v1/sidebar-categories/*` |        ✅        |     ❌      |  ✅  |       ✅       |    ✅ (inline)    |          ❌          |
| `/v1/scheduled-posts/*`    |        ✅        |     ❌      |  ✅  |       ✅       |    ✅ (inline)    |          ❌          |
| `/v1/admin/*`              |        ✅        |     ❌      |  ✅  |       ✅       | ✅ (inline admin) |   ✅ (all routes)    |
| `/v1/admin/export/*`       |        ✅        |     ❌      |  ✅  |       ✅       | ✅ (requireAdmin) |          ✅          |
| `/v1/admin/import/*`       |        ✅        |     ❌      |  ✅  |       ✅       | ✅ (requireAdmin) |          ✅          |
| `/v1/openapi.json`         |    ❌ **GAP**    |     ❌      |  ❌  |       ✅       |        ❌         |          ❌          |
| `/v1/changelog`            |    ❌ **GAP**    |     ❌      |  ❌  |       ✅       |        ❌         |          ❌          |
| `/v1/ai/rewrite`           |        ✅        |     ❌      |  ✅  |       ✅       |        ❌         |          ❌          |
| `/v1/announcements/*`      |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   |    ✅ (POST only)    |
| `/v1/emoji/*`              |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   |          ❌          |
| `/v1/read-receipts/*`      |        ✅        |     ❌      |  ✅  |       ✅       |  ✅ (per-route)   |          ❌          |

**Rate limiting gaps**: Many routes lack dedicated rate limiters. The global `apiLimiter` (100 req/min) applies to all routes, but specific high-risk endpoints (admin, export, GDPR delete, webhook management) have no throttling beyond the global limit.

---

## CSRF Protection

- **Double-submit cookie pattern** implemented in `middleware/csrf.ts` via `doubleSubmitCookieCsrf` — applied globally at `app.ts`.
- Origin/referer header check as defense-in-depth for non-safe methods.
- Token set in cookie on GET requests, verified on POST/PATCH/DELETE.
- **Gap**: The CSRF cookie is `httpOnly: false` (required for JS to read it), `secure: process.env.NODE_ENV === "production"`, `sameSite: "lax"`. In development, the cookie is NOT marked Secure, allowing it over HTTP.
- **Status**: Adequate for production. **P3**: Consider `sameSite: "strict"` for the CSRF cookie in production.

---

## CORS Configuration

- **API server** (`app.ts:65-78`): Tight — only `frontendUrl` origin, credentials enabled, restricted methods and headers.
- **Socket.io** (`socket.ts:34-42`): Uses same `frontendUrl` for origin check. Allows origin-less connections.
- **Status**: Acceptable. No open CORS wildcards.

---

## CSP Configuration

- **API server** (`security-headers.ts:3-14`): Strict — `default-src 'self'`, no `unsafe-inline`. Appropriate for an API server.
- **Web app** (`middleware.ts:4-17`): **Too permissive** — `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `connect-src 'self' https: ws: wss:` (open to any HTTPS/WS host). See P1-02, P1-03.

---

## Input Validation Audit

| Route Group         | Zod Schema              | Additional Checks                   | Notes                                     |
| ------------------- | ----------------------- | ----------------------------------- | ----------------------------------------- |
| Auth magic-link     | `emailSchema`           | —                                   | ✅                                        |
| Workspace create    | `createWorkspaceSchema` | Idempotency key                     | ✅                                        |
| Workspace update    | `updateWorkspaceSchema` | UUID validation                     | ✅                                        |
| Channel create      | `createChannelSchema`   | UUID validation + membership        | ✅                                        |
| Channel update      | `updateChannelSchema`   | UUID validation + membership        | ✅                                        |
| Message create      | `createMessageSchema`   | DOMPurify sanitization, idempotency | ✅ Content sanitized AFTER Zod validation |
| Message update      | `updateMessageSchema`   | DOMPurify sanitization              | ✅                                        |
| Message search      | `searchQuerySchema`     | HTML tag stripping, 200 char limit  | ✅                                        |
| Webhook create      | `createWebhookSchema`   | SSRF validation (DNS + IP check)    | ✅                                        |
| Webhook update      | `updateWebhookSchema`   | SSRF validation if URL changed      | ✅                                        |
| Status create       | — (manual check)        | Max 100 chars                       | ⚠️ No Zod schema, manual type assertion   |
| Feature flags       | `createFlagSchema`      | Regex on key                        | ✅                                        |
| Consent             | — (manual check)        | Enum check on consent_type          | ⚠️ No Zod schema                          |
| Trigger words       | — (manual check)        | Max 100 chars, trim                 | ⚠️ No Zod schema                          |
| Auto-responder      | — (manual check)        | workspace_id existence              | ⚠️ No Zod schema                          |
| Notifications prefs | — (manual check)        | Boolean casting                     | ⚠️ No Zod schema                          |

---

## GDPR Compliance

### Export (`GET /v1/auth/export`)

- ✅ Requires authentication
- ✅ Uses `gdprExportLimiter` (5/hour)
- ✅ Uses `getSupabaseAdmin()` to bypass RLS (appropriate for full data export)
- ✅ Covers 21 data tables comprehensively
- ⚠️ No compression — could be very large
- ⚠️ No async processing — blocks API thread

### Delete (`DELETE /v1/auth/account`)

- ✅ Requires authentication
- ✅ RPC function `gdpr_delete_user` with `SECURITY DEFINER`
- ✅ search_path explicitly set to `public, auth`
- ✅ Deletes from 22+ tables in correct order (children first)
- ✅ Exception handler returns structured JSON error
- ⚠️ NOT transactional — individual DELETEs could partially succeed
- ⚠️ No rate limiter on delete endpoint (only global 100/min)
- ✅ Auth user deletion happens after data deletion

### Consent Tracking

- ✅ Consent logs table with user-scoped RLS (via API)
- ✅ IP address masking function
- ✅ User agent captured
- ✅ Enum validation on consent_type

---

## Secrets and Hardcoded Credentials

| Location                                      | Finding                            | Severity |
| --------------------------------------------- | ---------------------------------- | -------- |
| `apps/web/app/test-accounts/page.tsx:179`     | Password `password123` in source   | P3       |
| `apps/web/app/test-accounts/page.tsx:10-155`  | 21 test emails exposed             | P1       |
| `apps/api/src/lib/sentry.ts:31-32`            | Email/ID redacted in events ✅     | OK       |
| `apps/api/src/middleware/error-handler.ts:34` | Stack traces gated by env var ✅   | OK       |
| `apps/api/src/config/env.ts:29-31`            | Secret key detection in env log ✅ | OK       |

No production secrets found hardcoded in source code. The test-accounts page is the only credential exposure and must be gated to development.

---

## Docker Compose Security

### `docker-compose.prod.yml`

- ✅ Redis uses `--appendonly yes` for persistence
- ✅ Caddy has read-only cert mount (`:ro`)
- ✅ Healthchecks on all services
- ✅ Memory limits on all containers
- ⚠️ `livekit` ports 7880-7892 exposed to host (required for WebRTC, but ensure firewall rules)
- ⚠️ `LIVEKIT_KEYS` environment variable visible in `docker inspect`
- ⚠️ No `user: nobody` or non-root user configuration
- ⚠️ No read-only root filesystem (`read_only: true`)

---

## Summary and Risk Matrix

| Category           | P0    | P1    | P2     | P3    | Total  |
| ------------------ | ----- | ----- | ------ | ----- | ------ |
| Auth / Access Ctrl | 2     | 2     | 3      | 1     | 8      |
| RLS Policies       | 0     | 2     | 0      | 0     | 2      |
| CSP / CORS         | 0     | 2     | 1      | 0     | 3      |
| CSRF               | 0     | 0     | 0      | 1     | 1      |
| Input Validation   | 0     | 0     | 0      | 1     | 1      |
| Secrets / Exposure | 0     | 1     | 1      | 1     | 3      |
| GDPR / Privacy     | 0     | 0     | 2      | 0     | 2      |
| Infrastructure     | 0     | 0     | 2      | 1     | 3      |
| Rate Limiting      | 0     | 0     | 1      | 0     | 1      |
| Data Safety        | 1     | 0     | 0      | 1     | 2      |
| API Exposure       | 1     | 1     | 0      | 1     | 3      |
| Service Layer      | 1     | 1     | 0      | 1     | 3      |
| **Total**          | **4** | **8** | **10** | **8** | **30** |

---

## Immediate Action Items (Top 5)

1. **Fix workspace delete authorization** (`workspaces/routes.ts:270`) — add owner-only check
2. **Fix channel delete authorization** (`channels/routes.ts:139`) — add admin/creator check
3. **Gate test-accounts page to development** — environment check or remove from production
4. **Audit and replace all `getSupabase()` calls** in route handlers and services with `req.supabase`
5. **Remove `'unsafe-inline'` from web app CSP** and restrict `connect-src`
