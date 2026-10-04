# 25 — Multi-Tenant Isolation Attack Simulation

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

Adversarial simulation of cross-tenant reads/actions by a legitimate but malicious workspace admin or authenticated user, using repository evidence only (no live systems).

## Evidence Reviewed

- `apps/api/src/modules/admin/routes.ts` (admin endpoints, dead-letter retry, `/stats`)
- `apps/api/src/modules/webhooks/service.ts` (`retryDeadLetter`)
- `apps/api/src/modules/auth/service.ts` (`searchUsers`, `getProfiles`)
- `supabase/migrations/20260724000006_fix_database_p1_findings.sql` and `supabase/tests/rls_tenant_isolation.sql`

## Verification Performed

- Walked the admin route file for tenant filters on each handler.
- Confirmed the dead-letter retry handler calls the service by raw id with no workspace check.
- Confirmed `/stats` counts two of four entities globally.
- Read the RLS tenant-isolation SQL test to identify which tables it covers.

## Executive Summary

Two residual cross-tenant vectors were reproduced: an admin IDOR on webhook dead-letter retry, and global counts on the admin `/stats` endpoint. The canonical `users` RLS policy is correctly tenant-scoped, but the seed workflow can override it (SEC-P1-001), and the auth service bypasses RLS entirely via the service role (SEC-P2-001).

## Inventory (attack surface)

| Endpoint / path | Tenant control | Verdict |
|---|---|---|
| `POST /v1/admin/webhooks/dead-letters/:id/retry` | None on the id | Vulnerable (AUTH-P2-001) |
| `GET /v1/admin/stats` | Partial (`workspaces`/`channels`); `users`/`messages` global | Leak (CONF-P3-002) |
| `GET /v1/admin/users` (offsets by workspaceIds) | Scoped | OK at HEAD |
| `GET /v1/users/search` | None (service-role, global) | Leak (SEC-P2-001) |

## Findings

### Finding ID: AUTH-P2-001 - IDOR: admin dead-letter retry is not tenant-scoped

- Severity: P2
- Confidence: High
- Area: AUTH
- Evidence:
  - `apps/api/src/modules/admin/routes.ts:355-364` — `POST /webhooks/dead-letters/:id/retry` calls `webhookService.retryDeadLetter(req.params.id)` with no workspace check, even though sibling handlers compute `adminWorkspaceIds` (`getAdminWorkspaceIds`).
  - `apps/api/src/modules/webhooks/service.ts:461-494` — loads the dead letter by raw id and re-delivers it.
- What is happening: Any workspace admin can retry (and thereby trigger outbound delivery of) a dead letter belonging to another workspace.
- Why it matters: Cross-tenant action/IDOR; an admin of workspace A can cause workspace B's webhook to be delivered or probe its existence.
- User / business impact: Cross-tenant side effects and information leak.
- Security / privacy / reliability impact: Medium-high.
- Recommended fix: Resolve the dead letter's `webhook_id → workspace_id` and require it to be in the caller's `adminWorkspaceIds` before delivering.
- Suggested validation: An admin scoped to workspace A receives 404/403 for a workspace B dead letter.
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open
- Endpoint / data path: `POST /v1/admin/webhooks/dead-letters/:id/retry` → `webhookService.retryDeadLetter(id)` → `webhook_dead_letters`/`webhook_endpoints` (no workspace predicate)
- Attack path: workspace-A admin → guess/obtain a workspace-B dead-letter UUID → outbound delivery to B's registered endpoint

### Finding ID: CONF-P3-002 - Admin `/stats` returns global cross-tenant counts

- Severity: P3
- Confidence: High
- Area: CONF
- Evidence:
  - `apps/api/src/modules/admin/routes.ts` — the `/stats` handler scopes `workspaces` and `channels` to `workspaceIds` but counts `users` and `messages` globally.
- What is happening: A workspace admin sees platform-wide user/message totals.
- Why it matters: Minor cross-tenant information disclosure.
- User / business impact: Low.
- Security / privacy / reliability impact: Low-medium.
- Recommended fix: Scope all four counts to the caller's `workspaceIds`.
- Suggested validation: `/stats` values are zero for a fresh isolated workspace.
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open

## Risks

- Cross-tenant actions and enumeration remain possible through admin and auth surfaces.

## Recommendations

1. Apply a uniform tenant-scope predicate to every admin handler.
2. Replace admin-client user lookups with workspace-scoped queries.

## Quick Wins

- Scope the dead-letter retry and `/stats` counts.

## Hardening Backlog

- Automated cross-tenant test matrix (see TEST-P2-001).

## Suggested Tests

- IDOR matrix: for each admin mutation, assert a foreign tenant id is rejected.

## Suggested Documentation Updates

- Admin API tenancy model.

## Open Questions

- Are there other admin handlers that omit the workspace predicate? Static walk suggests these two, but a full automated matrix is recommended.

## Appendix

- `supabase/tests/rls_tenant_isolation.sql` exercises RLS directly; it is not executed by CI (TEST-P2-001).
