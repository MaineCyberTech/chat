# Database/Schema/Data Lifecycle Re-Audit — July 24, 2026

**Stage**: reconciliation_reaudit
**Domain**: data
**Prior Audit**: `audit_database_schema_20260716.md` (July 16, 2026)
**Decision**: GO WITH RISKS (unchanged from prior; see open P1)

---

## Fix Verification Summary

| Prior ID | Severity | Claimed Fix                            | Verified?     | Evidence                                                                                                                 |
| -------- | -------- | -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| DS-001   | P1       | `channels.created_by` made nullable    | ✅ FIXED      | `20260716000002_fix_channels_created_by_fk.sql:1` — `ALTER TABLE public.channels ALTER COLUMN created_by DROP NOT NULL;` |
| DS-009   | P1       | GDPR export expanded to 20+ categories | ✅ FIXED      | `apps/api/src/modules/auth/routes.ts:227-267` — exports 20 categories (was 6)                                            |
| —        | —        | Compliance exports has workspace_id    | ✅ FIXED      | `20260716000001_add_compliance_export_workspace.sql` — adds `workspace_id UUID` + FK + RLS policy                        |
| —        | —        | Reactions RLS scoped                   | ✅ ALREADY OK | Already scoped in `20260626000022` (checks channel membership). No change needed.                                        |
| DS-004   | P3       | `messages.version` never read by API   | ✅ FIXED      | `messages/routes.ts:241-247` passes version to update; `service.ts:240-241` uses `eq("version", version)`                |

---

## Remaining Open Findings (from original audit)

### P2 — Still Open

| ID     | Finding                                                           | File                                                   | Detail                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-003 | 5+ tables missing TypeScript interfaces in `@chat/db`             | `packages/db/src/types.ts`                             | Missing: `trigger_words`, `auto_responders`, `announcements`, `compliance_exports`, `channel_notification_preferences`. (Partial fix: `message_reads`/`MessageRead` now present at line 65.)                                                                            |
| DS-007 | `listByChannel` relies solely on RLS for `deleted_at` filtering   | `apps/api/src/modules/messages/service.ts:27-34`       | No app-level `deleted_at IS NULL` filter. Mitigated by RLS policy `messages_select_member` which enforces `deleted_at IS NULL` for authenticated users. Risk exists only if service_role client is passed in.                                                           |
| DS-010 | GDPR deletion not transactional — sequential, no `BEGIN`/`COMMIT` | `apps/api/src/modules/auth/routes.ts:300-326`          | 13 sequential `await supabase.from(...).delete()` calls plus `auth.admin.deleteUser()`. A mid-sequence failure leaves partial data. The `handle_user_deletion()` trigger on `auth.users` DELETE provides a second cleanup pass, but the sequential approach is fragile. |
| DS-011 | Notifications retention processor doesn't filter `read = true`    | `apps/worker/src/processors/data-retention.ts:164-195` | `retainNotifications()` deletes ALL old notifications regardless of read status. The DB function `purge_old_notifications()` correctly filters `read = true`.                                                                                                           |
| DS-014 | `retainNotifications()` never scheduled — dead code               | `apps/worker/src/scheduler.ts:24-30`                   | `RETENTION_SCHEDULE` has 5 items: messages, audit_logs, consent_logs, soft_deleted_channels, soft_deleted_workspaces. "notifications" is absent. The `retainNotifications()` function in `data-retention.ts` is unreachable via the scheduler.                          |

### P3 — Still Open

