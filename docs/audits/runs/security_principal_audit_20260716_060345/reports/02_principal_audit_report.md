# Principal Audit Report

- Prompt: **security_principal_audit**
- Domain: **security**
- Run ID: **security_principal_audit_20260716_060345**
- Generated: **2026-07-16T12:00:00.000Z**
- Decision: **NO-GO**
- P0: **2**, P1: **4**
- P2: **3**, P3: **1**
- Readiness: **4.50**

## Findings

### P0 — Private channel data exposed via channels select RLS — no private channel filtering
- **File:** `supabase/policies/03_channels.sql`
- **Category:** authorization
- **Impact:** Any workspace member can list ALL channels including private ones. The `channels_select_member` policy only checks workspace membership, not whether the user is a member of private channels. Combined with the messages RLS gap, this exposes private channel names and content to all workspace members.
- **Fix:** Add private channel membership check to `channels_select_member`: `and (channels.is_private = false or exists (select 1 from channel_members cm where cm.channel_id = channels.id and cm.user_id = auth.uid()))`

### P0 — Conflicting RLS insert policies on messages table — `messages_insert_own` allows posting to ANY channel
- **File:** `supabase/migrations/20260626000022_apply_rls_policies.sql, supabase/migrations/20260704000008_add_post_priority.sql`
- **Category:** authorization
- **Impact:** Two insert policies exist on `messages`: `messages_insert_own` (checks `auth.uid() = user_id`) and `channel_member_insert` (checks channel membership). Supabase OR-combines same-operation policies, so any authenticated user can insert messages into ANY channel by setting `user_id` to their own ID. The API middleware prevents this but direct Supabase client calls bypass it.
- **Fix:** Drop `messages_insert_own` policy: `DROP POLICY IF EXISTS messages_insert_own ON public.messages;` The `channel_member_insert` policy is sufficient and correct.

### P1 — Reactions RLS SELECT is `using (true)` — any authenticated user sees ALL reactions
- **File:** `supabase/policies/06_reactions.sql`
- **Category:** authorization
- **Impact:** The `reactions_select` policy allows any authenticated user to see all reactions across the system, including on messages in private channels they don't have access to. This leaks engagement patterns and channel membership information.
- **Fix:** Add workspace/channel membership check: scope `reactions_select` to messages in channels the user can access, e.g. via `exists (select 1 from messages m join channels ch on ch.id = m.channel_id join workspace_members wm on wm.workspace_id = ch.workspace_id where m.id = reactions.message_id and wm.user_id = auth.uid())`

### P1 — Reactions batch endpoint lacks message access control
- **File:** `supabase/policies/06_reactions.sql`
- **Category:** authorization
- **Impact:** The `GET /reactions/batch?message_ids=...` endpoint at `apps/api/src/modules/reactions/routes.ts:24-41` accepts arbitrary message IDs and returns reactions without verifying user access. This allows enumerating reactions on messages in private channels.
- **Fix:** Add `requireMessageAccess` middleware to the batch endpoint, or filter by message IDs the user can access.

### P1 — Compliance exports RLS lacks workspace scoping — cross-workspace admin data leak
- **File:** `supabase/migrations/20260709000003_add_compliance_exports.sql`
- **Category:** data_protection
- **Impact:** The `compliance_exports_select` policy allows any workspace admin/owner to see ALL compliance exports across all workspaces. The table has no `workspace_id` column. Exports may contain sensitive message/audit data.
- **Fix:** Add `workspace_id` column to `compliance_exports` and scope the SELECT policy to admin/owner of the matching workspace.

### P1 — user_presence RLS SELECT is `using (true)` — all authenticated users see all presence data
- **File:** `supabase/migrations/20260704000001_add_dm_presence_categories.sql`
- **Category:** data_protection
- **Impact:** Any authenticated user can see the online/away/dnd status and custom status of all users across workspaces. This leaks user activity patterns.
- **Fix:** Scope presence visibility to users sharing a workspace: add `exists (select 1 from workspace_members wm1 join workspace_members wm2 on wm1.workspace_id = wm2.workspace_id where wm1.user_id = user_presence.user_id and wm2.user_id = auth.uid())`

### P2 — GDPR account deletion uses sequential deletes without transaction wrapping
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** data_protection
- **Impact:** The GDPR delete handler at line 260-276 runs 12 sequential `supabase.from(...).delete().eq(...)` calls without wrapping in a transaction. A failure mid-way leaves orphaned data (e.g., consent logs deleted but messages not, or user record remaining with no memberships).
- **Fix:** Use Supabase RPC or a server-side function to execute all deletes atomically, or implement a compensation mechanism on failure.

### P2 — Webhook retries use in-process setTimeout — lost on server restart
- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** logging_monitoring
- **Impact:** Webhook delivery retries at lines 405-409 use `setTimeout()` which does not survive process restarts or crashes. Failed deliveries with retries pending are lost if the server restarts.
- **Fix:** Use persistent scheduling via BullMQ (existing worker infrastructure) or a database-based retry queue with cron-based processor.

### P2 — Input sanitizer SQL injection patterns cause false positives on legitimate message content
- **File:** `apps/api/src/middleware/input-sanitizer.ts`
- **Category:** authentication
- **Impact:** The SQL injection patterns at line 17-21 match common English words like `select`, `from`, `where`, `insert`, `update`, `delete` occurring in normal message text. The `content` field is exempt but other string fields are not, potentially blocking legitimate input.
- **Fix:** Use a more targeted SQL injection detection approach: check for SQL syntax anomalies rather than keyword presence, or only apply to fields where SQL injection is a realistic threat (e.g., channel names, workspace slugs).

### P3 — CSP policy lacks nonce/hash support for inline scripts
- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** cors_csrf
- **Impact:** The Content-Security-Policy header uses `script-src 'self'` without nonce or hash support. If any inline scripts need to execute (e.g., in frontend rendering), they will be blocked.
- **Fix:** If the application ever needs inline scripts, add nonce generation to the middleware and pass nonces through response locals. For now, this is acceptable since the API server doesn't serve HTML.
