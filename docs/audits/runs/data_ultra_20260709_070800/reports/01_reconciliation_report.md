# Reconciliation Report

- Prompt: **data_ultra**
- Domain: **data**
- Run ID: **data_ultra_20260709_070800**
- Generated: **2026-07-09T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **2**, P3: **1**
- Readiness: **77.00**

## Findings

### P2 — Cross-tenant reaction visibility: reactions SELECT policy allows all authenticated users to read reactions across all workspaces
- **File:** `supabase/policies/06_reactions.sql`
- **Category:** data_isolation
- **Impact:** Reaction data (emoji + user_id mappings) is visible across tenant boundaries. While low-sensitivity, this violates the strict tenant isolation model used by all other tables. Combined with other data points, it enables cross-tenant user activity correlation.
- **Fix:** Scope reactions RLS to workspace membership via messages -> channels -> workspace_members join chain.

### P2 — Channel export endpoint fetches unbounded message data without pagination
- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** data_export
- **Impact:** GET /channels/:channelId/export loads ALL messages into memory and returns them as a single JSON/CSV response. Channels with >10K messages cause memory exhaustion on both server and client. No rate limiting or size cap on this endpoint.
- **Fix:** Add pagination with max limit (e.g., 1000 per page), streaming response, or document-based export with chunking.

### P3 — GDPR data export uses getSupabaseAdmin() bypassing RLS for data collection
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** gdpr_compliance
- **Impact:** GDPR export endpoint uses service_role key (admin client) to collect user data. While user_id is constrained to req.userId, this pattern centralizes data access authority. If a bug in user_id handling occurs, or if the endpoint is called before full authentication, other users' data could leak. Service_role key exposure amplifies this risk.
- **Fix:** Use per-user Supabase client (req.supabase) where RLS policies enforce user scoping. Only fall back to admin client for auth.admin operations that require service_role.
