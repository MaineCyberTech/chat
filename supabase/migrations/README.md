# Supabase migrations

Migrations are applied in filename (timestamp) order. `migrations.list` is the
canonical ordering used by CI and the rollback generator; keep it in sync when
adding a migration. Applied migrations are history — never edit, reorder, or
delete an existing migration. Add a new timestamped migration instead.

## Duplicate `add_user_groups` migrations (audit DATA-P2-003)

Two migrations added user-group policies on different dates, which looks like a
duplicate at first glance:

| Migration | What it does |
|---|---|
| `20260704000007_add_user_groups.sql` | Creates `user_groups` / `user_group_members` (both `CREATE TABLE IF NOT EXISTS`), their indexes, enables RLS, and adds the baseline workspace-member/admin policies. |
| `20260705000003_add_user_groups.sql` | Does **not** create tables. It re-enables RLS (idempotent) and adds a second set of policies: workspace-wide SELECT plus creator-scoped management of their own groups. |

They are intentionally separate and **both must be kept**. The first owns the
schema; the second only layers additional policies and assumes the tables
already exist.

### Notes for future readers

- Do not merge the two files or fold the second's policies into the first: doing
  so would rewrite applied migration history.
- The second migration adds *permissive* policies. Because Postgres combines
  permissive RLS policies with OR, the effective access is the union of both
  migrations. In particular the second migration lets any authenticated user
  create a group where `created_by = auth.uid()`, and lets a group's creator
  manage it, independently of the admin checks in the first migration. Whether
  that is the intended authorization model is a product decision; it is tracked
  as an open question in the remediation for DATA-P2-003 rather than changed
  here.
- `CREATE POLICY` is not idempotent, but these migrations run exactly once per
  environment, so re-applying a single file is not part of normal operation.
  `supabase db reset` applies the full ordered set from a clean database and is
  the supported way to rebuild.
- Rollback scripts live in `supabase/rollback/` and are generated/maintained by
  the PATCH-10 work (DATA-P2-004).