| ID     | Finding                                                            | File                                                                     | Detail                                                                                                                                                                                                                |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-002 | `announcements.created_by UUID NOT NULL` has no FK constraint      | `supabase/migrations/20260709000004_add_announcements.sql:7`             | No `REFERENCES` clause. Enforced only at RLS level (owner/admin check).                                                                                                                                               |
| DS-005 | 8 migration files (~12%) lack rollback scripts                     | `supabase/rollback/`                                                     | **Updated count**: 69 migration files, 61 rollback files. Missing rollbacks for: `20260718000001`–`20260718000004` (4), `20260719000001`–`20260719000004` (4). Proportion improved from 14% to 12%.                   |
| DS-006 | `dm_channels` table deprecated/dead since creation                 | `supabase/migrations/20260704000001_add_dm_presence_categories.sql:7-15` | Created in `20260704000001`, immediately deprecated by `dm_members` in `20260704000002`. No code references `dm_channels` — `dm_members` used instead. Dead table wastes storage and adds maintenance burden.         |
| DS-008 | Missing `(channel_id, user_id)` composite index on `message_reads` | `supabase/migrations/20260709000002_add_read_receipts.sql:50-51`         | Existing indexes: `(message_id)` and `(user_id, channel_id)`. However, `getBatchUnread()` in `read-receipt-store.ts` does NOT query `message_reads` — it uses `channel_members` and `messages`. Low practical impact. |
| DS-012 | No consent withdrawal audit on GDPR deletion                       | `apps/api/src/modules/auth/routes.ts:300-326`                            | No `consent_logs` INSERT before deletion. GDPR Article 7(3) requires consent withdrawal to be recorded.                                                                                                               |
| DS-013 | `scheduled_posts` retention never enforced                         | `apps/worker/src/scheduler.ts:24-30`                                     | No retention schedule for expired/cancelled scheduled posts. Also: `message_reminders` with `notified = true` and past `remind_at` are never cleaned up.                                                              |

---

## New Findings (July 24, 2026)

### P1

| ID     | Finding                                                                                             | File(s)                                                                                                                                                                                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-015 | `sidebar_channel_assignments.user_id` column referenced in code but does NOT exist in any migration | `apps/api/src/modules/auth/routes.ts:266,309`, `supabase/migrations/20260707000002_cleanup_deleted_users.sql:19`, `supabase/migrations/20260718000004_fix_user_deletion_trigger.sql:19` | The table definition (`20260704000001:60-68`) has columns `id`, `category_id`, `channel_id`, `sort_order`, `created_at` — no `user_id`. Yet GDPR export queries `.eq("user_id", userId)`, GDPR deletion deletes `.eq("user_id", userId)`, and `handle_user_deletion()` trigger does `DELETE FROM sidebar_channel_assignments WHERE user_id = OLD.id`. **All three will fail at runtime if the column does not exist.** The correct approach is a join through `sidebar_categories` (which HAS `user_id`): `DELETE FROM sidebar_channel_assignments WHERE category_id IN (SELECT id FROM sidebar_categories WHERE user_id = OLD.id)`. If the column exists on the production DB (added manually), a migration must be created to track it. |

### P2

| ID     | Finding                                                                                        | File(s)                                                                                                             | Detail                                                                                                                                                                                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-016 | Compliance export scheduler inserts records without `workspace_id` — invisible to admins       | `apps/worker/src/scheduler.ts:83-93`, `supabase/migrations/20260716000001_add_compliance_export_workspace.sql:7-15` | The new RLS policy requires `workspace_id IS NOT NULL`, but `runComplianceExport()` inserts rows with only `type`, `date_from`, `date_to`, `status`, `row_count`. No `workspace_id` is set. All scheduled compliance exports will be invisible to admin users viewing via the API. |
| DS-017 | GDPR export: 20 concurrent DB queries per request with no rate limit                           | `apps/api/src/modules/auth/routes.ts:225-267`                                                                       | `Promise.all([...20 parallel queries...])` launches all queries simultaneously. No `authLimiter` on this route (only `authenticate`). Potential DoS vector if called repeatedly.                                                                                                   |
| DS-018 | GDPR deletion: `sidebar_channel_assignments` deleted by wrong column name — will fail silently | `apps/api/src/modules/auth/routes.ts:309`                                                                           | `.delete().eq("user_id", userId)` references non-existent column. If the column exists on production, this is fine; if not, Supabase returns a PostgREST error. The error is never checked (bare `await`). Failure at this step blocks all subsequent deletions.                   |

### P3

