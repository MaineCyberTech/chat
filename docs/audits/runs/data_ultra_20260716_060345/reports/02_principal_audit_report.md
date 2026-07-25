# Principal Audit Report

- Prompt: **data_ultra**
- Domain: **data**
- Run ID: **data_ultra_20260716_060345**
- Generated: **2026-07-16T12:00:00.000Z**
- Decision: **NO-GO**
- P0: **2**, P1: **5**
- P2: **6**, P3: **3**
- Readiness: **4.00**

## Findings

### P0 — CRITICAL: Private channel data exposure — RLS fails to filter private channels across channels and messages tables

- **File:** `supabase/policies/03_channels.sql, supabase/policies/04_messages.sql`
- **Category:** cross_cutting
- **Impact:** Combined channels + messages RLS gap: any workspace member can enumerate all private channels and read all messages within them. This is the single most impactful finding across all three audits. The API middleware provides partial protection but RLS is the last line of defense.
- **Fix:** Fix both RLS policies to include private channel membership check. See security_principal_audit and database_integrity_migration_audit for details.

### P0 — CRITICAL: Additive RLS insert policies bypass channel membership for message posting

- **File:** `supabase/migrations/20260626000022_apply_rls_policies.sql, supabase/migrations/20260704000008_add_post_priority.sql`
- **Category:** cross_cutting
- **Impact:** Two insert policies on messages (`messages_insert_own` + `channel_member_insert`) are OR-combined, allowing any authenticated user to post to any channel via direct Supabase client calls.
- **Fix:** Drop `messages_insert_own` policy.

### P1 — Reactions data leaked via open RLS and unguarded batch endpoint

- **File:** `supabase/policies/06_reactions.sql, apps/api/src/modules/reactions/routes.ts`
- **Category:** cross_cutting
- **Impact:** Two parallel paths leak reaction data: (1) RLS `using (true)` on reactions table, (2) batch endpoint without message access verification. Combined, any authenticated user can enumerate reactions on any message.
- **Fix:** Fix RLS to scope by channel membership. Add access control to batch endpoint.

### P1 — User presence data exposed across workspace boundaries

- **File:** `supabase/migrations/20260704000001_add_dm_presence_categories.sql`
- **Category:** cross_cutting
- **Impact:** All authenticated users can see online/offline/dnd status and custom status messages for all users system-wide.
- **Fix:** Scope presence visibility to workspace co-members.

### P1 — Compliance exports visible across workspaces — lacks workspace_id column

- **File:** `supabase/migrations/20260709000003_add_compliance_exports.sql`
- **Category:** cross_cutting
- **Impact:** Admin in workspace A can read compliance exports (messages, audit logs) belonging to workspace B. The table has no workspace scoping.
- **Fix:** Add workspace_id FK and scope RLS accordingly.

### P2 — No missed-event recovery on websocket reconnect — permanent data loss window

- **File:** `apps/web/lib/socket.ts`
- **Category:** cross_cutting
- **Impact:** Socket reconnection has no sequence tracking or event replay. Messages, reactions, presence updates sent during disconnect are permanently lost.
- **Fix:** Implement event sequence tracking with replay endpoint.

### P2 — Announcements visible across all workspaces

- **File:** `supabase/migrations/20260709000004_add_announcements.sql`
- **Category:** cross_cutting
- **Impact:** Unlike the API endpoint which likely filters by workspace, the RLS allows any authenticated user to read all announcements.
- **Fix:** Scope announcements RLS to workspace membership.

### P2 — GDPR delete not atomic — partial deletion risk

- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** cross_cutting
- **Impact:** 12 sequential delete calls without transaction wrapping. Partial failure leaves inconsistent user data.
- **Fix:** Use transactional RPC or add compensation logic.

### P2 — Private channel creation not restricted to admins

- **File:** `supabase/policies/03_channels.sql`
- **Category:** cross_cutting
- **Impact:** Any workspace member can create private channels. No rate limit or approval flow.
- **Fix:** Restrict to admins/owners or add audit/approval.

### P2 — Mixed pagination (cursor vs offset) across list/search endpoints

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** cross_cutting
- **Impact:** Inconsistent pagination forces frontend to handle two strategies, complicating cache and data reconciliation.
- **Fix:** Consolidate to cursor-based pagination.

### P3 — SQL injection sanitizer causes false positives on natural language text

- **File:** `apps/api/src/middleware/input-sanitizer.ts`
- **Category:** cross_cutting
- **Impact:** Keywords like 'select', 'from', 'where' in natural language trigger false positive rejections on non-content fields.
- **Fix:** Use syntax-aware detection instead of keyword matching.

### P3 — CSP lacks nonce support for inline scripts

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** cross_cutting
- **Impact:** Future frontend work requiring inline scripts will be blocked.
- **Fix:** Add nonce generation when frontend requires inline scripts.

### P3 — Webhook body limit uses spoofable Content-Length header

- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** cross_cutting
- **Impact:** Content-Length can be manipulated; actual body size enforcement is in express.json middleware already.
- **Fix:** Remove redundant middleware.
