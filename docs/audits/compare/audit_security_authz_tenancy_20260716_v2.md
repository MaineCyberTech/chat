# Security/AuthZ/Tenancy Delta Audit Report (v2)

**Original Audit**: `audit_security_authz_tenancy_20260716.md` (July 16, 2026)
**Re-Audit Date**: July 24, 2026
**Scope**: Source-level verification of all P1/P2 fix claims + identification of remaining/new findings
**Methodology**: Read every referenced source file at the current commit. Compare against original finding descriptions.

---

## Part 1: CONFIRMED FIXED

Each item below was verified by reading the actual source file at the stated line numbers.

### P1 Fixes — Verified

| ID          | Finding                                        | Fix Verified At                                         | Evidence                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-001** | Feature flags lack RBAC middleware             | `apps/api/src/modules/feature-flags/routes.ts:60-107`   | `requireAdmin` middleware added to POST (line 62), PATCH (line 80), DELETE (line 98). Only GET and evaluate remain admin-unrestricted — acceptable (read-only).                                                                                                                                                                                                               |
| **SEC-002** | Scheduled posts lack channel/membership checks | `apps/api/src/modules/scheduled-posts/routes.ts:35-107` | GET requires `workspace_id` query param + `requireWorkspaceMember()` (lines 39-43). POST calls `getChannelWorkspaceId()` then `requireWorkspaceMember()` (lines 65-66). DELETE fetches post, checks `post.user_id !== req.userId`, resolves workspace via channel, then verifies membership (lines 87-99). All three endpoints now have complete cross-tenant access control. |

### P2 Fixes — Verified

| ID                                | Finding                                      | Fix Verified At                                      | Evidence                                                                                                                                                                                                                                                                                                            |
| --------------------------------- | -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reactions RLS**                 | SELECT policy allowed any authenticated user | `supabase/policies/06_reactions.sql:5-16`            | `reactions_select` policy now requires `message_id` belongs to a channel where the user is a `channel_member`. Previously the migration version (`20260626000022_apply_rls_policies.sql:82`) was scoped only to message existence.                                                                                  |
| **Emoji GET/POST**                | Workspace-scoped via `workspaceId` param     | `apps/api/src/modules/emoji/routes.ts:9-18, 21-43`   | GET `/:workspaceId/emoji` and POST `/:workspaceId/emoji` both filter by `workspace_id` param.                                                                                                                                                                                                                       |
| **GDPR export expanded**          | Now covers 20 user-data tables               | `apps/api/src/modules/auth/routes.ts:225-267`        | Export includes: users, workspace_members, messages, notifications, preferences, push_subscriptions, reactions, consent_logs, channel_memberships, bookmarks, message_flags, edit_history, scheduled_posts, reminders, statuses, presence, trigger_words, auto_responders, sidebar_categories, sidebar_assignments. |
| **Webhooks individual endpoints** | Check workspace membership                   | `apps/api/src/modules/webhooks/routes.ts:145-258`    | GET `/:id` (line 153), PATCH `/:id` (line 212), DELETE `/:id` (line 249) all call `requireWorkspaceAccess(webhook.workspace_id, req)`.                                                                                                                                                                              |
| **Consent duplicate route**       | `/consent/log` route removed                 | `apps/api/src/modules/consent/routes.ts`             | Only GET `/consent` (line 9) and POST `/consent` (line 27) remain — no separate `/log` endpoint.                                                                                                                                                                                                                    |
| **User-groups DELETE**            | Now checks workspace membership              | `apps/api/src/modules/user-groups/routes.ts:110-143` | DELETE fetches group's `workspace_id` (lines 114-118), verifies `workspace_members` membership (lines 120-131) before allowing deletion.                                                                                                                                                                            |
| **User-groups GET/POST**          | Check workspace membership                   | `apps/api/src/modules/user-groups/routes.ts:10-85`   | GET (lines 17-28) and POST (lines 50-62) both call `workspace_members.select` with `workspace_id` and `user_id` before proceeding.                                                                                                                                                                                  |
| **Thread participants**           | Now checks workspace/channel membership      | `apps/api/src/modules/threads/routes.ts:43-96`       | GET `/:id/participants` resolves `thread_metadata -> messages -> channels -> workspace_members + channel_members` in a full chain (lines 50-91) before returning participants.                                                                                                                                      |
| **Feature flags RLS**             | RLS scoped to admin/owner                    | `supabase/policies/11_feature_flags.sql:4-25`        | SELECT requires admin/owner role; INSERT/UPDATE/DELETE require admin/owner. Now pairs with API-layer `requireAdmin` (see SEC-001 above).                                                                                                                                                                            |