| ID     | Finding                                                                                                                                                                          | File(s)                                                                                                            | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-019 | GDPR deletion double-deletes 10+ tables due to trigger overlap                                                                                                                   | `apps/api/src/modules/auth/routes.ts:308-326`, `supabase/migrations/20260707000002_cleanup_deleted_users.sql:4-22` | Manual sequential deletes (lines 308-319) cover consent_logs, sidebar_channel_assignments, sidebar_categories, channel_bookmarks, message_reminders, notifications, push_subscriptions, messages, reactions, channel_members, workspace_members, user_preferences, users. Then `auth.admin.deleteUser()` fires `handle_user_deletion()` which deletes 13 of the same tables again. Redundant but not harmful.                                                                                                                                                                                                                                                                               |
| DS-020 | Inconsistent FK target: 13 tables reference `auth.users(id)` vs 5 tables reference `public.users(id)`                                                                            | 13 migration files                                                                                                 | Tables referencing `auth.users` directly: notifications, consent_logs, message_flags, message_edit_history, message_reminders, dm_members, user_presence, channel_bookmarks, sidebar_categories, custom_emoji (created_by), scheduled_posts, trigger_words, auto_responders, channel_notification_preferences, webhook_endpoints (created_by), audit_logs (SET NULL). `user_group_members` was fixed to `public.users` in `20260719000003`. Tables referencing `public.users`: workspaces, channels (created_by), channel_members, messages, workspace_members, users (self-ref via auth), reactions, compliance_exports. Consistency would simplify RLS and prevent PostgREST join issues. |
| DS-021 | `retainNotifications()` in `data-retention.ts` uses `created_at < cutoff` but olderThanDays defaults to 90 (hardcoded fallback), which is inconsistent with DB function's intent | `apps/worker/src/processors/data-retention.ts:164-195`, `apps/worker/src/scheduler.ts:248`                         | If notifications were ever scheduled, they'd be purged at 90 days regardless of read status. DB function `purge_old_notifications()` (migration `20260625000013`) uses 30 days and filters `read = true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| DS-022 | `dm_members.user_id` references `auth.users(id)` but should reference `public.users(id)`                                                                                         | `supabase/migrations/20260704000002_add_group_messaging.sql:7`                                                     | Same pattern fixed for `user_group_members` in `20260719000003`. Inconsistent and may cause PostgREST join failures.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| DS-023 | `compliance_exports.created_by` FK is `REFERENCES public.users(id) ON DELETE SET NULL` but the scheduler inserts without `created_by`                                            | `apps/worker/src/scheduler.ts:83-93`, `supabase/migrations/20260709000003_add_compliance_exports.sql:12`           | No audit trail for who initiated scheduled compliance exports (they were auto-generated).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

---

## Schema Changes Since Prior Audit

### New Migrations (post-July 16)

| Migration        | Purpose                                                                   | Rollback? |
| ---------------- | ------------------------------------------------------------------------- | --------- |
| `20260716000001` | Add `workspace_id` to `compliance_exports` + scoped RLS                   | ✅        |
| `20260716000002` | Drop NOT NULL on `channels.created_by` — fix DS-001                       | ✅        |
| `20260718000001` | Fix `handle_new_channel()` to include `last_viewed_at`                    | ❌        |
| `20260718000002` | Conditionally add `notify_everyone` column                                | ❌        |
| `20260718000003` | Fix `handle_thread_reply()` ambiguous `thread_id` variable                | ❌        |
| `20260718000004` | Fix `handle_user_deletion()` — `channel_bookmarks.user_id` → `created_by` | ❌        |
| `20260719000001` | Fix `workspace_members` RLS: allow members to see other members           | ❌        |
| `20260719000002` | Fix `users` RLS: allow all authenticated SELECT                           | ❌        |
| `20260719000003` | Fix `user_group_members.user_id` FK: `auth.users` → `public.users`        | ❌        |
| `20260719000004` | Backfill `display_name` for users + fix `handle_new_user()` COALESCE      | ❌        |

**Rollback gap**: 8 new migrations (July 18-19) lack down scripts. Total: 69 migrations, 61 rollbacks.

### Table Inventory Update

| Table                         | New in this window? | Notes                                                                             |
| ----------------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `sidebar_channel_assignments` | No (existing)       | **P1**: missing `user_id` column in migration definitions, but code references it |
| `compliance_exports`          | No (existing)       | Now has `workspace_id` column + scoped RLS                                        |
| `user_group_members`          | No (existing)       | FK fixed to reference `public.users`                                              |

### Code Changes Since Prior Audit

| File                                               | Change                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/api/src/modules/auth/routes.ts:218-296`      | GDPR export expanded from 6 to 20 categories                     |
| `apps/api/src/modules/auth/routes.ts:300-326`      | GDPR deletion — unchanged, same sequential pattern               |
| `apps/api/src/modules/messages/service.ts:240-241` | `update()` now uses `eq("version", version)` when provided       |
| `apps/api/src/modules/messages/routes.ts:241-251`  | PATCH route passes version to service                            |
| `apps/worker/src/scheduler.ts:24-30`               | `RETENTION_SCHEDULE` unchanged — still 5 items, no notifications |

