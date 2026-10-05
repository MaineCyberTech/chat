# 24_access_control_matrix_audit — Prompt 24 - Access Control Matrix Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `24_access_control_matrix_audit.md` (area ACM, prompt)

## Verification Performed

Built the role/resource matrix from
`apps/api/src/middleware/require-admin.ts`, `authenticate.ts`, the module
routers and the RLS policies. Platform-admin vs workspace-admin are now a
single helper; anonymous Supabase fallbacks are gone.

## Findings

| ID | Severity | Title |
|---|---|---|
| ACM-P2-001 | P2 | RBAC matrix is enforced per-route but not documented as a single ARtifact |
| ACM-P3-001 | P3 | Admin `/stats` leaks global cross-tenant counters |