---

## Part 2: NOT FIXED (Remaining Findings)

These original findings are still present. Source code confirms the same vulnerability pattern exists.

### P1 — Still Open

| ID           | Finding                         | Current State                                                                                                                                                                                                                                                                                 | File:Line                       |
| ------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **SEC-003**  | CORS accepts no-origin requests | `if (!origin) return callback(null, true)` is **still present**. Any request without an `Origin` header (curl, server-to-server, internal network) bypasses CORS entirely. Combined with `credentials: true`, this allows any non-browser client to make authenticated requests cross-origin. | `apps/api/src/app.ts:68`        |
| **SEC-003b** | Socket.io CORS same bypass      | Identical pattern — `if (!origin) return callback(null, true)` for WebSocket/polling connections.                                                                                                                                                                                             | `apps/api/src/lib/socket.ts:39` |

### P2 — Still Open

| ID          | Finding                                           | Current State                                                                                                                                                                                                                                                                                                             | File:Line                                            |
| ----------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **SEC-004** | Workspace delete lacks ownership check            | `requireWorkspaceMembership("id")` is used but **no** `requireWorkspaceRole("owner")` or `requireAdmin` is added. Any workspace member (including "member" role) can delete the entire workspace.                                                                                                                         | `apps/api/src/modules/workspaces/routes.ts:269-286`  |
| **SEC-005** | Message forward lacks target channel access check | `requireMessageAccess("id")` only verifies source message access. The `targetChannelId` from the request body (line 367) passes directly to `messageService.create` (line 381) **without any membership verification**. A user can forward messages into channels they cannot access.                                     | `apps/api/src/modules/messages/routes.ts:362-401`    |
| **SEC-006** | Emoji DELETE lacks workspace check                | DELETE `/emoji/:id` (line 46) calls `supabase.from("custom_emoji").delete().eq("id", req.params.id)` with **no workspace membership check whatsoever**. Any authenticated user can delete any custom emoji from any workspace. GET and POST are workspace-scoped via URL param, but DELETE uses a flat `/emoji/:id` path. | `apps/api/src/modules/emoji/routes.ts:46-57`         |
| **SEC-007** | Read receipts lack channel access check           | All 5 endpoints in this module use only `router.use(authenticate)` (line 13). No channel membership verification for `POST /channels/:id/read`, `GET /channels/:id/last-viewed`, `POST /messages/:id/read`, `GET /messages/:id/readers`, or `GET /unread/counts`.                                                         | `apps/api/src/modules/read-receipts/routes.ts:13-59` |
| **SEC-008** | Thread join/leave/unread lack access check        | `POST /threads/:id/join` (line 99), `POST /threads/:id/leave` (line 116), `GET /threads/:id/unread` (line 126) use only `authenticate`. No workspace or channel membership verification. Contrast with `GET /threads/:id/participants` which DOES perform full chain verification (see Part 1).                           | `apps/api/src/modules/threads/routes.ts:99-137`      |
| **SEC-009** | User groups PATCH checks `created_by` only        | PATCH `/:id` (line 88) uses `eq("created_by", req.userId)` as its sole gate. No workspace membership check. A user who creates a group can still modify it even after being removed from that workspace.                                                                                                                  | `apps/api/src/modules/user-groups/routes.ts:88-107`  |
| **SEC-010** | GDPR export uses admin (service role) client      | Line 222 still uses `const supabase = getSupabaseAdmin()` bypassing all RLS. While scoped to the user's own `user_id`, the service role client fetches data that RLS might otherwise restrict (e.g., messages in private channels the user may have been removed from).                                                   | `apps/api/src/modules/auth/routes.ts:222`            |
| **SEC-011** | No rate limiting on consent logging               | No rate limiter middleware is applied to consent routes — only `authenticate` (line 29 on POST). A user can spam thousands of consent log entries.                                                                                                                                                                        | `apps/api/src/modules/consent/routes.ts:9-57`        |
| **SEC-012** | Group member endpoints lack workspace checks      | GET `/:id/members` (line 146), POST `/:id/members` (line 161), DELETE `/:id/members/:userId` (line 178) use only `authenticate`. Any auth user can read/modify any group's membership.                                                                                                                                    | `apps/api/src/modules/user-groups/routes.ts:145-191` |

