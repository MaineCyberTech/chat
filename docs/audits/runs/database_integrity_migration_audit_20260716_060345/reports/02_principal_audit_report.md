# Principal Audit Report

- Prompt: **database_integrity_migration_audit**
- Domain: **database**
- Run ID: **database_integrity_migration_audit_20260716_060345**
- Generated: **2026-07-16T12:00:00.000Z**
- Decision: **NO-GO**
- P0: **2**, P1: **3**
- P2: **3**, P3: **1**
- Readiness: **5.00**

## Findings

### P0 — Channel select RLS does not filter private channels — workspace members see all channels

- **File:** `supabase/policies/03_channels.sql`
- **Category:** rls_posture
- **Impact:** The `channels_select_member` policy at `supabase/policies/03_channels.sql:4-14` only verifies workspace membership. Private channels (`is_private = true`) are not filtered out. Any workspace member can query all channels including private ones via Supabase client with their JWT.
- **Fix:** Add private channel guard: `and (channels.is_private = false or exists (select 1 from channel_members cm where cm.channel_id = channels.id and cm.user_id = auth.uid()))`

### P0 — Two additive RLS insert policies on messages table create a bypass for channel membership checks

- **File:** `supabase/migrations/20260626000022_apply_rls_policies.sql, supabase/migrations/20260704000008_add_post_priority.sql`
- **Category:** rls_posture
- **Impact:** Policy `messages_insert_own` (checks `auth.uid() = user_id`) OR `channel_member_insert` (checks channel membership) exist simultaneously. Since Supabase uses OR logic for same-table/same-operation policies, any authenticated user can insert messages into any channel by setting `user_id = auth.uid()`. This completely bypasses the channel membership requirement.
- **Fix:** Remove the `messages_insert_own` policy: `DROP POLICY IF EXISTS messages_insert_own ON public.messages;`

### P1 — Reactions SELECT policy is open to all authenticated users — no channel/workspace scoping

- **File:** `supabase/policies/06_reactions.sql`
- **Category:** rls_posture
- **Impact:** `reactions_select` at `supabase/policies/06_reactions.sql:5-7` is `using (true)`. Any authenticated user can enumerate reactions on any message, including messages in private channels. This leaks engagement patterns.
- **Fix:** Add channel membership check via message join: scope to messages in channels the user can access.

### P1 — user_presence SELECT policy is open to all authenticated users across all workspaces

- **File:** `supabase/migrations/20260704000001_add_dm_presence_categories.sql`
- **Category:** rls_posture
- **Impact:** The `user_presence` select policy uses `using (true)`, allowing any authenticated user to see the online status and custom status of every user in the system, regardless of workspace membership.
- **Fix:** Scope presence visibility to users who share at least one workspace.

### P1 — Compliance exports table has no workspace_id column — cross-workspace data exposure via RLS

- **File:** `supabase/migrations/20260709000003_add_compliance_exports.sql`
- **Category:** schema_drift
- **Impact:** The `compliance_exports` table lacks a `workspace_id` column. The SELECT policy allows any workspace admin/owner to read ALL rows. An admin in workspace A can see compliance exports generated for workspace B. Exports may contain sensitive message content and audit data.
- **Fix:** Add `workspace_id UUID NOT NULL REFERENCES workspaces(id)` column. Update the SELECT policy to filter by workspace membership with admin role.

### P2 — Announcements SELECT policy is `using (true)` — all authenticated users see all announcements

- **File:** `supabase/migrations/20260709000004_add_announcements.sql`
- **Category:** rls_posture
- **Impact:** The `announcements_select` policy allows any authenticated user to read all announcements across all workspaces. Announcement content may be workspace-sensitive.
- **Fix:** Scope to workspace membership: `exists (select 1 from workspace_members wm where wm.workspace_id = announcements.workspace_id and wm.user_id = auth.uid())`

### P2 — Channels INSERT policy does not restrict private channel creation to admins

- **File:** `supabase/policies/03_channels.sql`
- **Category:** rls_posture
- **Impact:** The `channels_insert_member` policy at `supabase/policies/03_channels.sql:18-27` allows any workspace member to create channels, including private channels. This enables unauthorized private channel creation with no admin oversight.
- **Fix:** Restrict private channel creation to workspace admins/owners, or add a rate limit / approval flow.

### P2 — Migration includes data-seeding operations (INSERT ... SELECT) that may lock large tables

- **File:** `supabase/migrations/20260704000001_add_dm_presence_categories.sql`
- **Category:** migration_safety
- **Impact:** Lines 87-101 run `INSERT INTO sidebar_categories SELECT DISTINCT ... FROM workspace_members` which scans the entire`workspace_members` table. On a production database with thousands of members, this can cause long-running locks and table bloat.
- **Fix:** Move seeding to a separate post-deploy script or application-level migration that runs in batches.

### P3 — Message select RLS does not filter private channels

- **File:** `supabase/policies/04_messages.sql`
- **Category:** schema_drift
- **Impact:** Same root cause as the channels RLS gap — messages in private channels are exposed through the messages SELECT policy which only checks workspace membership.
- **Fix:** Scope messages SELECT to include private channel membership check via join to channels + channel_members.
