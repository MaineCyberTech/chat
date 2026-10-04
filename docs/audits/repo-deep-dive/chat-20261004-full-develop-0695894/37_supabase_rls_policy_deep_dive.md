# 37 — Supabase RLS Policy Deep Dive

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

Row-Level Security policy set for tenant tables, the `public.users` policy in particular, service-role bypass paths, and the seed workflow's policy overrides. This deep dive supports `06` and `25`; no new finding IDs are minted here.

## Evidence Reviewed

- `supabase/migrations/20260724000006_fix_database_p1_findings.sql`
- `supabase/migrations/20260719000002_fix_users_rls_policy.sql`
- `supabase/policies/*` and `supabase/migrations/20260626000022_apply_rls_policies.sql`
- `supabase/tests/rls_tenant_isolation.sql`
- `.github/workflows/seed-database.yml`
- `apps/api/src/lib/supabase.ts` (anon / user / service-role clients)

## Verification Performed

- Traced the latest `users_select` definition and confirmed it supersedes earlier policies.
- Compared the canonical policy with the policy created by the seed workflow.
- Confirmed which backend paths use the service-role client and therefore bypass RLS.
- Read the RLS tenant-isolation SQL test and identified how it is (not) executed in CI.

## Executive Summary

The canonical `public.users` SELECT policy is correctly tenant-scoped: a user may read their own row or rows of co-members in shared workspaces. However, RLS is not the only access path: the backend routinely uses the service-role client, which bypasses RLS entirely, so tenant isolation must also be enforced in application code (see SEC-P2-001, AUTH-P2-001). Additionally, the manual seed workflow can replace the correct policy with `USING (true)` (SEC-P1-001).

## Inventory

| Table | Policy intent | Evidence |
|---|---|---|
| `public.users` | own row OR workspace co-members | `20260724000006_fix_database_p1_findings.sql:131-143` |
| `workspace_members` | member of workspace | `seed-database.yml:82` (definition) / policies dir |
| `channels` / `messages` | workspace/channel membership | `20260626000022_apply_rls_policies.sql` |
| Service-role bypass | N/A | `apps/api/src/lib/supabase.ts` admin client |

## Findings

No new findings. RLS-specific issues are recorded once as `SEC-P1-001` (policy regression via seed workflow) and `SEC-P2-001` (service-role bypass in the auth directory).

## Risks

- Service-role bypass means RLS correctness alone is insufficient for tenant isolation.
- A policy regression can be introduced out of band by the seed workflow.

## Recommendations

1. Treat RLS as defense-in-depth; enforce tenancy in every service-role query.
2. Remove policy DDL from the seed workflow.
3. Execute `supabase/tests/rls_tenant_isolation.sql` in CI (TEST-P2-001).

## Quick Wins

- Remove `CREATE POLICY users_select … USING (true)` from `seed-database.yml:85`.

## Hardening Backlog

- Expand the SQL test to cover every tenant table and the service-role bypass paths.

## Suggested Tests

- RLS matrix: anon vs member vs admin, per table.

## Suggested Documentation Updates

- Document the "service-role bypasses RLS" rule for API authors.

## Open Questions

- Has the production `users_select` policy been altered by a prior seed run? Runtime state Unknown — verify in the hosted project.

## Appendix

- Prior-base P0 (`SEC-P0-001`) was the deploy workflow applying the `USING (true)` policy; the deploy workflows no longer do so, but the seed workflow still can.