### P3 — Still Open

| ID          | Finding                                                   | Current State                                                                                                                                                                                                                                                                                                                                    | File:Line                                           |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **SEC-013** | LiveKit status endpoint unauthenticated                   | `GET /livekit/status` (line 27) has **no** `authenticate` middleware. Returns `configured: true/false` and LiveKit host URL to any client. Information disclosure of infrastructure configuration.                                                                                                                                               | `apps/api/src/modules/livekit/routes.ts:27-32`      |
| **SEC-014** | CSP img-src `https:` overly permissive                    | `img-src 'self' data: https:` allows images from ANY HTTPS domain.                                                                                                                                                                                                                                                                               | `apps/api/src/middleware/security-headers.ts:8`     |
| **SEC-015** | Email enumeration via user search                         | `GET /auth/search` returns full user profiles including email to any authenticated user.                                                                                                                                                                                                                                                         | `apps/api/src/modules/auth/routes.ts:85-97`         |
| **SEC-016** | No CSRF cookie signing                                    | `cookieParser()` called without a secret on line 82 of app.ts. The CSRF cookie is unsigned, meaning its value could theoretically be tampered with.                                                                                                                                                                                              | `apps/api/src/app.ts:82`                            |
| **SEC-017** | Admin stats are global, not workspace-scoped              | `/admin/stats` returns global counts for users/workspaces/channels/messages for any user with admin role in ANY workspace.                                                                                                                                                                                                                       | `apps/api/src/modules/admin/routes.ts:37-51`        |
| **SEC-018** | `requireMessageAccess` uses anon client for initial query | Line 159: `const supabase = getSupabase()` (anon client) for the first `messages.select` to resolve `channel_id`. The rest of the function uses `req.supabase` (user JWT). Inconsistency but functionally low risk since the anon query is only looking up a message by ID which RLS on messages would gate anyway via `getSupabase()` behavior. | `apps/api/src/middleware/require-membership.ts:159` |

---

## Part 3: NEW FINDINGS

Issues identified during re-audit that were not in the original audit or were introduced/amplified by recent changes.

### NEW-001 [P2] — `requireAdmin` grants global admin access across all workspaces

**File**: `apps/api/src/middleware/require-admin.ts:11-16`

```typescript
const { data, error } = await supabase
  .from("workspace_members")
  .select("role")
  .eq("user_id", req.userId)
  .in("role", ["owner", "admin"])
  .limit(1);
```

The middleware checks if the user has `admin` or `owner` role in **any** workspace. This means a user who is admin in Workspace A gets access to **all** admin endpoints (stats, user listing, import/export, webhook deliveries, system health) — which currently return **global** data via `getSupabaseAdmin()`.

**Impact**: Multi-tenant deployments where different organizations share the same Supabase project. Admin-in-workspace-A can view/export all users, all channels, all messages across all workspaces.

**Recommended Fix**: Either (a) add `workspace_id` filtering to all admin endpoints, or (b) require the user to be admin/owner in ALL workspaces (check `count` matches distinct workspace count), or (c) restrict admin routes to super-admin role only.

**Affected endpoints**: `/admin/stats`, `/admin/users`, `/admin/channels`, `/admin/workspaces`, `/admin/integrations`, `/admin/health`, `/admin/system`, `/admin/webhooks/deliveries`, `/admin/export/*`, `/admin/import/*`.

### NEW-002 [P2] — Scheduled-posts membership logic duplicates shared middleware

**File**: `apps/api/src/modules/scheduled-posts/routes.ts:9-33`

```typescript
async function requireWorkspaceMember(workspaceId: string, req: Request): Promise<void> {
  const supabase = req.supabase as SupabaseClient;
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", req.userId)
    .single();
  if (error || !data) {
    throw new ForbiddenError("Not a member of this workspace");
  }
}
```

This reimplements `requireWorkspaceMembership` from `require-membership.ts` but:

1. Does NOT set `req.workspaceRole` (prevents downstream role-based authorization).
2. Uses `as SupabaseClient` cast instead of the proper `req.supabase` type pattern.
3. Duplicates query logic — if the shared middleware's query logic changes (e.g., new column, new error code), this copy won't be updated.

**Recommended Fix**: Use `requireWorkspaceMembership` middleware via a middleware wrapper that maps the query param. Or at minimum set `req.workspaceRole` in the inline helper.