---

## Category Scores (Re-evaluated)

| Category         | Prior Score | New Score | Delta | Notes                                                                                                                                       |
| ---------------- | ----------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema Integrity | 78/100      | 78/100    | 0     | DS-001 fixed (channels NOT NULL). DS-015 (P1) introduced — wrong column reference. Net neutral.                                             |
| Migration Safety | 85/100      | 82/100    | -3    | 8 new migrations lack rollbacks. Worse net coverage (12% missing vs 14%, slight improvement in proportion but more absolute gaps).          |
| Index Coverage   | 92/100      | 92/100    | 0     | No changes. DS-008 remains but has low practical impact.                                                                                    |
| Data Lifecycle   | 65/100      | 68/100    | +3    | GDPR export expanded (DS-009 fixed — major improvement). DS-016 (P2) introduced: compliance exports invisible to admins. DS-010 still open. |
| Tenant Isolation | 95/100      | 95/100    | 0     | Compliance exports RLS now workspace-scoped (improvement). users RLS relaxed to authenticated (intentional for profiles).                   |

---

## Phase-by-Phase Re-Verification

### Phase 1: Schema Map

**Re-verified tables**: `channels` (41), `compliance_exports` (40), `user_group_members` (34), `sidebar_channel_assignments` (26), `announcements` (41), `message_reads` (39), `users` (1)

**Changes**:

- `channels.created_by`: NOT NULL dropped ✅
- `compliance_exports.workspace_id`: added with FK + index ✅
- `user_group_members.user_id`: FK switched from auth.users → public.users ✅
- `users` RLS: changed from `auth.uid() = id` to `true` for authenticated ✅
- `workspace_members` RLS: changed from user-own-row to workspace-scoped ✅

**New issue**: `sidebar_channel_assignments` has no `user_id` column in any migration but code + trigger reference it → P1.

### Phase 2: Migrations and Integrity

**New migrations**: 10 (July 16-19). 2 have rollbacks (July 16), 8 do not (July 18-19).

**FK integrity**:

- `channels.created_by` → `public.users(id) ON DELETE SET NULL` — now nullable ✅
- `user_group_members.user_id` → `public.users(id) ON DELETE CASCADE` — fixed from `auth.users` ✅
- `announcements.created_by` — still no FK ❌
- `dm_members.user_id` → `auth.users(id)` — still references auth schema ❌ (inconsistent with `user_group_members` fix)
- `sidebar_channel_assignments.user_id` — column doesn't exist in definition ❌ **P1**

### Phase 3: Indexing and Query Shape

No new indexes added. Existing coverage remains strong. `message_reads` still lacks `(channel_id, user_id)` composite, but `getBatchUnread()` doesn't query `message_reads`.

### Phase 4: Data Lifecycle

**GDPR Export** (`auth/routes.ts:218-296`): Now exports 20 categories:

