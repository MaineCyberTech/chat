# Database Schema & Data Lifecycle Audit Summary

**Audit date:** 2026-06-21
**Scope:** All SQL migrations, TypeScript type definitions, API service layer, RLS policies, and audit/observability infrastructure.

---

## 1. Schema Correctness & Completeness

### 1.1 Table Inventory

| Table                       | Defined In                                         | Notes                            |
| --------------------------- | -------------------------------------------------- | -------------------------------- |
| `public.users`              | `packages/db/sql/migrations/001_users.sql:8`       | Linked to `auth.users` via PK FK |
| `public.workspaces`         | `packages/db/sql/migrations/002_workspaces.sql:5`  |                                  |
| `public.workspace_members`  | `packages/db/sql/migrations/002_workspaces.sql:14` | Composite PK                     |
| `public.channels`           | `packages/db/sql/migrations/003_channels.sql:5`    |                                  |
| `public.channel_members`    | `packages/db/sql/migrations/003_channels.sql:18`   | Composite PK                     |
| `public.messages`           | `packages/db/sql/migrations/004_messages.sql:5`    | Self-referencing FK for threads  |
| `public.audit_logs`         | `supabase/migrations/audit_logs.sql:2`             |                                  |
| `public.webhook_endpoints`  | `supabase/migrations/webhooks.sql:2`               |                                  |
| `public.webhook_deliveries` | `supabase/migrations/webhooks.sql:53`              |                                  |

### 1.2 TypeScript Type Mismatches

**P1 — `WorkspaceMember` missing `role` field**
`packages/db/src/types.ts:28-33` defines `WorkspaceMember` with only `workspace_id`, `user_id`, `joined_at`. The SQL table has `role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member'))`. This means the role column is invisible to all TypeScript consumers, including channel/workspace authorization logic.

```diff
 export interface WorkspaceMember {
   workspace_id: string;
   user_id: string;
+  role: WorkspaceRole;
   joined_at: string;
 }
```

**P2 — `Channel.topic` type mismatch**
SQL `topic` is `TEXT` (nullable). The TypeScript `Channel` interface at `packages/db/src/types.ts:35-45` declares `topic: string | null` — correct. No fix needed here, but noted for completeness.

**P2 — Missing `Channel.is_private` in some query shapes**
No issues found in the interface, but the `channels_rls.sql:10` policy uses `is_private = false` for public channel visibility. This is correctly typed.

### 1.3 Column-Level Gaps

**P2 — `audit_logs.organization_id` lacks FK constraint**
`supabase/migrations/audit_logs.sql:4`: `organization_id uuid` has no foreign key reference. If `organization_id` is intended to reference an organizations table, the FK is missing. If it's a loose identifier (e.g., from an external system), add a CHECK constraint or documentation. As-is, it's a weak referential hole.

**P1 — `channels.created_by` uses `ON DELETE SET NULL` but channel_members uses `ON DELETE CASCADE`**
`003_channels.sql:12`: `created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL`. If a user is deleted, `created_by` becomes NULL. But `channel_members` at line 20 uses `ON DELETE CASCADE`. This asymmetry means deleting a user silently removes channel membership records but leaves `created_by` as NULL — inconsistent behavior and a potential UX surprise.

### 1.4 Missing Tables

**P2 — No `user_sessions` or `refresh_tokens` table**
Supabase Auth manages sessions internally via `auth.sessions`. The app-level code does not persist session metadata. This is acceptable for now but noted as a gap if custom session management is later needed.

