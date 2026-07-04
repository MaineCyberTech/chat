# Principal Audit Report

- Prompt: **rbac_and_channel_overrides**
- Domain: **features**
- Run ID: **rbac_and_channel_overrides_20260703_055338**
- Generated: **2026-07-03T12:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **1**, P3: **1**
- Readiness: **57.50**

## Findings

### P1 — Migration 08 removes channel_role_overrides checks from channels_select_member and messages_select_member RLS policies, moving deny-enforcement entirely to the application middleware

- **File:** `supabase/migrations/20260627000008_simplify_rls_policies.sql:12`
- **Category:** rls_deny_enforcement
- **Impact:** If any code path queries channels or messages without going through requireChannelAccess middleware, the deny overrides are not enforced.
- **Fix:** Restore the NOT EXISTS deny-override check using the SECURITY DEFINER channel_workspace() helper to avoid circular dependency.

### P1 — channelService.getMembers()/addMember()/removeMember() use getSupabase() (anon client) without accepting a per-user authenticated client

- **File:** `apps/api/src/modules/channels/service.ts:169`
- **Category:** channel_service_authz
- **Impact:** Channel member operations bypass any per-user RLS context. The getMembers() call returns all members regardless of calling user's membership.
- **Fix:** Refactor channelService methods to accept an optional SupabaseClient parameter. Use req.supabase from route handlers.

### P2 — No frontend admin UI exists for managing channel role overrides despite the full table schema and API support

- **File:** `apps/web/components/workspace/app-sidebar.tsx`
- **Category:** override_admin_ui
- **Impact:** Workspace admins cannot manage channel-level access controls through the UI. Admins must use raw SQL or API calls.
- **Fix:** Add a 'Channel Settings' dialog with 'Access Overrides' tab. Show current overrides with add/remove controls.

### P3 — Role enumeration is inconsistent: CHECK uses 'admin','moderator','member','guest', workspace service uses 'owner'|'admin'|'member'

- **File:** `supabase/migrations/20260627000006_channel_role_overrides.sql:7`
- **Category:** role_enum_consistency
- **Impact:** Role definitions drift between layers. 'owner' is valid but not in override CHECK. 'guest' and 'moderator' have no code paths.
- **Fix:** Unify role definitions in packages/db/. Align CHECK constraint with workspace role definitions. Remove unused roles.