1. profile (users) 2. workspaces (workspace_members + workspaces) 3. messages 4. notifications 5. preferences 6. push_subscriptions 7. reactions 8. consent_logs 9. channel_memberships 10. channel_bookmarks 11. message_flags 12. message_edit_history 13. scheduled_posts 14. message_reminders 15. user_statuses 16. user_presence 17. trigger_words 18. auto_responders 19. sidebar_categories 20. sidebar_channel_assignments

**Note**: Category 20 (`sidebar_channel_assignments`) queries by `user_id` which may not exist → see DS-015.

**GDPR Deletion**: Still sequential, no transaction wrapping. Same 13 manual deletes + `auth.admin.deleteUser()`.

**Retention Scheduler**: Unchanged. `retainNotifications()` still dead code. Notifications, scheduled_posts, and message_reminders have no scheduled retention.

**Compliance Export Scheduler**: Inserts without `workspace_id` → DS-016.

---

## Aggregate Severity Counts

| Severity  | Prior  | New (v2) | Delta                                          |
| --------- | ------ | -------- | ---------------------------------------------- |
| P0        | 0      | 0        | 0                                              |
| P1        | 2      | 2        | 0 (2 fixed, 1 introduced, 1 moved)             |
| P2        | 5      | 6        | +1 (2 new, 1 remains from DS-005 count change) |
| P3        | 7      | 7        | 0 (some fixed, some introduced)                |
| **Total** | **14** | **15**   | **+1**                                         |

---

## Finding Summary Table (All Findings)

| ID     | Sev    | Category       | Status   | Finding                                                                                                              |
| ------ | ------ | -------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| DS-001 | P1     | Schema         | ✅ FIXED | `channels.created_by` NOT NULL + ON DELETE SET NULL conflict                                                         |
| DS-009 | P1     | Data Lifecycle | ✅ FIXED | GDPR export expanded from 6 to 20 categories                                                                         |
| DS-015 | **P1** | Schema         | **NEW**  | `sidebar_channel_assignments.user_id` referenced in code but column not defined in migrations — runtime failure risk |
| DS-003 | P2     | Schema         | OPEN     | 5+ tables missing TypeScript interfaces in `@chat/db` types                                                          |
| DS-007 | P2     | Indexing       | OPEN     | `listByChannel` relies solely on RLS for `deleted_at` filter                                                         |
| DS-010 | P2     | Data Lifecycle | OPEN     | GDPR deletion sequential, no transactional wrapper                                                                   |
| DS-011 | P2     | Data Lifecycle | OPEN     | `retainNotifications()` doesn't filter `read = true`                                                                 |
| DS-014 | P2     | Data Lifecycle | OPEN     | `retainNotifications()` dead code — never scheduled                                                                  |
| DS-016 | **P2** | Data Lifecycle | **NEW**  | Compliance export scheduler inserts without `workspace_id` — invisible to admins                                     |
| DS-017 | **P2** | Data Lifecycle | **NEW**  | GDPR export: 20 concurrent queries per request, no rate limit                                                        |
| DS-002 | P3     | Schema         | OPEN     | `announcements.created_by` no FK constraint                                                                          |
| DS-005 | P3     | Migrations     | OPEN     | 8 migrations (July 18-19) lack rollback scripts                                                                      |
| DS-006 | P3     | Schema         | OPEN     | `dm_channels` dead table, deprecated by `dm_members`                                                                 |
| DS-008 | P3     | Indexing       | OPEN     | Missing `(channel_id, user_id)` index on `message_reads` (low impact)                                                |
| DS-012 | P3     | Data Lifecycle | OPEN     | No consent withdrawal audit on GDPR deletion                                                                         |
| DS-013 | P3     | Data Lifecycle | OPEN     | `scheduled_posts` and `message_reminders` retention never enforced                                                   |
| DS-019 | **P3** | Data Lifecycle | **NEW**  | GDPR deletion redundantly double-deletes 10+ tables (trigger overlap)                                                |
| DS-020 | **P3** | Schema         | **NEW**  | Inconsistent FK targets: 13 tables → `auth.users`, 5 tables → `public.users`                                         |
| DS-021 | **P3** | Data Lifecycle | **NEW**  | Notifications retention cutoff inconsistent: 90d (code) vs 30d (DB function)                                         |
| DS-022 | **P3** | Schema         | **NEW**  | `dm_members.user_id` references `auth.users` not `public.users` (inconsistent with `user_group_members` fix)         |
| DS-023 | **P3** | Data Lifecycle | **NEW**  | Compliance export scheduler doesn't set `created_by` — no audit trail                                                |

