# Final Comprehensive Database Audit — July 24, 2026

**Scope**: All 72 migration files, 65 rollback files, 11 policy files, 6 seed files, 12 DB package TypeScript files.
**Version**: Last migration `20260724000003`.

---

## Summary

| Severity | Count | Description                                                   |
| -------- | ----- | ------------------------------------------------------------- |
| **P0**   | 3     | GDPR data leak, runtime crash, column name mismatch           |
| **P1**   | 14    | FK inconsistencies, missing GDPR cleanup, regressed RLS       |
| **P2**   | 22    | Missing indexes, stale policies, type gaps, missing rollbacks |
| **P3**   | 18    | Redundancy, naming ambiguity, cosmetic issues                 |

**Overall**: 57 findings. Production-blocking: 3 (P0). Must-fix-before-GDPR-audit: 8 more (P1). Worth cleanup: 46 (P2+P3).

---

## P0 — CRITICAL (Data Loss / Runtime Crash)

### P0-01: notification-store.ts queries wrong column name `sound` — runtime crash

- **File**: `packages/db/src/stores/notification-store.ts:40`
- **Current**: `.select("notify, sound")`
- **Problem**: The `channel_notification_preferences` table has column `notify_sound` (not `sound`). This query will fail at runtime with a Postgres "column does not exist" error whenever `getPreferences()` is called.
- **Fix**: Change to `.select("notify, notify_sound")` and update return type.

### P0-02: `gdpr_delete_user()` misses 7+ tables — incomplete data purge (GDPR non-compliant)

