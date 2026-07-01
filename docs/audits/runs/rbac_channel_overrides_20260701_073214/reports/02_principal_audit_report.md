# Principal Audit Report

- Prompt: **rbac_channel_overrides**
- Domain: **features**
- Run ID: **rbac_channel_overrides_20260701_073214**
- Generated: **2026-07-01T07:32:14Z**
- Decision: **NO-GO**
- P0: **1**, P1: **2**
- P2: **2**, P3: **1**
- Readiness: **35.00**

## Findings

### P0 — No channel-level permission override model — all channel access is binary (member of workspace = can see all public channels)

- **File:** ``
- **Category:** permission_matrix
- **Impact:** Cannot restrict specific channels to specific roles; hidden/staff-only channels impossible
- **Fix:** Design permission matrix: workspace roles (Admin, Moderator, Member, Guest) + channel overrides (allow/deny per role or per user). Precedence: explicit deny > explicit allow > workspace role default.

### P1 — No channel_role_overrides table — cannot define per-role or per-user channel access exceptions

- **File:** `supabase/migrations/`
- **Category:** schema_migration
- **Impact:** Channel-level access control requires new database table plus RLS changes
- **Fix:** Create channel_role_overrides: channel_id FK, role TEXT (or user_id UUID nullable), permission TEXT (allow/deny), scope TEXT (read/write/admin). Unique (channel_id, role) or (channel_id, user_id)

### P1 — Current RLS policies for channels and messages are binary — workspace member sees all public channels. No override resolution logic.

- **File:** `supabase/policies/`
- **Category:** rls_enforcement
- **Impact:** RLS must be updated to consider channel_role_overrides for hidden channels and restricted content
- **Fix:** Update channel SELECT RLS: if channel has override restricting role=user_role, exclude from results. Add admin-bypass policy for workspace admins.

### P2 — No channel settings UI for managing role overrides — cannot configure channel permissions from frontend

- **File:** ``
- **Category:** frontend_settings
- **Impact:** Channel permission management requires direct DB access or API calls
- **Fix:** Add channel settings page with members tab showing current role assignments and override controls (channel admin only)

### P2 — Channel access middleware checks workspace membership but not channel-level role overrides

- **File:** `apps/api/src/middleware/require-membership.ts`
- **Category:** rls_enforcement
- **Impact:** Middleware bypasses channel-level permissions; overrides only enforced at RLS level (bypassable if service_role client used)
- **Fix:** Add channel_role_override check to requireChannelAccess middleware: if user has explicit deny on channel, return 403

### P3 — No privilege escalation or hidden-channel leakage tests

- **File:** ``
- **Category:** test_plan
- **Impact:** RBAC changes risk introducing authorization bypasses without detection
- **Fix:** Write test cases: user without channel override cannot access channel, user with explicit deny gets 403, admin bypasses overrides, hidden channel not in list