**P2 — No `organizations` table**
The `audit_logs.organization_id` column (and AGENTS.md's mention of `w.organization_id` in the audit RLS policy) implies a multi-tenant model with organizations above workspaces, but no `organizations` table exists in any migration.

---

## 2. Migration Safety

### 2.1 Dual-Location Migration Problem

**P1 — Critical: Schema files live in two separate directories**

- `packages/db/sql/migrations/001-005` — Contains core tables (users, workspaces, channels, messages, FTS indexes)
- `supabase/migrations/` — Contains only `audit_logs.sql` and `webhooks.sql`

The Supabase CLI (`supabase migration up`) only reads from `supabase/migrations/`. There is **no mechanism** to apply the five core migration files (`001_users.sql` through `005_search.sql`) through the Supabase CLI pipeline. The `supabase/config.toml:64` sets `schema_paths = []`, meaning no additional schema files are loaded.

**Impact:** Core tables must be applied manually via the Supabase Dashboard SQL editor. This is not reproducible in CI and creates drift between environments.

**P2 — No `down` migrations**
None of the seven migration files include rollback (down) scripts. While PostgreSQL DDL is largely additive-only, any destructive change (e.g., removing a column, renaming a table) would require manual intervention. No migration version tracking exists.

### 2.2 Additive-Only Compliance

All existing migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, which is safe for re-runs. `DROP TRIGGER IF EXISTS` is used before `CREATE TRIGGER` in `002_workspaces.sql:35` and `003_channels.sql:38`, which is idempotent. No `ALTER TABLE ... DROP` or destructive operations found.

### 2.3 Naming Conventions

- Table names: `snake_case`, plural — **consistent**.
- Column names: `snake_case` — **consistent**.
- Index names: `idx_<table>_<column(s)>` — **consistent** across all migration files.
- Trigger names: `<table>_updated_at`, `on_<table>_created` — **consistent**.
- Function names: `handle_new_<entity>`, `set_updated_at`, `generate_slug` — **consistent**.
- RLS policy names: `<table>_<action>_<description>` — **consistent** across `packages/db/sql/policies/` but **inconsistent** with `supabase/migrations/audit_logs.sql` where names are `audit_logs_select_authenticated`.

---

## 3. Relational Integrity

### 3.1 Foreign Key Summary

| Source                                                   | Target                     | On Delete      | Present?  |
| -------------------------------------------------------- | -------------------------- | -------------- | --------- |
| `users.id` → `auth.users.id`                             | `auth.users`               | `CASCADE`      | ✅        |
| `workspaces.owner_id` → `public.users.id`                | `public.users`             | `CASCADE`      | ✅        |
| `workspace_members.workspace_id` → `workspaces.id`       | `public.workspaces`        | `CASCADE`      | ✅        |
| `workspace_members.user_id` → `public.users.id`          | `public.users`             | `CASCADE`      | ✅        |
| `channels.workspace_id` → `workspaces.id`                | `public.workspaces`        | `CASCADE`      | ✅        |
| `channels.created_by` → `public.users.id`                | `public.users`             | `SET NULL`     | ✅        |
| `channel_members.channel_id` → `channels.id`             | `public.channels`          | `CASCADE`      | ✅        |
| `channel_members.user_id` → `public.users.id`            | `public.users`             | `CASCADE`      | ✅        |
| `messages.channel_id` → `channels.id`                    | `public.channels`          | `CASCADE`      | ✅        |
| `messages.user_id` → `public.users.id`                   | `public.users`             | `CASCADE`      | ✅        |
| `messages.parent_id` → `messages.id`                     | `public.messages`          | `SET NULL`     | ✅        |
| `audit_logs.actor_user_id` → `auth.users.id`             | `auth.users`               | `SET NULL`     | ✅        |
| `webhook_endpoints.workspace_id` → `workspaces.id`       | `public.workspaces`        | `CASCADE`      | ✅        |
| `webhook_endpoints.created_by` → `auth.users.id`         | `auth.users`               | None specified | ✅        |
| `webhook_deliveries.webhook_id` → `webhook_endpoints.id` | `public.webhook_endpoints` | `CASCADE`      | ✅        |
| `audit_logs.organization_id` → ?                         | none                       | none           | ❌ **P2** |

### 3.2 Cascade Risk Assessment

**P2 — Deleting a workspace with many channels/messages is an unbatched O(n) operation**
When a workspace is deleted, CASCADE propagates through: `workspaces → channels → messages`. If a workspace has thousands of channels each with millions of messages, the cascade will be slow and may timeout. Consider soft-delete or async cleanup.

**P2 — Deleting a user cascades to `channel_members` but NOT to `audit_logs`**
`audit_logs.actor_user_id` uses `ON DELETE SET NULL`, which preserves the audit trail. The `channel_members.on_delete = CASCADE` means deleting a user removes their channel membership records, which is correct behavior.

### 3.3 Self-Referencing Integrity

**P1 — `messages.parent_id` self-referential FK has `ON DELETE SET NULL`**
`004_messages.sql:10`: When a parent message is deleted, child (thread) messages have their `parent_id` set to NULL. This prevents orphaned threads but the thread replies remain in the channel — which is the correct behavior. However, there is **no validation** in the API layer (`packages/db/src/validators.ts:24`) that `parent_id` references a message in the **same channel**. A client could set `parent_id` to a message in a different channel.

---

## 4. Multi-Tenant Data Modeling

### 4.1 Isolation Layer

```
auth.users
    ↓ FK (owner_id)
workspaces ───→ workspace_members ←── auth.users
    ↓ FK (workspace_id)
channels ─────→ channel_members ←── auth.users
    ↓ FK (channel_id)
messages (user_id → users)
```

Tenant isolation is workspace-level: every channel belongs to exactly one workspace, and every message belongs to exactly one channel. Access is gated by `workspace_members` — you must be a member of a workspace to see any of its channels or messages.

### 4.2 RLS Policy Completeness

| Table                | SELECT                  | INSERT                | UPDATE                | DELETE                |
| -------------------- | ----------------------- | --------------------- | --------------------- | --------------------- |
| `users`              | ✅ (all authenticated)  | ✅ (own profile)      | ✅ (own profile)      | ❌ **P3**             |
| `workspaces`         | ✅ (member)             | ✅ (auth user)        | ✅ (owner/admin)      | ✅ (owner)            |
| `workspace_members`  | ✅ (member)             | ✅ (owner/admin)      | ❌ **P2**             | ❌ **P2**             |
| `channels`           | ✅ (member)             | ✅ (workspace member) | ✅ (creator)          | ✅ (creator)          |
| `channel_members`    | ✅ (workspace member)   | ✅ (workspace member) | ❌ **P3**             | ❌ **P3**             |
| `messages`           | ✅ (workspace member)   | ✅ (workspace member) | ✅ (author)           | ✅ (author)           |
| `audit_logs`         | ✅ (org member / admin) | ✅ (own user)         | ❌ (n/a)              | ❌ (n/a)              |
| `webhook_endpoints`  | ✅ (workspace member)   | ✅ (workspace member) | ✅ (workspace member) | ✅ (workspace member) |
| `webhook_deliveries` | ✅ (workspace member)   | ❌ **P2**             | ❌ (n/a)              | ❌ (n/a)              |

**P2 — `workspace_members` has no UPDATE/DELETE policy**
`workspaces_rls.sql` defines INSERT and SELECT on `workspace_members` but not UPDATE or DELETE. RLS will **deny all** UPDATE/DELETE by default. This means role changes (e.g., promoting a member to admin) and member removal are blocked at the database level. The AGENTS.md references "workspace members CRUD" but the RLS does not support it.

**P3 — `users` table has no DELETE policy**
Users cannot delete their own profiles via RLS. Profile deletion is handled at the `auth.users` level by Supabase, so this is low priority.

### 4.3 Audit RLS Policy Defect

**P1 — `audit_logs` RLS references `w.organization_id` but the column does not exist**
`supabase/migrations/audit_logs.sql:31`: The SELECT policy uses `w.organization_id` in the join to `workspaces`. The `workspaces` table (`002_workspaces.sql:5-12`) has **no `organization_id` column**. This policy will fail at runtime with a column-not-found error for any row where `organization_id IS NOT NULL`.

**Impact:** The `audit_logs_select_authenticated` policy is broken. Any query to `audit_logs` where `organization_id` is set will fail with a PostgreSQL error. The policy likely needs to be rewritten to use `workspace_id` (which also does not exist on `audit_logs`) or the `organization_id` column needs to be added to `workspaces`.

---

## 5. Indexing & Query-Shape Assumptions

### 5.1 Existing Indexes

| Index                             | Table              | Columns                                 | Location              |
| --------------------------------- | ------------------ | --------------------------------------- | --------------------- |
| `idx_messages_channel_created`    | messages           | `(channel_id, created_at DESC)`         | `004_messages.sql:15` |
| `idx_messages_content_fts`        | messages           | `GIN (to_tsvector('english', content))` | `005_search.sql:5`    |
| `idx_audit_logs_org_created_at`   | audit_logs         | `(organization_id, created_at DESC)`    | `audit_logs.sql:14`   |
| `idx_audit_logs_actor`            | audit_logs         | `(actor_user_id)`                       | `audit_logs.sql:17`   |
| `idx_webhook_endpoints_workspace` | webhook_endpoints  | `(workspace_id)`                        | `webhooks.sql:18`     |
| `idx_webhook_deliveries_webhook`  | webhook_deliveries | `(webhook_id, created_at DESC)`         | `webhooks.sql:66`     |

### 5.2 Missing Indexes

**P2 — No index on `workspace_members.user_id`**
The most common query pattern is "find all workspaces for user X" — used by `workspace_rls.sql:12` and `workspace_service.ts:19`. Without an index on `user_id`, this is a sequential scan on `workspace_members`. As membership grows, this becomes a bottleneck.

```sql
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON public.workspace_members (user_id);
```

**P2 — No index on `channel_members.user_id`**
Similarly, `channels_rls.sql:18` queries by `user_id` on `channel_members`.

```sql
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id
  ON public.channel_members (user_id);
```

**P2 — No index on `messages.parent_id`**
Threaded reply queries (fetch all replies to a parent message) are unindexed. As thread depth grows, these become sequential scans.

```sql
CREATE INDEX IF NOT EXISTS idx_messages_parent_id
  ON public.messages (parent_id) WHERE parent_id IS NOT NULL;
```

**P3 — No index on `channels.workspace_id` for the slug lookup path**
The `UNIQUE (workspace_id, slug)` constraint on channels provides a B-tree index covering `workspace_id`, which covers the `listByWorkspace` query. No additional index needed.

### 5.3 Query Shape Analysis

**`messages.listByChannel(limit=50, before?)`** (`apps/api/src/modules/messages/service.ts:13-29`):

- Query: `SELECT * FROM messages WHERE channel_id = $1 ORDER BY created_at DESC LIMIT 50`
- Uses `idx_messages_channel_created` — ✅
- But the `before` cursor uses `lt("created_at", before)` which is a string comparison on `TIMESTAMPTZ`. This **works** in PostgreSQL (text coercion) but is fragile and type-unsafe.

**`search_messages()` RPC** (`005_search.sql:10-38`):

- Uses `to_tsvector('english', content)` with `plainto_tsquery` — standard FTS.
- `SECURITY DEFINER` — runs with definer's privileges. If the definer is a superuser, this is a **privilege escalation path**. A user could potentially craft queries that exploit the definer context.
- **P2** — `SECURITY DEFINER` without `SET search_path = public` is vulnerable to search-path hijacking.

---

## 6. Data Retention, Archival, Deletion & Auditability

### 6.1 Data Deletion Flow

| Operation        | Service Method                                             | Audit Logged?         | Cascade Behavior                            |
| ---------------- | ---------------------------------------------------------- | --------------------- | ------------------------------------------- |
| Delete workspace | `workspaceService.remove()` at `workspaces/service.ts:112` | ✅ `workspace.delete` | CASCADE to all channels, messages, webhooks |
| Delete channel   | `channelService.remove()` at `channels/service.ts:83`      | ✅ `channel.delete`   | CASCADE to all messages                     |
| Delete message   | `messageService.remove()` at `messages/service.ts:94`      | ✅ `message.delete`   | `SET NULL` on child threads                 |
| Remove member    | Not implemented                                            | ❌ **P1**             | N/A                                         |

### 6.2 Missing Deletion Capabilities

**P1 — No workspace member removal endpoints or audit**
There are no routes or service methods to add or remove workspace members (besides the initial auto-insert on workspace creation). The RLS policies don't support DELETE on `workspace_members`. This means members can never leave or be removed from a workspace.

**P2 — No channel member removal endpoints**
Similarly, there are no routes to manage `channel_members`. Private channels can be created but members cannot be invited or removed through the API.

### 6.3 Data Retention Policies

**P3 — No automatic data retention or archival**
Messages persist indefinitely. There is no:

- Message TTL or soft-delete mechanism
- Archived messages table or partition scheme
- Storage object lifecycle policy for file uploads
- Audit log rotation or pruning strategy

The `audit_logs` and `webhook_deliveries` tables will grow unbounded. For a chat application, messages are the highest-volume table and will become the primary storage concern.

### 6.4 Audit Logging Coverage

**P2 — Audit logging is fire-and-forget with no retry**
`apps/api/src/services/audit.ts:14-33`: The `logAuditEvent` function catches all errors but silently swallows failures. A failed audit insert is logged to the application logger but not retried or queued. During a database outage, audit events are silently lost.

**Audited mutations:**

- `workspace.create`, `workspace.update`, `workspace.delete` ✅
- `channel.create`, `channel.update`, `channel.delete` ✅
- `message.create`, `message.update`, `message.delete` ✅

**Missing audit events:**

- `workspace_member.add` — no endpoint exists
- `workspace_member.remove` — no endpoint exists
- `workspace_member.role_change` — no endpoint exists
- `channel_member.add` — no endpoint exists
- `channel_member.remove` — no endpoint exists
- `webhook.create`, `webhook.update`, `webhook.delete` — no endpoints exist
- File upload — not audited
- Auth events (login, logout, signup) — handled by Supabase Auth, not the app

### 6.5 Storage Object Cleanup

**P2 — Deleted messages leave behind orphaned file uploads**
The file upload endpoint at `apps/api/src/modules/messages/routes.ts:123-159` saves files to the `chat-uploads` Supabase Storage bucket. There is no mechanism to delete these files when a message (or channel/workspace) is deleted. Orphaned storage objects accumulate indefinitely.

---

## 7. Prioritized Implementation Roadmap

### P0 — Immediate (security/data loss)

| #   | Item                                                   | Files                                         | Fix                                                                              |
| --- | ------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Fix broken `audit_logs` RLS policy                     | `supabase/migrations/audit_logs.sql:31`       | Either add `organization_id` column to `workspaces` or rewrite policy to omit it |
| 2   | Add `UPDATE`/`DELETE` policies for `workspace_members` | `packages/db/sql/policies/workspaces_rls.sql` | Add RLS policies for role management                                             |
| 3   | Add `WorkspaceMember.role` to TypeScript types         | `packages/db/src/types.ts:30`                 | Add the missing `role: WorkspaceRole` field                                      |

### P1 — High (functional gaps)

| #   | Item                                              | Files                                                             | Fix                                                                                                     |
| --- | ------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 4   | Unify migration directory                         | `supabase/config.toml`, `packages/db/sql/migrations/`             | Move all migration SQL under `supabase/migrations/` with sequential naming, or configure `schema_paths` |
| 5   | Add workspace/channel member management endpoints | `apps/api/src/modules/workspaces/routes.ts`, `channels/routes.ts` | Implement `POST/DELETE /workspaces/:id/members` and `POST/DELETE /channels/:id/members`                 |
| 6   | Audit all member mutations                        | `apps/api/src/services/audit.ts`                                  | Log `workspace_member.*` and `channel_member.*` events                                                  |
| 7   | Fix `search_messages` SECURITY DEFINER            | `packages/db/sql/migrations/005_search.sql:39`                    | Add `SET search_path = public` to the function definition                                               |
| 8   | Validate `parent_id` is in same channel           | `apps/api/src/config/validators.ts:24`                            | Add a custom Zod refinement that checks channel membership                                              |

### P2 — Medium (performance & correctness)

| #   | Item                                              | Files                                      | Fix                                                                                              |
| --- | ------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 9   | Add index on `workspace_members(user_id)`         | New migration                              | `CREATE INDEX idx_workspace_members_user_id ON public.workspace_members (user_id)`               |
| 10  | Add index on `channel_members(user_id)`           | New migration                              | `CREATE INDEX idx_channel_members_user_id ON public.channel_members (user_id)`                   |
| 11  | Add partial index on `messages(parent_id)`        | New migration                              | `CREATE INDEX idx_messages_parent_id ON public.messages (parent_id) WHERE parent_id IS NOT NULL` |
| 12  | Add FK constraint on `audit_logs.organization_id` | `supabase/migrations/audit_logs.sql:4`     | Either add FK or add CHECK constraint                                                            |
| 13  | Audit logging retry/queue mechanism               | `apps/api/src/services/audit.ts`           | Buffer failed audits to a queue or add retry logic                                               |
| 14  | Create `webhook` management routes                | `apps/api/src/modules/` (new)              | Implement CRUD routes for `webhook_endpoints`                                                    |
| 15  | Storage object cleanup on deletion                | `apps/api/src/modules/messages/service.ts` | Delete associated storage objects when messages/channels/workspaces are purged                   |

### P3 — Low (nice to have)

| #   | Item                                            | Files                                         | Fix                                                                         |
| --- | ----------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| 16  | Soft-delete for workspaces/channels/messages    | All service files                             | Add `deleted_at` column and filter in queries                               |
| 17  | Data retention/archival policy                  | New migration + scheduled job                 | Add TTL-based archival or partition by date                                 |
| 18  | Audit log pruning strategy                      | New migration                                 | Add cron job to rotate audit_logs older than N days                         |
| 19  | Add `users` DELETE RLS policy                   | `packages/db/sql/policies/users_rls.sql`      | Allow users to delete their own profile                                     |
| 20  | Add `channel_members` UPDATE/DELETE policies    | `packages/db/sql/policies/channels_rls.sql`   | Allow workspace members to manage channel membership                        |
| 21  | Use parameterized cursor for message pagination | `apps/api/src/modules/messages/service.ts:23` | Replace string-compare cursor with proper `created_at` timestamp comparison |
| 22  | Add `webhook_deliveries` INSERT policy          | `supabase/migrations/webhooks.sql`            | Allow service role or webhook handler to insert delivery records            |

---

## Appendix A: File Reference Map

| Concern                  | File                                            | Lines |
| ------------------------ | ----------------------------------------------- | ----- |
| Core schema (users)      | `packages/db/sql/migrations/001_users.sql`      | 1–32  |
| Core schema (workspaces) | `packages/db/sql/migrations/002_workspaces.sql` | 1–53  |
| Core schema (channels)   | `packages/db/sql/migrations/003_channels.sql`   | 1–47  |
| Core schema (messages)   | `packages/db/sql/migrations/004_messages.sql`   | 1–18  |
| FTS search               | `packages/db/sql/migrations/005_search.sql`     | 1–39  |
| Audit logging            | `supabase/migrations/audit_logs.sql`            | 1–43  |
| Webhooks                 | `supabase/migrations/webhooks.sql`              | 1–81  |
| RLS (workspaces)         | `packages/db/sql/policies/workspaces_rls.sql`   | 1–75  |
| RLS (channels)           | `packages/db/sql/policies/channels_rls.sql`     | 1–80  |
| RLS (messages)           | `packages/db/sql/policies/messages_rls.sql`     | 1–46  |
| RLS (users)              | `packages/db/sql/policies/users_rls.sql`        | 1–25  |
| RLS (storage)            | `packages/db/sql/policies/storage_rls.sql`      | 1–20  |
| Handle new user trigger  | `packages/db/sql/functions/handle_new_user.sql` | 1–25  |
| TypeScript types         | `packages/db/src/types.ts`                      | 1–61  |
| Supabase client config   | `packages/db/src/config.ts`                     | 1–19  |
| API Supabase client      | `apps/api/src/lib/supabase.ts`                  | 1–45  |
| Zod validators           | `apps/api/src/config/validators.ts`             | 1–48  |
| Workspace service        | `apps/api/src/modules/workspaces/service.ts`    | 1–119 |
| Channel service          | `apps/api/src/modules/channels/service.ts`      | 1–90  |
| Message service          | `apps/api/src/modules/messages/service.ts`      | 1–118 |
| Audit service            | `apps/api/src/services/audit.ts`                | 1–33  |
| Supabase config          | `supabase/config.toml`                          | 1–414 |
