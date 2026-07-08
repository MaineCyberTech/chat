# Principal Audit Report

- Prompt: **data_ultra**
- Domain: **data**
- Run ID: **data_ultra_20260708_073509**
- Generated: **2026-07-08T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **3**, P3: **2**
- Readiness: **76.00**

## Findings

### P1 — Channel update uses optimistic locking version check but reorderChannel does sequential row updates without version check or transaction
- **File:** `apps/api/src/modules/channels/service.ts`
- **Category:** concurrency_safety
- **Impact:** Concurrent reorder operations can interleave — two admins reordering channels simultaneously can get partial interleaved results. Some channels may end up with duplicate sort_order values or incorrect order. The updates are sequential without isolation, so a crash mid-reorder leaves inconsistent state
- **Fix:** Wrap reorder in a single transaction (Supabase RPC with BEGIN/COMMIT/ROLLBACK) and accept a version parameter for the entire workspace's channel ordering to prevent concurrent reorder conflicts

### P1 — GDPR account deletion at DELETE /account does not delete consent_logs, leaving orphaned user references
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** relational_integrity
- **Impact:** The consent_logs table has ON DELETE CASCADE referencing auth.users(id), but if users are deleted via the GDPR endpoint (which uses supabase.auth.admin.deleteUser), the cascade should clean up consent_logs. However, the trigger-based cleanup at 20260707000002 also handles this. But the GDPR endpoint at auth/routes.ts:212-230 does NOT call the trigger path — it manually deletes specific tables. consent_logs is not included in the manual delete list, so consent records for the deleted user remain as orphans
- **Fix:** Add DELETE FROM consent_logs WHERE user_id = $userId to the GDPR deletion sequence in auth/routes.ts, after the notifications delete and before the users table delete

### P2 — Message hard-delete via remove() breaks referential integrity for child records despite CASCADE
- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** orphan_prevention
- **Impact:** When a message is hard-deleted via messageService.remove() (line 328), CASCADE deletes on reactions, message_flags, and message_edit_history will clean up child records. However, the soft-delete RLS only filters deleted_at IS NULL — hard-deleted messages disappear from view but their brief existence is acknowledged by the CASCADE behavior on child tables. Inconsistency between soft-delete strategy and hard-delete implementation can lead to unexpected disappearances of reactions or flags
- **Fix:** Standardize on soft-delete for messages (UPDATE deleted_at = NOW()) to match the RLS strategy. Only hard-delete in a background cleanup job after the retention period has passed

### P2 — createGroupChannel writes to channels, channel_members, and dm_members tables sequentially without transaction isolation
- **File:** `apps/api/src/modules/channels/service.ts`
- **Category:** transaction_coverage
- **Impact:** If the server crashes after creating the channel but before adding members to channel_members and dm_members, an orphan channel with no members is created. Subsequent attempts to create the same DM will fail (if the duplicate detection finds the existing channel) or create duplicates, leading to inconsistent DM state
- **Fix:** Wrap the multi-table channel creation + member additions in a Supabase RPC with BEGIN/COMMIT/ROLLBACK transaction to ensure atomicity

### P2 — Reactions SELECT policy allows any authenticated user to read all reactions without channel membership check — cross-tenant reaction enumeration
- **File:** `supabase/policies/06_reactions.sql`
- **Category:** relational_integrity
- **Impact:** Any authenticated user can enumerate all reactions across the entire system by querying GET /messages/:id/reactions (which uses requireMessageAccess) or via direct Supabase API access, as the RLS policy does not filter by channel membership. This leaks user reaction patterns across workspace/tenant boundaries
- **Fix:** Update the reactions SELECT RLS policy to only return reactions for messages that are in channels the user can access (join to messages → channels → workspace_members)

### P3 — No composite index on channel_bookmarks(channel_id, sort_order) despite frequent ordered queries
- **File:** `supabase/migrations`
- **Category:** indexing
- **Impact:** The channel bookmarks endpoint orders by sort_order within a channel. With many bookmarks per channel, the absence of a composite index on (channel_id, sort_order) will cause sequential scans for the ORDER BY + WHERE clause
- **Fix:** Add CREATE INDEX IF NOT EXISTS idx_channel_bookmarks_channel_sort ON public.channel_bookmarks(channel_id, sort_order)

### P3 — idx_workspace_members_user_role index exists but is unused by common query patterns
- **File:** `supabase/migrations/20260627000001_add_missing_indexes.sql`
- **Category:** schema_migration_alignment
- **Impact:** The index idx_workspace_members_user_role on (user_id, role) supports the admin check query pattern (user_id + role filter), but the common workspace membership check queries filter on (workspace_id, user_id) which has no dedicated composite index. The workspace_members table has a PK on (workspace_id, user_id) which covers this, so no additional index is needed, but the user_role index may be redundant
- **Fix:** Consider removing idx_workspace_members_user_role if query analysis shows it is never used, to reduce write overhead. Or keep it for admin queries that filter by role across workspaces