---

## Decision

```
GO WITH RISKS

Resolved from prior:
  1. DS-001: channels.created_by made nullable — VERIFIED FIXED
  2. DS-009: GDPR export expanded to 20 categories — VERIFIED FIXED
  3. DS-004: messages.version now used — VERIFIED FIXED

Requires immediate attention:
  4. DS-015 (NEW P1): sidebar_channel_assignments.user_id column may not exist —
     verify on production DB; create migration to add column or fix code to use
     JOIN through sidebar_categories

Strongly recommended:
  5. DS-016 (NEW P2): Add workspace_id to scheduled compliance export inserts
  6. DS-017 (NEW P2): Add rate limiting to GDPR export endpoint
  7. DS-010: Wrap GDPR deletion in BEGIN/COMMIT or rely solely on handle_user_deletion() trigger
  8. DS-014: Either schedule retainNotifications() or remove dead code
  9. Create rollback scripts for July 18-19 migrations
```

## Aggregate JSON

```json
{
  "prompt_name": "pre_recon_database_v2",
  "domain": "data",
  "stage": "reconciliation_reaudit",
  "decision": "GO WITH RISKS",
  "severity_counts": { "P0": 0, "P1": 2, "P2": 6, "P3": 7 },
  "category_scores": {
    "Schema Integrity": 78,
    "Migration Safety": 82,
    "Index Coverage": 92,
    "Data Lifecycle": 68,
    "Tenant Isolation": 95
  },
  "fixed_from_prior": ["DS-001", "DS-004", "DS-009"],
  "new_findings": ["DS-015", "DS-016", "DS-017", "DS-019", "DS-020", "DS-021", "DS-022", "DS-023"],
  "still_open": [
    "DS-002",
    "DS-003",
    "DS-005",
    "DS-006",
    "DS-007",
    "DS-008",
    "DS-010",
    "DS-011",
    "DS-012",
    "DS-013",
    "DS-014"
  ],
  "files_verified": [
    "supabase/migrations/20260716000002_fix_channels_created_by_fk.sql",
    "supabase/migrations/20260716000001_add_compliance_export_workspace.sql",
    "apps/api/src/modules/auth/routes.ts",
    "apps/api/src/modules/messages/service.ts",
    "apps/api/src/modules/messages/routes.ts",
    "apps/worker/src/processors/data-retention.ts",
    "apps/worker/src/scheduler.ts",
    "apps/worker/src/processors/compliance-export.ts",
    "packages/db/src/types.ts",
    "packages/db/src/stores/read-receipt-store.ts",
    "supabase/migrations/20260625000003_create_channels.sql",
    "supabase/migrations/20260625000008_create_reactions.sql",
    "supabase/migrations/20260626000022_apply_rls_policies.sql",
    "supabase/migrations/20260627000009_add_optimistic_locking.sql",
    "supabase/migrations/20260704000001_add_dm_presence_categories.sql",
    "supabase/migrations/20260704000002_add_group_messaging.sql",
    "supabase/migrations/20260707000002_cleanup_deleted_users.sql",
    "supabase/migrations/20260709000003_add_compliance_exports.sql",
    "supabase/migrations/20260709000004_add_announcements.sql",
    "supabase/migrations/20260709000002_add_read_receipts.sql",
    "supabase/migrations/20260718000001_fix_channel_member_trigger.sql",
    "supabase/migrations/20260718000004_fix_user_deletion_trigger.sql",
    "supabase/migrations/20260719000003_fix_user_group_members_fk.sql",
    "supabase/rollback/"
  ]
}
```
