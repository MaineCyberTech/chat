# Principal Audit Report

- Prompt: **data_ultra**
- Domain: **data**
- Run ID: **data_ultra_20260701_074119**
- Generated: **2026-07-01T07:41:18Z**
- Decision: **NO-GO**
- P0: **2**, P1: **3**
- P2: **3**, P3: **1**
- Readiness: **37.00**

## Findings

### P0 — Workspace slug dedup loop in workspaces service has no max-attempt guard — while(true) can hang forever

- **File:** `apps/api/src/modules/workspaces/service.ts`
- **Category:** Race conditions
- **Impact:** If all slug variants are taken (e.g., 'workspace-1' through 'workspace-100'), the loop spins indefinitely — potential DoS
- **Fix:** Add MAX_ATTEMPTS=100 counter and throw error after exhausting attempts — already done in workspaces/service.ts but CHECK channels/service.ts has NO safeguard

### P0 — No optimistic locking on any PATCH handler — no If-Match header, no version column, no checkVersionMatch pattern

- **File:** `supabase/migrations/`
- **Category:** Concurrency safety
- **Impact:** Concurrent edits silently overwrite each other — last writer wins with no conflict detection
- **Fix:** Add version column (INT DEFAULT 1) to messages, workspaces, channels tables; implement If-Match header check in PATCH handlers; return 409 on version mismatch

### P1 — webhook_endpoints.created_by FK has no ON DELETE action — defaults to RESTRICT

- **File:** `supabase/migrations/20260625000012_create_webhooks.sql`
- **Category:** Relational integrity
- **Impact:** Deleting an auth user who created webhooks will fail with FK violation; user deletion cascading is blocked
- **Fix:** Add ON DELETE SET NULL or ON DELETE CASCADE to the FK constraint

### P1 — TypeScript types severely out of sync with DB schema — 6 interfaces defined vs 16 tables; soft-delete fields missing from Workspace/Channel/Message types

- **File:** `packages/db/src/types.ts`
- **Category:** Schema drift
- **Impact:** Type-safety gaps across codebase; developers must use 'any' for non-existent types; schema drift goes undetected
- **Fix:** Run supabase gen types typescript --local > packages/db/src/types.ts; add CI check for type-schema drift

### P1 — Soft-delete on workspaces/channels/messages does not cascade soft-delete to child records (channel_members, messages in workspace, reactions on soft-deleted messages)

- **File:** `supabase/migrations/20260625000014_soft_delete.sql`
- **Category:** Orphan records
- **Impact:** Orphaned channel_members point to deleted channels; reactions on soft-deleted messages remain; workspace soft-delete leaves all channels/messages undeleted
- **Fix:** Add trigger to cascade soft-delete: workspace soft-delete -> soft-delete all channels -> soft-delete all messages; channel soft-delete -> soft-delete all messages

### P2 — Missing index on reactions.message_id — all reaction queries filter by message_id but no index exists

- **File:** `supabase/migrations/20260625000008_create_reactions.sql`
- **Category:** Missing indices
- **Impact:** Full table scans on every reaction fetch; O(n) per message on reaction-heavy channels
- **Fix:** CREATE INDEX idx_reactions_message_id ON public.reactions(message_id)

### P2 — Workspace creation is multi-table (workspaces + workspace_members + webhook trigger) but NOT wrapped in a DB transaction

- **File:** `apps/api/src/modules/workspaces/service.ts`
- **Category:** Transaction coverage
- **Impact:** If workspace_members insert succeeds but subsequent operations fail, partial state exists — orphan workspace or missing member records
- **Fix:** Wrap workspace creation in Supabase RPC with BEGIN/COMMIT/ROLLBACK, or use application-level compensating actions

### P2 — Missing composite index on channel_members (channel_id, user_id) — private channel access checks use this pair

- **File:** `supabase/migrations/`
- **Category:** Missing indices
- **Impact:** Slow channel access checks on private channels with many members
- **Fix:** CREATE INDEX idx_channel_members_channel_user ON public.channel_members(channel_id, user_id)

### P3 — No down/rollback scripts for any of 26 migrations — forward-fix is only recovery path

- **File:** `supabase/migrations/`
- **Category:** Best practice
- **Impact:** Schema rollback requires PITR with data loss; no automated way to reverse a migration
- **Fix:** Write .down.sql scripts for all 26 migrations; mandate down scripts in migration template
