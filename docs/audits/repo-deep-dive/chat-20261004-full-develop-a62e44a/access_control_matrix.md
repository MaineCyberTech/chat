# Access control matrix

Target `chat` @ `a62e44a` (develop). Derived from `apps/api/src/middleware/require-admin.ts`,
`authenticate.ts`, module routers and `supabase/policies`.

| Principal | Resource | Read | Write | Admin | Enforcement |
|---|---|---|---|---|---|
| anonymous | public endpoints | limited | no | no | `authenticate` absent only on health/static |
| authenticated user | own profile | yes | yes | no | RLS `users_update_own`; `users_select` own-profile |
| authenticated user | co-member profiles | yes | no | no | RLS `users_select` shared-workspace clause |
| workspace member | channels/messages in member workspaces | yes | yes | no | RLS + `lib/workspace-auth` |
| workspace admin | workspace settings | yes | yes | yes | `requireAdmin("workspaceId")` |
| platform admin | admin console | yes | yes | yes | `requireAdmin(null,{attachWorkspaceIds:true})` |

Residual: admin `/stats` returns global `users`/`messages` counts outside the
admin workspace set (see ACM/MT findings).