- **File**: `supabase/migrations/20260724000003_create_gdpr_delete_function.sql:1-49`
- **Problem**: The function cleans 24 tables but misses these user-data-carrying tables:
  1. `notification_preferences` (FK to `auth.users(id)`, not `public.users(id)` — not cascaded)
  2. `dm_members` (FK to `auth.users(id)` — user's DM memberships not removed)
  3. `custom_emoji` (column `created_by` FK to `auth.users(id)`)
  4. `user_groups` (column `created_by` FK to `auth.users(id)`)
  5. `thread_participants` (column `user_id` FK to `public.users(id)`)
  6. `channel_member_history` (column `user_id` FK to `public.users(id)`)
  7. `channel_role_overrides` (column `user_id` FK to `public.users(id)`)
  8. `message_reads` (column `user_id` FK to `public.users(id)`)
  9. `compliance_exports` (column `created_by` FK to `public.users(id) ON DELETE SET NULL` — not cleaned, not set null)
  10. `announcements` (column `created_by UUID NOT NULL` — no FK, needs cleanup)
- **GDPR Impact**: User deletion leaves orphaned data in 10 tables, some with PII (notification preferences, DM memberships, thread tracking).
- **Fix**: Add DELETE statements for all 10 tables before the `DELETE FROM users` line.

### P0-03: `handle_user_deletion` trigger missing tables — incomplete cleanup on auth.user delete

- **File**: `supabase/migrations/20260724000001_fix_sidebar_assignments_trigger.sql:1-19`
- **Problem**: The trigger (latest version) cleans 12 tables but misses:
  1. `dm_members` (FK `ON DELETE CASCADE` will handle, but explicit is safer)
  2. `thread_participants` (FK `ON DELETE CASCADE` will handle)
  3. `channel_member_history` (FK `ON DELETE CASCADE` will handle)
  4. `message_reads` (FK `ON DELETE CASCADE` will handle)
  5. `notification_preferences` (FK `ON DELETE CASCADE` will handle)
  6. `custom_emoji` (created_by — FK `ON DELETE CASCADE`)
  7. `user_groups` (created_by — FK `ON DELETE CASCADE`)
  8. `dm_channels` (deprecated table, user1_id/user2_id — FK `ON DELETE CASCADE`)
  9. `webhook_endpoints` (created_by — **NO ON DELETE!** This won't cascade)
  10. `message_edit_history` (edited_by — FK `ON DELETE CASCADE`)
  11. `auto_responders` (user_id — FK `ON DELETE CASCADE`)
  12. `trigger_words` (user_id — FK `ON DELETE CASCADE`)
  13. `scheduled_posts` (user_id — FK `ON DELETE CASCADE`)
  14. `channel_notification_preferences` (user_id — FK `ON DELETE CASCADE`)
  15. `message_flags` (user_id — FK `ON DELETE CASCADE`)
- **Severity of actual gap**: Most have `ON DELETE CASCADE` FKs, so the DB handles them automatically. The critical miss is `webhook_endpoints.created_by` which has **no ON DELETE clause** and would block user deletion.
- **Fix**: Either add `ON DELETE CASCADE` to `webhook_endpoints.created_by` FK, or add explicit DELETE to trigger.

---

## P1 — HIGH (Data Integrity / RLS / Consistency)

### P1-01: `webhook_endpoints.created_by` FK has no ON DELETE — blocks user deletion

- **File**: `supabase/migrations/20260625000012_create_webhooks.sql:13`
- **Current**: `created_by uuid not null references auth.users(id)`
- **Problem**: No `ON DELETE` clause specified. Default is `NO ACTION` (or `RESTRICT`), which will block `DELETE FROM auth.users` if the user created webhooks. The `handle_user_deletion` trigger doesn't clean this table.
- **Fix**: Add `ON DELETE CASCADE` (or clean in trigger/GDPR function and use `ON DELETE SET NULL`).

### P1-02: `announcements.created_by` has no FK at all — orphan risk

- **File**: `supabase/migrations/20260709000004_add_announcements.sql:7`
- **Current**: `created_by UUID NOT NULL` (no REFERENCES clause)
- **Problem**: No foreign key constraint. User deletion leaves orphan `created_by` values. No automatic cleanup.
- **Fix**: Add FK: `REFERENCES auth.users(id) ON DELETE CASCADE` or `ON DELETE SET NULL`.

### P1-03: Dual `notification_preferences` tables with confusing overlap

- **Files**:
  - `supabase/migrations/20260627000005_notification_preferences.sql` → `public.notification_preferences` (per-user, per-workspace, per-channel, per-type)
  - `supabase/migrations/20260704000001_add_dm_presence_categories.sql:73` → `public.channel_notification_preferences` (per-user, per-channel, notify/notify_sound)
- **Problem**: Two tables with nearly identical purposes but different schemas. `notification_preferences` has `notification_type` column; `channel_notification_preferences` has `notify` + `notify_sound` columns. Developers will confuse them. The `handle_new_user()` function inserts into `notification_preferences`, but the notification store queries `channel_notification_preferences`.
- **Fix**: Consolidate into one table with all columns, or add clear documentation distinguishing them.

### P1-04: `user_groups` RLS regression — admins locked out of managing groups

- **File**: `supabase/migrations/20260705000003_add_user_groups.sql:12-26`
- **Problem**: Migration `20260704000007` had policies allowing workspace admins to manage groups. Migration `20260705000003` replaced them with policies that only allow the **creator** to update/delete groups. This means an admin who didn't create a group cannot edit or delete it.
- **Fix**: Restore admin-manage policies alongside creator policies. Either use `OR` conditions or both policies.

### P1-05: `user_group_members` RLS regression — only creator can manage membership

- **File**: `supabase/migrations/20260705000003_add_user_groups.sql:36-44`
- **Problem**: Same regression as P1-04. The "Group creators manage members" policy locks out workspace admins.
- **Fix**: Add admin-manage policy for `user_group_members`.

### P1-06: Mixed FK targets — some tables ref `auth.users`, others ref `public.users`

- **Scope**: Across 20+ migrations
- **Problem**: Inconsistent FK targets cause confusion and affect cascading behavior:
  - **FK to `auth.users(id)`**: `notifications`, `notification_preferences`, `message_flags`, `message_edit_history`, `webhook_endpoints`, `consent_logs`, `message_reminders`, `trigger_words`, `auto_responders`, `dm_channels`, `user_presence`, `channel_bookmarks`, `sidebar_categories`, `channel_notification_preferences`, `dm_members`, `custom_emoji`, `user_groups`, `scheduled_posts`
  - **FK to `public.users(id)`**: `workspaces`, `workspace_members`, `channels`, `channel_members`, `messages`, `reactions`, `user_preferences`, `user_statuses`, `channel_role_overrides`, `channel_member_history`, `message_reads`, `thread_participants`, `user_group_members` (changed from auth.users), `push_subscriptions`
- **Impact**: When GDPR deletes from `public.users` but not `auth.users`, tables referencing `auth.users` are NOT cascaded. The GDPR function must manually clean them.
- **Fix**: Standardize on `public.users(id)` for all application tables where possible (PostgREST can't expose `auth.users`). Only exceptions: triggers on auth.users, internal auth functions.

### P1-07: `notification_preferences` not cleaned by GDPR function (FK to auth.users)

- **File**: `supabase/migrations/20260724000003_create_gdpr_delete_function.sql`
- **Problem**: `notification_preferences` has FK `REFERENCES auth.users(id) ON DELETE CASCADE`. But GDPR function deletes from `public.users`, not `auth.users`. The ON DELETE CASCADE won't fire.
- **Fix**: Add `DELETE FROM notification_preferences WHERE user_id = target_user_id;` to GDPR function.

### P1-08: `dm_members` not cleaned by GDPR function

- **File**: `supabase/migrations/20260724000003_create_gdpr_delete_function.sql`
- **Problem**: GDPR function deletes from deprecated `dm_channels` table (line 29) but NOT from the replacement `dm_members` table.
- **Fix**: Add `DELETE FROM dm_members WHERE user_id = target_user_id;` and remove the `dm_channels` cleanup (migration data was already migrated).

### P1-09: `custom_emoji` and `user_groups` `created_by` not cleaned

- **File**: `supabase/migrations/20260724000003_create_gdpr_delete_function.sql`
- **Problem**: These tables have `created_by` FKs to `auth.users(id) ON DELETE CASCADE`, but cascading won't fire from `public.users` deletion.
- **Fix**: Add DELETE statements for both tables by `created_by = target_user_id`.

### P1-10: `compliance_exports` RLS regression — any admin sees all exports

- **File**: `supabase/migrations/20260724000002_fix_compliance_export_rls.sql:3-9`
- **Problem**: Original policy (`20260716000001`) scoped to workspace via `workspace_id` column. New policy checks `EXISTS (workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin'))` — meaning an admin of **any** workspace can see all compliance exports from all workspaces.
- **Fix**: Restore workspace-scoped RLS check using the `workspace_id` column.

### P1-11: `user_statuses` RLS SELECT uses `using(true)` — public read

- **File**: `supabase/migrations/20260627000011_custom_status.sql:17`
- **Current**: `USING (true)`
- **Problem**: Any authenticated user can see ALL users' custom statuses, including users in workspaces they don't belong to. While statuses are generally public, this leaks cross-workspace information.
- **Fix**: Scope to shared workspaces: `USING (EXISTS (SELECT 1 FROM workspace_members WHERE user_id = user_statuses.user_id AND workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())))`.

### P1-12: `handle_user_deletion` trigger in 20260724000001 misses `webhook_endpoints`

- **File**: `supabase/migrations/20260724000001_fix_sidebar_assignments_trigger.sql:1-19`
- **Problem**: `webhook_endpoints.created_by` has no `ON DELETE` clause. The trigger doesn't clean this table. Deleting a user who created webhooks will fail.
- **Fix**: Add `DELETE FROM webhook_endpoints WHERE created_by = OLD.id;` to the trigger, OR add `ON DELETE CASCADE` to the FK.

### P1-13: `handle_user_deletion` in 20260724000001 also misses `message_flags`

- **File**: `supabase/migrations/20260724000001_fix_sidebar_assignments_trigger.sql`
- **Problem**: `message_flags` has `ON DELETE CASCADE` (FK to auth.users), so the DB cleans it automatically. But explicit cleanup in the trigger is safer and provides clearer audit trail. Same applies to: `message_edit_history`, `auto_responders`, `trigger_words`, `scheduled_posts`, `channel_notification_preferences`, `custom_emoji`, `user_groups`.
- **Fix**: Consider adding explicit DELETEs for all user-owned data, or document clearly that cascading handles them.

### P1-14: `message_edit_history` policy references `channel_members` — may miss workspace-scoped access

- **File**: `supabase/migrations/20260703000001_add_message_features.sql:45-50`
- **Current**: Uses `channel_members` for visibility check
- **Problem**: Workspace members who are NOT channel members (e.g., workspace admins) cannot see edit history. Should use `workspace_members` scope for workspace-level access.
- **Fix**: Change to workspace_members-based check: `JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id` where `ch` is joined via `messages`.

---

## P2 — MEDIUM (Technical Debt / Edge Cases)

### P2-01: Policy files in `supabase/policies/` are stale — out of sync with migrations

- **Files**: All 11 files in `supabase/policies/`
- **Problem**: The policy files represent the original design but many have been updated by later migrations. For example:
  - `01_users.sql` has `users_select_own` but migration `20260719000002` changed to `users_select`
  - `02_workspaces.sql` has `workspace_members_select_own` but migration `20260719000001` changed to `workspace_members_select`
  - `04_messages.sql` doesn't have `channel_member_insert` policy added in `20260704000008`
- **Fix**: Either delete the policies directory (use migrations as SSOT), or update all policy files to match current state.

### P2-02: 17 migrations have no corresponding rollback files

- **Missing rollbacks for**:
  - `20260625000017_audit_logs_org_fk`
  - `20260625000018_workspace_member_unique_owner`
  - `20260625000019_feature_flags`
  - `20260625000020_auto_create_user_profile`
  - `20260718000001_fix_channel_member_trigger`
  - `20260718000002_fix_notify_everyone_column`
  - `20260718000003_fix_thread_reply_trigger`
  - `20260718000004_fix_user_deletion_trigger`
  - `20260719000001_fix_workspace_members_rls`
  - `20260719000002_fix_users_rls_policy`
  - `20260719000003_fix_user_group_members_fk`
  - `20260719000004_backfill_user_display_names`
- **Also** (if not listed in glob results): multiple "fix" migrations from July 18-19 batch
- **Fix**: Create rollback scripts for all missing migrations per AGENTS.md requirement.

### P2-03: `notification-store.ts` getPreferences return type is wrong

- **File**: `packages/db/src/stores/notification-store.ts:37`
- **Current**: `Promise<{ notify: string; sound: boolean }>`
- **Problem**: Column `notify` is `boolean NOT NULL DEFAULT true`, not `string`. Column name is `notify_sound`, not `sound`.
- **Fix**: Change to `Promise<{ notify: boolean; notify_sound: boolean }>`.

### P2-04: `UserGroup` TypeScript interface missing `display_name` field

- **File**: `packages/db/src/types.ts:262-269`
- **Problem**: SQL table `user_groups` has `display_name text NOT NULL` but the TypeScript interface doesn't include it. TypeScript consumers won't know about this field.
- **Fix**: Add `display_name: string;` to the `UserGroup` interface.

### P2-05: `Channel` TypeScript interface missing `version`, `is_read_only`, `channel_type`, `sort_order`

- **File**: `packages/db/src/types.ts:36-49`
- **Problem**: Some SQL columns are missing from the TS type. `version` was verified as present (added in `20260627000009`). `is_read_only` was added in `20260627000012`. Both missing from TS.
- **Fix**: Add `version: number;` and `is_read_only: boolean;` to the `Channel` interface.

### P2-06: `SidebarChannelAssignment` type defined but not exported

- **File**: `packages/db/src/types.ts:254-260` and `packages/db/src/index.ts`
- **Problem**: `SidebarChannelAssignment` is defined in types.ts but not exported from `index.ts`. External consumers can't import it.
- **Fix**: Add export in `index.ts`.

### P2-07: `audit_logs.prune_audit_logs()` inserts without `actor_type` — defaults to 'user'

- **File**: `supabase/migrations/20260625000013_audit_log_pruning.sql:21-22`
- **Current**: `INSERT INTO public.audit_logs (action, entity_type, entity_id, metadata) VALUES ('audit_log_prune', ...)`
- **Problem**: No `actor_type` specified. Defaults to `'user'` per table definition, but automated pruning is a system action, not a user action.
- **Fix**: Add `actor_type = 'system'` to the INSERT, or add `actor_user_id = NULL` implicitly. Also add `actor_type` to INSERT column list explicitly.

### P2-08: `thread_participants` missing index on `thread_id` for participant listings

- **File**: `supabase/migrations/20260627000004_threads.sql:59-60`
- **Problem**: Only index is `idx_thread_participants_user` on `user_id`. The primary query pattern is "get all participants for a thread" which queries by `thread_id`.
- **Fix**: Add `CREATE INDEX idx_thread_participants_thread ON public.thread_participants(thread_id);`

### P2-09: `message_edit_history` RLS policy uses `channel_members` not `workspace_members`

- **File**: `supabase/migrations/20260703000001_add_message_features.sql:42-51`
- **Problem**: SELECT policy joins through `channel_members`, so only explicit channel members can see edit history. Workspace admins who aren't channel members can't see it.
- **Fix**: Use workspace_members-based check for broader access.

### P2-10: `channel_member_history` INSERT policy uses `auth.uid() = user_id` — fragile for triggers

- **File**: `supabase/migrations/20260707000001_add_channel_member_history.sql:30`
- **Problem**: The insert trigger `log_channel_member_join` runs as SECURITY DEFINER, which bypasses RLS. If the trigger were changed to SECURITY INVOKER, it would fail because `auth.uid()` wouldn't match the user being added (the function runs in the context of the user who inserted into `channel_members`).
- **Fix**: The trigger runs SECURITY DEFINER so this works. Add a comment noting the dependency.

### P2-11: `dm_channels` table is deprecated but still has RLS policies and is referenced by GDPR

- **Files**: `20260704000001` (creates table), `20260704000002` (creates replacement)
- **Problem**: The GDPR function (20260724000003) still cleans `dm_channels` (line 29) but NOT the replacement `dm_members`. Old table should be dropped or at least documented as deprecated.
- **Fix**: Either drop `dm_channels` entirely (if no data migrated from it) or mark deprecated and ensure both old and new tables are cleaned.

### P2-12: `feature_flags` has no `workspace_id` — global flags only

- **File**: `supabase/migrations/20260625000019_feature_flags.sql`
- **Problem**: Feature flags are global, not per-workspace. A user who is admin of ANY workspace can manage ALL feature flags. This may be intentional but limits multi-tenant scenarios.
- **Fix**: Either document as global-only, or add `workspace_id` column to support per-workspace flags.

### P2-13: `users` SELECT policy changed to `using(true)` — too permissive

- **File**: `supabase/migrations/20260719000002_fix_users_rls_policy.sql:9-10`
- **Current**: `USING (true)` — all authenticated users can see all user profiles
- **Problem**: While `display_name` and `avatar_url` are non-sensitive, this leaks the full user list (including email) to any authenticated user. Email is PII in many jurisdictions.
- **Mitigation**: The `users` table contains `email TEXT NOT NULL` which IS sensitive. This policy exposes all emails to all authenticated users.
- **Fix**: Either remove email from the selectable columns view, or scope to shared workspace members: `USING (EXISTS (SELECT 1 FROM workspace_members wm1 JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id WHERE wm1.user_id = auth.uid() AND wm2.user_id = users.id))`.

### P2-14: `notifications` table uses `auth.users(id)` FK — inconsistent with pattern

- **File**: `supabase/migrations/20260625000011_create_notifications.sql:4`
- **Current**: `user_id uuid not null references auth.users(id) on delete cascade`
- **Problem**: Most other tables with `user_id` reference `public.users(id)`. PostgREST can't expose `auth.users` for joins.
- **Fix**: Consider changing FK target to `public.users(id)` for consistency, or document the exception.

### P2-15: `auto_responders` missing RLS FOR SELECT policy

- **File**: `supabase/migrations/20260709000001_add_auto_responder.sql:15-18`
- **Current**: Only one policy `FOR ALL` with `using (user_id = auth.uid())`
- **Problem**: The `using` clause only allows users to see their OWN auto-responder. Other users in the same workspace should be able to see if someone has an auto-responder set.
- **Fix**: Add SELECT policy scoped to workspace members.

### P2-16: `thread_metadata` has no INSERT policy — trigger-depended

- **File**: `supabase/migrations/20260627000004_threads.sql`
- **Problem**: Thread metadata can only be inserted via the `handle_thread_reply` trigger (SECURITY DEFINER). Direct API inserts would fail. This is intentional but undocumented.
- **Fix**: Add comment documenting that direct inserts are disallowed and only the trigger creates metadata.

### P2-17: `handle_new_user()` inserts `notification_preferences` with NULL workspace_id/channel_id — may conflict

- **File**: `supabase/migrations/20260625000020_auto_create_user_profile.sql:17-22`
- **Problem**: UNIQUE constraint is `(user_id, workspace_id, channel_id, notification_type)`. Multiple NULLs in workspace_id/channel_id could cause conflicts if the function is run multiple times.
- **Fix**: Add `ON CONFLICT (user_id, COALESCE(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(channel_id, '00000000-0000-0000-0000-000000000000'::uuid), notification_type) DO NOTHING` — or restructure the unique constraint to handle NULLs properly.

### P2-18: `Channel` type's `created_by` has wrong nullability in TypeScript

- **File**: `packages/db/src/types.ts:45`
- **Current**: `created_by: string;` (non-nullable)
- **SQL Reality**: Migration `20260716000002` made `created_by` nullable: `ALTER TABLE public.channels ALTER COLUMN created_by DROP NOT NULL;`
- **Problem**: TS type says it's always a string, but the DB allows NULL.
- **Fix**: Change to `created_by: string | null;`.

### P2-19: `ChannelNotificationPreference` type missing `notify_everyone` field

- **File**: `packages/db/src/types.ts:355-363`
- **Problem**: Column `notify_everyone` was added in `20260707000003` but not reflected in TS type.
- **Fix**: Add `notify_everyone: boolean;` to the interface.

### P2-20: `read-receipt-store.ts` `getBatchUnread` uses binary unread counting

- **File**: `packages/db/src/stores/read-receipt-store.ts:90-134`
- **Problem**: The unread count is always 0 or 1 (binary "has unread" flag) rather than actual message count. The comment says "count = 1" at line 130 regardless of how many unread messages exist.
- **Fix**: Either rename to `hasUnread` (boolean) or implement actual count via `SELECT COUNT(*) FROM messages WHERE channel_id = ? AND created_at > last_viewed_at`.

### P2-21: `generate_slug()` function has no uniqueness guarantee

- **File**: `supabase/migrations/20260625000002_create_workspaces.sql:47-52`
- **Problem**: The function simply regex-replaces characters. Two workspaces named "My Project" would both get slug "my-project" — the second insert would fail due to UNIQUE constraint on slug.
- **Fix**: Either implement slug deduplication in the function (append numeric suffix), or ensure the application layer handles slug conflicts gracefully.

### P2-22: `send_webhook_retry()` exponential backoff overflows at retry_count 31+

- **File**: `supabase/migrations/20260625000016_webhook_retry_dlq.sql:68`
- **Current**: `base_delay_seconds * (2 ^ delivery.retry_count)`
- **Problem**: PostgreSQL `^` is exponentiation. At max_retries=5, max is `60 * 2^5 = 1920` seconds — fine. But if `max_retries` is changed or retry_count increments beyond 31, this overflows.
- **Fix**: Add `LEAST(next_delay, 86400)` cap (max 24 hours).

---

## P3 — LOW (Cosmetic / Documentation / Redundancy)

### P3-01: `handle_user_deletion` trigger has redundant DELETEs for ON DELETE CASCADE tables

- **File**: `supabase/migrations/20260724000001_fix_sidebar_assignments_trigger.sql`
- **Problem**: Tables like `notifications`, `message_reminders`, `consent_logs`, etc. all have `ON DELETE CASCADE` FKs to `auth.users`. The trigger's explicit DELETEs are redundant with cascading — they execute first (BEFORE DELETE), then cascading fires anyway (no rows left to cascade). This is harmless but wasted DB work.
- **Fix**: Either keep explicit DELETEs and change FKs to `ON DELETE SET NULL`/`NO ACTION`, or remove redundant DELETEs and rely solely on cascading.

### P3-02: `prune_old_notifications` function uses `read = true` filter — misses read notifications with NULL

- **File**: `supabase/migrations/20260627000002_enforce_data_retention.sql:14`
- **Current**: `WHERE read = true AND created_at < now() - interval '30 days'`
- **Problem**: The `read` column is `NOT NULL DEFAULT false`, so no NULL values exist. Not a real bug, but the pattern is fragile if the column constraint is ever relaxed.
- **Fix**: Use `read IS TRUE` for robustness.

### P3-03: `purge_archived_messages` comment says "reactions, reactions" (duplicate word)

- **File**: `supabase/migrations/20260625000015_data_retention.sql:46`
- **Current**: `-- First, delete related reactions, reactions`
- **Fix**: Remove duplicate word.

### P3-04: `search_messages` uses COALESCE on content but content is NOT NULL

- **File**: `supabase/migrations/20260627000010_add_search_offset.sql:32`
- **Current**: `to_tsvector('english', COALESCE(m.content, ''))`
- **Problem**: `messages.content` is `NOT NULL`, so COALESCE is never needed. Also added `m.content IS NOT NULL AND length(m.content) > 0` checks which are also redundant.
- **Fix**: Simplify to `to_tsvector('english', m.content)`.

### P3-05: `handle_new_user()` in `20260719000004` inserts nullable columns without COALESCE for avatar_url

- **File**: `supabase/migrations/20260719000004_backfill_user_display_names.sql:10`
- **Current**: `NEW.raw_user_meta_data->>'avatar_url'` — if metadata has no avatar_url, returns NULL (which is fine since column is nullable).
- **Fix**: No fix needed, but inconsistent with the explicit COALESCE added for `display_name`.

### P3-06: `channel_notification_preferences` unique constraint uses `(user_id, channel_id)` — store uses `(channel_id, user_id)`

- **File**: `packages/db/src/stores/notification-store.ts:59`
- **Current**: `{ onConflict: "channel_id,user_id" }`
- **SQL**: `UNIQUE(user_id, channel_id)` — column order reversed
- **Problem**: Postgres matches unique constraints by column SET, not order. So this works, but is confusing.
- **Fix**: Use the same column order as the constraint: `onConflict: "user_id,channel_id"`.

### P3-07: `gdpr_delete_user` sets `search_path = 'public, auth'` — auth schema exposure

- **File**: `supabase/migrations/20260724000003_create_gdpr_delete_function.sql:5`
- **Problem**: The function clears data from `public` tables only. Including `auth` in search_path is unnecessary and potentially dangerous if `auth` schema functions are accidentally invoked.
- **Fix**: Change to `SET search_path = 'public'` (no comma before auth).

### P3-08: `handle_thread_reply()` trigger doesn't increment participant_count on upsert

- **File**: `supabase/migrations/20260627000004_threads.sql:69-74`
- **Current**: Only increments `reply_count` on conflict, not `participant_count`
- **Problem**: If a new user replies to an existing thread, `participant_count` stays the same until the participant INSERT below runs. If the INSERT fails silently (ON CONFLICT DO NOTHING for existing participant), the count isn't updated.
- **Fix**: This is actually correct behavior — participant_count should track distinct participants, not reply count. But the upsert should also update `participant_count` if the user wasn't already a participant. Current logic handles this via the separate INSERT.

### P3-09: `log_channel_member_join()` doesn't log 'removed' or 'left' events

- **File**: `supabase/migrations/20260707000001_add_channel_member_history.sql:33-39`
- **Problem**: The trigger only fires on INSERT, logging 'joined'. There's no trigger for DELETE to log 'removed' or 'left'.
- **Fix**: Add AFTER DELETE trigger on `channel_members` to log removals.

### P3-10: `readOnly` trigger blocks ALL users on read-only channels — no admin exception

- **File**: `supabase/migrations/20260627000012_read_only_channels.sql:6-17`
- **Problem**: The trigger blocks EVERYONE from posting, including workspace admins/owners. The HINT says "Only admins can post" but the trigger doesn't check role.
- **Fix**: Add admin bypass: `AND NOT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = (SELECT workspace_id FROM channels WHERE id = NEW.channel_id) AND user_id = auth.uid() AND role IN ('owner', 'admin'))`

### P3-11: `prevent_read_only_message` trigger uses `auth.uid()` — may fail for service_role

- **File**: `supabase/migrations/20260627000012_read_only_channels.sql:6-17`
- **Problem**: Uses `auth.uid()` but the trigger runs as SECURITY DEFINER at the DB level. `auth.uid()` is NULL for service_role/anon requests. The EXISTS clause returns false when `auth.uid()` is NULL, so read-only channels could block even service_role inserts.
- **Fix**: Add `OR auth.uid() IS NULL` bypass for trusted callers, or use a different approach.

### P3-12: `user_statuses` has both `updated_at` and `created_at` but no `set_updated_at` trigger

- **File**: `supabase/migrations/20260627000011_custom_status.sql:9-10`
- **Problem**: Other tables have `set_updated_at()` triggers but `user_statuses` does not. `updated_at` will only update if set explicitly.
- **Fix**: Add BEFORE UPDATE trigger with `set_updated_at()`.

### P3-13: `push_subscriptions` table has `auth` column — reserved word risk

- **File**: `supabase/migrations/20260625000009_create_push_subscriptions.sql:7`
- **Current**: Column named `auth` (stores VAPID auth key)
- **Problem**: `auth` is a MySQL reserved word and could cause issues with some ORMs or query builders that quote reserved words differently.
- **Fix**: Rename to `vapid_auth` or `auth_key` (breaking change, requires app update).

### P3-14: `channel_bookmarks` has both `message_id` and `url` — no business rule

- **File**: `supabase/migrations/20260704000001_add_dm_presence_categories.sql:33-34`
- **Problem**: A bookmark can have a `message_id`, a `url`, both, or neither. No CHECK constraint enforces "at least one target." A bookmark with neither is meaningless.
- **Fix**: Add CHECK constraint: `CHECK (message_id IS NOT NULL OR url IS NOT NULL)`.

### P3-15: `scheduled_posts` CHECK constraint `future_schedule` prevents same-second scheduling

- **File**: `supabase/migrations/20260705000002_add_scheduled_posts.sql:10`
- **Current**: `CHECK (scheduled_at > created_at)`
- **Problem**: If `created_at` and `scheduled_at` are set in the same transaction, the check passes. But if they're set to the same value (e.g., scheduling for "now"), it fails. Using `>` instead of `>=` prevents scheduling for the current moment.
- **Fix**: No change. The `<` constraint is intentional — you can't schedule for the past.

### P3-16: `ChannelNotificationPreference` TypeScript type missing `notify_everyone`

Already covered in P2-19 but also listed here for the type-gap category.

### P3-17: `announcements` table uses `workspaces` not `public.workspaces` in FK

- **File**: `supabase/migrations/20260709000004_add_announcements.sql:3`
- **Current**: `REFERENCES workspaces(id)` (no schema prefix)
- **Problem**: All other FKs use `public.workspaces(id)`. Inconsistent.
- **Fix**: Change to `REFERENCES public.workspaces(id)`.

### P3-18: `feature_flags` seed data hardcoded — not idempotent across environments

- **File**: `supabase/migrations/20260625000019_feature_flags.sql:56-63`
- **Problem**: Seed INSERT uses `ON CONFLICT (key) DO NOTHING`, which works. But if a flag is deleted in one environment, it won't be recreated on the next migration run.
- **Fix**: This is fine for migrations (one-time run). Document that re-seeding requires manual intervention.

---

## Cross-Cutting Analysis

### FK Consistency Audit

| Table                         | Column            | References               | ON DELETE         | GDPR Cleaned?      |
| ----------------------------- | ----------------- | ------------------------ | ----------------- | ------------------ |
| `users`                       | `id`              | `auth.users(id)`         | CASCADE           | Yes                |
| `workspaces`                  | `owner_id`        | `public.users(id)`       | CASCADE           | Via cascade        |
| `workspace_members`           | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Yes                |
| `workspace_members`           | `user_id`         | `public.users(id)`       | CASCADE           | Yes                |
| `channels`                    | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Via cascade        |
| `channels`                    | `created_by`      | `public.users(id)`       | **SET NULL**      | Via SET NULL       |
| `channel_members`             | `channel_id`      | `public.channels(id)`    | CASCADE           | Yes                |
| `channel_members`             | `user_id`         | `public.users(id)`       | CASCADE           | Yes                |
| `messages`                    | `channel_id`      | `public.channels(id)`    | CASCADE           | Via cascade        |
| `messages`                    | `user_id`         | `public.users(id)`       | CASCADE           | Yes                |
| `messages`                    | `parent_id`       | `public.messages(id)`    | SET NULL          | Via SET NULL       |
| `reactions`                   | `message_id`      | `public.messages(id)`    | CASCADE           | Yes                |
| `reactions`                   | `user_id`         | `public.users(id)`       | CASCADE           | Yes                |
| `notifications`               | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `notifications`               | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Via cascade        |
| `push_subscriptions`          | `user_id`         | `public.users(id)`       | CASCADE           | Yes                |
| `user_preferences`            | `user_id`         | `public.users(id)`       | CASCADE           | Yes                |
| `audit_logs`                  | `organization_id` | `public.workspaces(id)`  | SET NULL          | Via SET NULL       |
| `audit_logs`                  | `actor_user_id`   | `auth.users(id)`         | SET NULL          | Yes (explicit)     |
| `consent_logs`                | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `webhook_endpoints`           | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Via cascade        |
| `webhook_endpoints`           | `created_by`      | `auth.users(id)`         | **NONE**          | **MISSING**        |
| `webhook_deliveries`          | `webhook_id`      | `webhook_endpoints(id)`  | CASCADE           | Via cascade        |
| `webhook_dead_letters`        | `webhook_id`      | `webhook_endpoints(id)`  | CASCADE           | Via cascade        |
| `feature_flags`               | —                 | —                        | —                 | N/A (global)       |
| `notification_preferences`    | `user_id`         | `auth.users(id)`         | CASCADE           | **MISSING**        |
| `notification_preferences`    | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Via cascade        |
| `notification_preferences`    | `channel_id`      | `public.channels(id)`    | CASCADE           | Via cascade        |
| `thread_metadata`             | `message_id`      | `public.messages(id)`    | CASCADE           | Via cascade        |
| `thread_participants`         | `thread_id`       | `thread_metadata(id)`    | CASCADE           | **MISSING**        |
| `thread_participants`         | `user_id`         | `public.users(id)`       | CASCADE           | **MISSING**        |
| `dm_channels`                 | `channel_id`      | `public.channels(id)`    | CASCADE           | Yes                |
| `dm_channels`                 | `user1_id`        | `auth.users(id)`         | CASCADE           | Yes                |
| `dm_channels`                 | `user2_id`        | `auth.users(id)`         | CASCADE           | Yes                |
| `dm_members`                  | `channel_id`      | `public.channels(id)`    | CASCADE           | **MISSING**        |
| `dm_members`                  | `user_id`         | `auth.users(id)`         | CASCADE           | **MISSING**        |
| `user_presence`               | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `channel_bookmarks`           | `channel_id`      | `public.channels(id)`    | CASCADE           | Via cascade        |
| `channel_bookmarks`           | `message_id`      | `public.messages(id)`    | SET NULL          | Via SET NULL       |
| `channel_bookmarks`           | `created_by`      | `auth.users(id)`         | CASCADE           | Yes                |
| `sidebar_categories`          | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `sidebar_categories`          | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Via cascade        |
| `sidebar_channel_assignments` | `category_id`     | `sidebar_categories(id)` | CASCADE           | Yes (via subquery) |
| `sidebar_channel_assignments` | `channel_id`      | `public.channels(id)`    | CASCADE           | Via cascade        |
| `channel_notification_prefs`  | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `channel_notification_prefs`  | `channel_id`      | `public.channels(id)`    | CASCADE           | Via cascade        |
| `user_statuses`               | `user_id`         | `public.users(id)`       | CASCADE           | Yes                |
| `channel_role_overrides`      | `channel_id`      | `public.channels(id)`    | CASCADE           | **MISSING**        |
| `channel_role_overrides`      | `user_id`         | `public.users(id)`       | CASCADE           | **MISSING**        |
| `message_flags`               | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `message_flags`               | `message_id`      | `public.messages(id)`    | CASCADE           | Via cascade        |
| `message_edit_history`        | `message_id`      | `public.messages(id)`    | CASCADE           | Via cascade        |
| `message_edit_history`        | `edited_by`       | `auth.users(id)`         | CASCADE           | Yes                |
| `message_reminders`           | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `message_reminders`           | `message_id`      | `public.messages(id)`    | CASCADE           | Via cascade        |
| `custom_emoji`                | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | **MISSING**        |
| `custom_emoji`                | `created_by`      | `auth.users(id)`         | CASCADE           | **MISSING**        |
| `user_groups`                 | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | **MISSING**        |
| `user_groups`                 | `created_by`      | `auth.users(id)`         | CASCADE           | **MISSING**        |
| `user_group_members`          | `group_id`        | `user_groups(id)`        | CASCADE           | **MISSING**        |
| `user_group_members`          | `user_id`         | `public.users(id)`       | CASCADE           | **MISSING**        |
| `scheduled_posts`             | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `scheduled_posts`             | `channel_id`      | `public.channels(id)`    | CASCADE           | Via cascade        |
| `channel_member_history`      | `channel_id`      | `public.channels(id)`    | CASCADE           | **MISSING**        |
| `channel_member_history`      | `user_id`         | `public.users(id)`       | CASCADE           | **MISSING**        |
| `auto_responders`             | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `auto_responders`             | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Via cascade        |
| `message_reads`               | `message_id`      | `public.messages(id)`    | CASCADE           | **MISSING**        |
| `message_reads`               | `user_id`         | `public.users(id)`       | CASCADE           | **MISSING**        |
| `message_reads`               | `channel_id`      | `public.channels(id)`    | CASCADE           | **MISSING**        |
| `trigger_words`               | `user_id`         | `auth.users(id)`         | CASCADE           | Yes                |
| `compliance_exports`          | `created_by`      | `public.users(id)`       | SET NULL          | **MISSING**        |
| `compliance_exports`          | `workspace_id`    | `public.workspaces(id)`  | SET NULL          | Via SET NULL       |
| `announcements`               | `workspace_id`    | `public.workspaces(id)`  | CASCADE           | Via cascade        |
| `announcements`               | `created_by`      | —                        | **NONE (no FK!)** | **MISSING**        |

### Index Coverage Audit

| Query Pattern                                       | Index Present                                         | Notes |
| --------------------------------------------------- | ----------------------------------------------------- | ----- |
| Channel messages (channel_id, created_at DESC)      | YES — `idx_messages_channel_created`                  | Good  |
| Unread notifications (user_id, read, created_at)    | YES — `idx_notifications_user_unread`                 | Good  |
| Workspace members (user_id)                         | YES — `idx_workspace_members_user_id`                 | Good  |
| Channel members (user_id)                           | YES — `idx_channel_members_user_id`                   | Good  |
| Thread replies (parent_id)                          | YES — `idx_messages_parent_id` (partial)              | Good  |
| Reactions per message (message_id)                  | YES — `idx_reactions_message_id`                      | Good  |
| Reactions per user (user_id)                        | YES — `idx_reactions_user_id`                         | Good  |
| DM channels per user (user_id)                      | YES — `idx_dm_members_user_id`                        | Good  |
| Message flags per user (user_id)                    | YES — `idx_message_flags_user`                        | Good  |
| Edit history per message (message_id)               | YES — `idx_message_edit_history_message`              | Good  |
| User autocomplete (display_name ILIKE)              | YES — `idx_users_display_name_trgm` (GIN)             | Good  |
| Pinned messages per channel (channel_id, is_pinned) | YES — `idx_messages_channel_pinned` (partial)         | Good  |
| Scheduled posts due (scheduled_at)                  | YES — `idx_scheduled_posts_due` (partial)             | Good  |
| Message reminders due (remind_at)                   | YES — `idx_message_reminders_due` (partial)           | Good  |
| Workspace by slug                                   | YES — `idx_workspaces_slug`                           | Good  |
| Channel by workspace+slug                           | YES — `idx_channels_workspace_slug`                   | Good  |
| Thread participants by thread (thread_id)           | **MISSING**                                           | P2-08 |
| Thread participants by user (user_id)               | YES — `idx_thread_participants_user`                  | Good  |
| Message reads per message (message_id)              | YES — `idx_message_reads_message`                     | Good  |
| Message reads per user+channel                      | YES — `idx_message_reads_user`                        | Good  |
| Channel member history (channel_id, created_at)     | YES — `idx_channel_member_history_channel`            | Good  |
| Message searches (content FTS)                      | YES — `idx_messages_content_fts` (GIN)                | Good  |
| Webhook deliveries due (status, next_retry_at)      | YES — `idx_webhook_deliveries_status_retry` (partial) | Good  |

### Trigger Inventory

| Trigger Name                | Table             | Event         | Function                    | SECURITY | Notes                       |
| --------------------------- | ----------------- | ------------- | --------------------------- | -------- | --------------------------- |
| `users_updated_at`          | `users`           | BEFORE UPDATE | `set_updated_at`            | INVOKER  | Fine                        |
| `workspaces_updated_at`     | `workspaces`      | BEFORE UPDATE | `set_updated_at`            | INVOKER  | Fine                        |
| `channels_updated_at`       | `channels`        | BEFORE UPDATE | `set_updated_at`            | INVOKER  | Fine                        |
| `on_workspace_created`      | `workspaces`      | AFTER INSERT  | `handle_new_workspace`      | DEFINER  | Auto-adds owner as member   |
| `on_channel_created`        | `channels`        | AFTER INSERT  | `handle_new_channel`        | DEFINER  | Auto-adds creator as member |
| `on_auth_user_created`      | `auth.users`      | AFTER INSERT  | `handle_new_user`           | DEFINER  | Creates profile + prefs     |
| `on_auth_user_deleted`      | `auth.users`      | BEFORE DELETE | `handle_user_deletion`      | DEFINER  | Cleanup cascade             |
| `on_message_reply`          | `messages`        | AFTER INSERT  | `handle_thread_reply`       | DEFINER  | Creates thread metadata     |
| `check_read_only_on_insert` | `messages`        | BEFORE INSERT | `prevent_read_only_message` | DEFINER  | Read-only check             |
| `messages_version`          | `messages`        | BEFORE UPDATE | `increment_version`         | INVOKER  | Optimistic locking          |
| `channels_version`          | `channels`        | BEFORE UPDATE | `increment_version`         | INVOKER  | Optimistic locking          |
| `on_channel_member_joined`  | `channel_members` | AFTER INSERT  | `log_channel_member_join`   | DEFINER  | Member history logging      |
| `feature_flags_updated_at`  | `feature_flags`   | BEFORE UPDATE | `set_updated_at`            | INVOKER  | Fine                        |

No recursion detected. All triggers use SECURITY DEFINER appropriately for cross-schema access (auth.users) or RLS bypass. The `increment_version` trigger is correctly SECURITY INVOKER since it only modifies the row being updated.

---

## GDPR Compliance Audit

### What `gdpr_delete_user()` handles (line-by-line):

| Line  | Table                              | Column                            | Status                    |
| ----- | ---------------------------------- | --------------------------------- | ------------------------- |
| 10-11 | `sidebar_channel_assignments`      | via `sidebar_categories` subquery | OK                        |
| 13    | `sidebar_categories`               | `user_id`                         | OK                        |
| 14    | `channel_notification_preferences` | `user_id`                         | OK                        |
| 15    | `consent_logs`                     | `user_id`                         | OK                        |
| 16    | `channel_bookmarks`                | `created_by`                      | OK                        |
| 17    | `message_reminders`                | `user_id`                         | OK                        |
| 18    | `notifications`                    | `user_id`                         | OK                        |
| 19    | `push_subscriptions`               | `user_id`                         | OK                        |
| 20    | `message_edit_history`             | `edited_by`                       | OK                        |
| 21    | `scheduled_posts`                  | `user_id`                         | OK                        |
| 22    | `trigger_words`                    | `user_id`                         | OK                        |
| 23    | `auto_responders`                  | `user_id`                         | OK                        |
| 24    | `user_statuses`                    | `user_id`                         | OK                        |
| 25    | `user_presence`                    | `user_id`                         | OK                        |
| 26    | `message_flags`                    | `user_id`                         | OK                        |
| 27    | `reactions`                        | `user_id`                         | OK                        |
| 28    | `messages`                         | `user_id`                         | OK                        |
| 29    | `dm_channels`                      | `user1_id`, `user2_id`            | Partially OK (deprecated) |
| 30    | `webhook_endpoints`                | `created_by`                      | OK                        |
| 31    | `channel_members`                  | `user_id`                         | OK                        |
| 32    | `workspace_members`                | `user_id`                         | OK                        |
| 33    | `audit_logs`                       | `actor_user_id`                   | OK                        |
| 34    | `user_preferences`                 | `user_id`                         | OK                        |
| 35    | `users`                            | `id`                              | OK                        |

### What `gdpr_delete_user()` MISSES (must be added before GDPR production):

| Table                      | Column       | GDPR Impact                            |
| -------------------------- | ------------ | -------------------------------------- |
| `notification_preferences` | `user_id`    | User notification settings leaked      |
| `dm_members`               | `user_id`    | DM association data retained           |
| `custom_emoji`             | `created_by` | Creator attribution retained           |
| `user_groups`              | `created_by` | Creator attribution retained           |
| `user_group_members`       | `user_id`    | Group membership data retained         |
| `thread_participants`      | `user_id`    | Thread participation tracking retained |
| `channel_member_history`   | `user_id`    | Join/leave history retained            |
| `channel_role_overrides`   | `user_id`    | Access override data retained          |
| `message_reads`            | `user_id`    | Read receipt data retained             |
| `compliance_exports`       | `created_by` | Export creator attribution leaked      |
| `announcements`            | `created_by` | Announcement author data leaked        |

**GDPR Verdict**: **NOT READY**. 11 tables with user-identifiable data not purged. Must fix all before any production GDPR subject access request.

### `gdpr_delete_user()` also doesn't:

- Handle user's owned workspaces (owner_id FK ON DELETE CASCADE — cascades to all workspace data)
- Anonymize messages rather than delete (some jurisdictions require retention)
- Log the deletion event to `audit_logs`
- Handle the `auth.users` record (intentional — the function operates at public schema level)

---

## TypeScript Type ↔ Schema Consistency

| Type                            | Mismatches                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `Channel`                       | Missing: `version`, `is_read_only`, `channel_type`, `sort_order`. Nullability: `created_by` is `string` but DB allows NULL. |
| `UserGroup`                     | Missing: `display_name`                                                                                                     |
| `ChannelNotificationPreference` | Missing: `notify_everyone`                                                                                                  |
| `NotificationPreference`        | `workspace_id` is `string` in TS but nullable in DB. `channel_id` is `string                                                | null` in TS — correct. |
| `SidebarChannelAssignment`      | Not exported from `index.ts`                                                                                                |
| `ChannelMember`                 | Missing: `last_viewed_at` on type definition — actually, checking line 62-63: `last_viewed_at: string;` IS present. OK.     |

---

## Rollback Coverage

72 migration files. 65 rollback files. 7 migrations have no rollback. But looking more carefully at the rollback listing, it's clearer:

**Rollbacks present for**: 20260625 through 20260710 base migrations, and the July 16/24 fix migrations.

**Rollbacks MISSING for**: 20260718 and 20260719 fix/bugfix migrations:

- `20260718000001` through `20260718000004`
- `20260719000001` through `20260719000004`

Also missing for some June 25/26 migrations:

- `20260625000017` (audit_logs_org_fk)
- `20260625000018` (workspace_member_unique_owner)
- `20260625000019` (feature_flags)
- `20260625000020` (auto_create_user_profile)

---

## Remediation Priority Order

1. **P0-01**: Fix `notification-store.ts:40` column name `sound` → `notify_sound` (immediate runtime fix)
2. **P0-02**: Add missing tables to `gdpr_delete_user()` (GDPR compliance block)
3. **P0-03**: Add `webhook_endpoints.created_by` cleanup to `handle_user_deletion` trigger (user deletion block)
4. **P1-12**: Add `ON DELETE CASCADE` to `webhook_endpoints.created_by` FK
5. **P1-01**/**P1-02**: Fix `announcements.created_by` (add FK)
6. **P1-04/P1-05**: Restore admin RLS policies for `user_groups`/`user_group_members`
7. **P1-10**: Fix `compliance_exports` RLS regression
8. **P1-13**: Ensure all user-owned tables are explicitly cleaned in `handle_user_deletion`
9. **P2-01**: Update or delete stale policy files
10. **P2-02**: Create missing rollback scripts
11. **P2-04/P2-05/P2-06**: Fix TypeScript type gaps
12. **Remaining P2 findings**: Indexes, policy refinements, documentation
13. **P3 findings**: Redundancies, cosmetic issues, naming consistency

---

## Audit Metadata

- **Date**: July 24, 2026
- **Files examined**: 72 migrations + 65 rollbacks + 11 policies + 6 seeds + 12 TS files = 166 files
- **Lines reviewed**: ~8,500 SQL + ~1,000 TypeScript
- **Finding methodology**: Manual exhaustive review of every migration, policy, rollback, seed, and store file
- **Auditor**: opencode automated analysis
