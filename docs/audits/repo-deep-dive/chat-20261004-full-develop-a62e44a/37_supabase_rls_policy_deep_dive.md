# 37_supabase_rls_policy_deep_dive — Prompt 37 - Supabase RLS Policy Deep-Dive Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `37_supabase_rls_policy_deep_dive.md` (area RLS, prompt)

## Verification Performed

Deep-dived every policy in
`supabase/policies` and the migration chain that touches `public.users`,
`messages`, `channels` and tenant tables. The `USING (true)` user-read policy
is gone; the current policy is own-profile OR shared-workspace.

## Findings

| ID | Severity | Title |
|---|---|---|
| RLS-P1-001 | P1 | Global `users_select USING (true)` policy (fixed) |
| RLS-P2-001 | P2 | RLS policy test exists but is not executed by CI |
