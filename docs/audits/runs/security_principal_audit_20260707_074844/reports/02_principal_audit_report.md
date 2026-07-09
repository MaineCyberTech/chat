# Principal Audit Report

- Prompt: **security_principal_audit**
- Domain: **security**
- Run ID: **security_principal_audit_20260707_074844**
- Generated: **2026-07-07T23:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **3**
- P2: **4**, P3: **3**
- Readiness: **70.50**

## Findings

### P0 — Admin routes missing role authorization — any authenticated user can access all admin endpoints

- **File:** `apps/api/src/modules/admin/routes.ts`
- **Category:** authorization
- **Impact:** Any authenticated user can access GET /v1/admin/stats (system-wide analytics), GET /v1/admin/users (all users with email search — PII exposure), GET /v1/admin/channels (all channels across workspaces), GET /v1/admin/workspaces (all workspaces), GET /v1/admin/integrations (all webhook endpoints with masked secrets), GET /v1/admin/webhooks/deliveries, GET /v1/admin/webhooks/dead-letters, POST /v1/admin/webhooks/dead-letters/:id/retry, GET /v1/admin/export/compliance (full data export of all users, channels, messages, audit logs), and GET /v1/admin/system. No admin/owner role check exists at any level — only `authenticate` middleware is used per-route. This is a complete failure of tenant isolation and admin surface protection.
- **Fix:** Add an `requireAdminRole` middleware that checks `req.userId` against `workspace_members` with role 'admin' or 'owner', or checks a system-level admin flag. Apply this middleware to all admin routes in admin/routes.ts. Alternatively, gate admin access behind a SUPABASE_ADMIN_USER_IDS env variable or a dedicated admin_users table.

### P1 — Feature flags service uses admin client (bypasses RLS) and API routes have no role check

- **File:** `apps/api/src/lib/feature-flags.ts`
- **Category:** authorization
- **Impact:** The feature flag service layer uses `getSupabaseAdmin()` (service_role key) for all CRUD operations including reads (line 33), bypassing all Row-Level Security. The API routes at feature-flags/routes.ts (POST /v1/feature-flags, PATCH /v1/feature-flags/:key, DELETE /v1/feature-flags/:key) have no authorization beyond `authenticate`. Any authenticated user can create, modify, or delete feature flags, potentially disabling critical features or enabling unreleased functionality prematurely.
- **Fix:** Replace `getSupabaseAdmin()` with the user-scoped `req.supabase` client in route handlers. Add `requirePermission('manage_feature_flags')` or equivalent admin role check to POST/PATCH/DELETE routes. The feature flag evaluate endpoint should remain accessible.

### P1 — Webhook secret stored in plaintext in database column

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** secret_handling
- **Impact:** The webhook `secret` field is stored as plaintext in the `webhook_endpoints.secret` column (line 136: `secret: input.secret ?? ""`). If the database is compromised (SQL injection, backup exposure, Supabase admin panel access), all webhook secrets are immediately readable. These secrets are used for HMAC-SHA256 signing of webhook payloads, so exposure allows attackers to forge webhook requests that appear authentic to external services.
- **Fix:** Hash the webhook secret before storage using a key derivation function (e.g., bcrypt or argon2). Store only the hash. Remove the `secret` field from API responses entirely (currently masked as `${sec.slice(0,4)}...${sec.slice(-4)}`). For HMAC signing, use a server-side derived key instead of the raw secret.

### P1 — User groups API missing workspace membership verification

- **File:** `apps/api/src/modules/user-groups/routes.ts`
- **Category:** authorization
- **Impact:** User groups endpoints (GET /, POST /) allow any authenticated user to list or create groups in any workspace by passing a `workspace_id` query/body parameter. The PATCH/DELETE endpoints filter by `created_by` but still don't verify workspace membership. A user in one workspace could enumerate groups in another workspace by guessing workspace IDs, or create groups in workspaces they don't belong to.
- **Fix:** Add `requireWorkspaceMembership` middleware to all user group routes. For listing, validate `workspace_id` query param against user's memberships. For create/PATCH/DELETE, verify the group's workspace_id is one the user belongs to (and has admin role for mutations).

### P2 — Reactions batch endpoint skips message access control check

- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** authorization
- **Impact:** GET /v1/reactions/batch?message_ids=... (line 23) does not use `requireMessageAccess` middleware. While `requireMessageAccess` is applied to single-message reaction endpoints, the batch endpoint blindly fetches reactions for any message IDs provided. Combined with the RLS policy `reactions_select` which allows ANY authenticated user to read all reactions (`using (true)`), this enables enumeration of reactions on messages in private channels the user doesn't have access to.
- **Fix:** Add an access check to the batch endpoint. For each message_id, verify the user has access to the message's channel before returning reactions. Alternatively, require a workspace_id parameter and verify membership.

### P2 — Message forwarding does not verify target channel access

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** authorization
- **Impact:** POST /messages/:id/forward (line 271) checks access to the source message via `requireMessageAccess` but does not validate that the user has access to `targetChannelId`. A user could forward messages to channels they cannot read or write to, potentially exfiltrating data to restricted channels or causing notifications in spaces the user shouldn't interact with.
- **Fix:** Add a channel access check for `targetChannelId` before creating the forwarded message. Use `requireChannelAccess('targetChannelId')` or a manual check against workspace_members and channel_members tables.

### P2 — CORS configuration allows null-origin requests

- **File:** `apps/api/src/app.ts`
- **Category:** cors_csrf
- **Impact:** The CORS middleware at line 47 (`if (!origin) return callback(null, true)`) allows requests with no `Origin` header, which is typical of server-side scripts, curl, and non-browser HTTP clients. While not exploitable via browsers (which always send Origin), this means any server-side script can call the API without CORS restrictions if it omits the Origin header. Combined with the credentialless nature of server-side requests, this weakens the defense-in-depth posture.
- **Fix:** Remove the null-origin pass-through. Change the handler to return an error when origin is missing unless the method is GET/HEAD/OPTIONS. For server-side clients, require proper authentication which is already enforced via the Bearer token.

### P2 — Message upload endpoint has no channel or workspace validation

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** authorization
- **Impact:** POST /messages/upload (line 344) creates an upload URL and file path without any channel or workspace context. Any authenticated user can upload arbitrary files of any type (the SST policy on the storage bucket is the only guard). This could allow filling storage quotas, uploading malicious files, or bypassing content moderation.
- **Fix:** Require a `channel_id` or `workspace_id` parameter in the upload request. Verify the user has access to the channel/workspace before generating the upload URL. Apply file type restrictions on the server side before generating the signed URL.

### P3 — Consent GET endpoint queries all records without explicit user_id filter

- **File:** `apps/api/src/modules/consent/routes.ts`
- **Category:** logging_audit
- **Impact:** GET /v1/consent (line 9-20) queries `supabase.from("consent_logs").select("*")` without appending `.eq("user_id", req.userId)`. The RLS policy (`auth.uid() = user_id`) prevents actual data leakage, but the API code is misleading and could be broken if RLS policies are ever relaxed. Future maintainers might see this pattern and replicate it in other endpoints.
- **Fix:** Add an explicit `.eq("user_id", req.userId)` filter to the query. This makes the authorization intent clear at the code level and follows the principal of defense in depth.

### P3 — Webhook service uses getSupabase() (anon client) instead of user-authenticated client

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** authorization
- **Impact:** Multiple methods in webhook service (listByWorkspace, getById, create, update, remove) use `getSupabase()` which creates a client with no user session context (only anon key). When RLS policies check `auth.uid()`, they see null, potentially causing queries to return empty results or fail silently. This masks authorization failures and makes the service unreliable — a workspace member verified by middleware may get empty results from the service.
- **Fix:** Refactor service methods to accept and use the user-authenticated Supabase client (`SupabaseClient`) passed from the route handler via `req.supabase`, consistent with how channelService and messageService handle it.

### P3 — Channel delete and member management missing admin role check

- **File:** `apps/api/src/modules/channels/routes.ts`
- **Category:** authorization
- **Impact:** DELETE /channels/:id (line 111), POST /channels/:id/members (line 141), DELETE /channels/:id/members/:userId (line 335) only use `requireChannelAccess` middleware which checks workspace membership + private channel membership but does not verify admin/owner role. Any workspace member can delete channels or manage channel membership, even without administrative privileges.
- **Fix:** Add an admin role check (e.g., `requirePermission('manage_channels')` or a custom middleware checking `workspaceRole` for 'admin' or 'owner') to channel delete and member management endpoints.