### NEW-003 [P2] — Admin export endpoints return global data with no workspace scoping

**File**: `apps/api/src/modules/export/routes.ts:41-95`

All four export endpoints (`/admin/export/workspaces`, `/users`, `/channels`, `/messages`) use `getSupabaseAdmin()` and select ALL rows without any workspace filter. Combined with NEW-001, an admin in workspace A can export all messages from all workspaces via CSV.

**Affected**: `export/routes.ts:46-50, 61-64, 75-79, 89-93`

**Recommended Fix**: Accept `workspace_id` query parameter and filter exports. Or document that these are super-admin-only endpoints and enforce via a different auth check.

### NEW-004 [P2] — `public.users` table has no INSERT RLS policy

**File**: `supabase/policies/01_users.sql`

Only SELECT (line 4) and UPDATE (line 9) policies exist. No INSERT policy. The import route (`import/routes.ts:69`) works because it uses `getSupabaseAdmin()` (bypassing RLS), but if any future code adds user INSERT via the user JWT client, it would fail silently at RLS.

**Recommended Fix**: Either document that user INSERT is admin-only (and add an explicit INSERT policy using role check) or add a guard in the import route that confirms the import is intentional.

### NEW-005 [P3] — Thread join/leave/unread vs participants access-check inconsistency

**Files**: `apps/api/src/modules/threads/routes.ts:43-96` (participants — has full check), lines 99-137 (join/leave/unread — no check)

The `GET /threads/:id/participants` endpoint performs a full 3-table chain check (thread_metadata -> messages -> channels -> workspace_members + channel_members) while `POST /threads/:id/join`, `POST /threads/:id/leave`, and `GET /threads/:id/unread` perform none. This inconsistency creates a false sense of security — a developer looking at `participants` might assume all thread endpoints are hardened.

**Recommendation**: Extract the chain check into a reusable `requireThreadAccess` middleware and apply it to all thread endpoints.

### NEW-006 [P3] — Emoji route path asymmetry

**Files**: `apps/api/src/modules/emoji/routes.ts`

GET and POST use `/workspaces/:workspaceId/emoji` (workspace-scoped path) while DELETE uses `/emoji/:id` (flat path). The DELETE handler (lines 46-57) has no workspace check at all. The path structure itself suggests a different authorization model for each verb.

**Recommendation**: Either move DELETE to `/workspaces/:workspaceId/emoji/:id` or add inline workspace membership check to the flat path handler.

### NEW-007 [P3] — Admin webhook deliveries endpoint returns global data

**File**: `apps/api/src/modules/admin/routes.ts:259-278`

`/admin/webhooks/deliveries` queries all deliveries across all workspaces via `getSupabaseAdmin()` and includes `webhook_endpoints!inner(name, workspace_id)`. Any admin in any workspace sees delivery logs from all workspaces.

**Recommendation**: Accept optional `workspace_id` filter and enforce admin membership for that specific workspace.

---

## Part 4: Summary

### Severity Tally

| Severity  | Original | Fixed                | Remaining   | New   | Current Total |
| --------- | -------- | -------------------- | ----------- | ----- | ------------- |
| **P0**    | 0        | 0                    | 0           | 0     | **0**         |
| **P1**    | 3        | 2 (SEC-001, SEC-002) | 1 (SEC-003) | 0     | **1**         |
| **P2**    | 9        | 7                    | 7           | 4     | **11**        |
| **P3**    | 6        | 0                    | 6           | 3     | **9**         |
| **Total** | **18**   | **9**                | **14**      | **7** | **21**        |

### Key Observations

1. **SEC-003 (CORS no-origin bypass, P1) is the most critical remaining gap.** It is a defense-in-depth concern (JWT auth still required) but combined with `credentials: true` and cookie-based auth, it widens the CSRF attack surface for non-browser clients.

2. **NEW-001 (global admin scope) is the most significant new finding.** The `requireAdmin` middleware effectively grants super-admin access to any user who is admin in any workspace because admin endpoints return global (unfiltered) data.

3. **Thread and read-receipt modules remain the least-hardened.** SEC-007 and SEC-008 together mean that read/write operations on threads and read receipts have no channel/workspace membership enforcement at the API layer.

4. **The emoji DELETE endpoint (SEC-006) is the most accessible cross-tenant write vector** among remaining P2s — any authenticated user can delete any custom emoji from any workspace with a single HTTP call.

### Readiness Score: 78/100 (was 82/100)

Downgraded from 82 due to:

- 1 P1 still open (CORS bypass claimed fixed but not actually changed)
- 4 new P2 findings (global admin scope, duplicate membership logic, global exports, users INSERT gap)
- 7 original P2s still unaddressed (forward target check, emoji delete, read receipts, threads, user groups PATCH, GDPR admin client, consent rate limit)

### Go/No-Go: GO WITH RISKS (unchanged from original)

**Conditions before next release**:

1. **Fix SEC-003 (CORS)** — Remove or restrict the no-origin bypass. At minimum, log all no-origin requests for audit visibility. ~0.25 day.
2. **Fix NEW-001 (global admin scope)** — Add workspace_id filtering to admin endpoints or restrict to super-admin. ~1 day.
3. **Fix SEC-005 (forward target check)** — Add `requireChannelAccess` on `targetChannelId` in the forward handler. ~0.25 day.
4. **Fix SEC-006 (emoji delete)** — Add workspace membership check to DELETE handler. ~0.25 day.

### Audit Trail

Source files examined (re-read in full during this re-audit):

| File                                             | Lines   | Purpose                                      |
| ------------------------------------------------ | ------- | -------------------------------------------- |
| `apps/api/src/app.ts`                            | 1-109   | CORS config, cookie parser, middleware stack |
| `apps/api/src/lib/socket.ts`                     | 1-60    | Socket.io CORS config                        |
| `apps/api/src/middleware/require-admin.ts`       | 1-25    | Global admin check pattern                   |
| `apps/api/src/middleware/require-membership.ts`  | 1-226   | All membership check middleware              |
| `apps/api/src/middleware/security-headers.ts`    | 1-50    | CSP, HSTS, other security headers            |
| `apps/api/src/middleware/csrf.ts`                | 1-110   | CSRF double-submit cookie implementation     |
| `apps/api/src/modules/feature-flags/routes.ts`   | 1-124   | SEC-001 verification                         |
| `apps/api/src/modules/scheduled-posts/routes.ts` | 1-109   | SEC-002 verification + NEW-002               |
| `apps/api/src/modules/auth/routes.ts`            | 1-329   | GDPR export, user search, sessions           |
| `apps/api/src/modules/consent/routes.ts`         | 1-59    | Duplicate route removal + SEC-011            |
| `apps/api/src/modules/webhooks/routes.ts`        | 1-261   | Workspace access checks                      |
| `apps/api/src/modules/reactions/routes.ts`       | 1-165   | Batch access chain verification              |
| `apps/api/src/modules/export/routes.ts`          | 1-97    | NEW-003 (global exports)                     |
| `apps/api/src/modules/import/routes.ts`          | 1-84    | Admin import verification                    |
| `apps/api/src/modules/emoji/routes.ts`           | 1-59    | SEC-006 + NEW-006                            |
| `apps/api/src/modules/read-receipts/routes.ts`   | 1-61    | SEC-007                                      |
| `apps/api/src/modules/threads/routes.ts`         | 1-139   | SEC-008 + NEW-005                            |
| `apps/api/src/modules/user-groups/routes.ts`     | 1-193   | SEC-009, SEC-012, partial fix verification   |
| `apps/api/src/modules/workspaces/routes.ts`      | 260-288 | SEC-004                                      |
| `apps/api/src/modules/messages/routes.ts`        | 355-414 | SEC-005 (forward endpoint)                   |
| `apps/api/src/modules/livekit/routes.ts`         | 1-34    | SEC-013                                      |
| `apps/api/src/modules/admin/routes.ts`           | 1-279   | SEC-017 + NEW-001 + NEW-007                  |
| `apps/api/src/modules/announcements/routes.ts`   | 1-98    | Baseline reference                           |
| `supabase/policies/01_users.sql`                 | 1-13    | NEW-004                                      |
| `supabase/policies/02_workspaces.sql`            | 1-26    | RLS baseline                                 |
| `supabase/policies/03_channels.sql`              | 1-40    | RLS channels + channel_members               |
| `supabase/policies/04_messages.sql`              | 1-31    | RLS messages                                 |
| `supabase/policies/06_reactions.sql`             | 1-24    | Reactions RLS fix verification               |
| `supabase/policies/09_webhooks.sql`              | 1-63    | RLS webhooks baseline                        |
| `supabase/policies/11_feature_flags.sql`         | 1-25    | Feature flags RLS baseline                   |
