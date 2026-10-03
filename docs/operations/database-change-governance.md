# Database Change & Deploy Governance

This page is the source of truth for **how schema, policies (RLS), functions, and
seed data reach a hosted Supabase project**. It exists because the deploy
workflows historically acted as a second, unversioned migration channel: they
posted raw SQL to the Supabase Management API, including an RLS policy that
widened `public.users` to `USING (true)` and seed users with a shared password
(audit findings `FINAL-P1-002`, `CI-P1-002`, `SEC-P0-001`).

## Policy

1. **Migrations are the only schema channel.** Schema, RLS policies, functions,
   triggers, and indexes are defined under `supabase/migrations/**` and applied
   by `.github/workflows/supabase-migrations.yml` (`supabase db push --include-all`),
   which targets the `production` / `development` GitHub environment.
2. **Seed data uses the protected seed workflow.** Test/seed data is applied
   only by `.github/workflows/seed-database.yml` (`workflow_dispatch`, runs in a
   GitHub environment). It never runs as part of a deploy.
3. **Deploy workflows perform no DDL or DML.** `.github/workflows/deploy-production.yml`
   and `.github/workflows/deploy-development.yml` must not call
   `POST /v1/projects/{ref}/database/query`, and must not contain `CREATE`,
   `ALTER`, `DROP`, `INSERT`, or `UPDATE` statements against any schema
   (`auth.*`, `public.*`, or otherwise). Deploys ship application images and
   run health checks only.
4. **RLS may only be relaxed by a reviewed migration.** No change may replace a
   least-privilege policy with `USING (true)`. A migration that loosens access
   requires security review and a rollback script under `supabase/rollback/`.

## Reviewer check

Before approving a deploy or migration change, run:

```bash
rg "database/query|USING \(true\)|Seed auth users" .github/workflows/deploy-production.yml .github/workflows/deploy-development.yml
```

The command must return nothing. Any match is a policy violation and blocks the
change.

## Current status

The deploy-time DDL/DML removal is implemented in remediation patch set
`PATCH-01` (draft PR #56, `SEC-P0-001` / `CI-P1-002` / `DATA-P1-001`). Until that
PR merges, the base `deploy-production.yml` / `deploy-development.yml` still
contain the Management-API SQL steps described above; this page records the
target state that the patch set enforces.

## Related

- [Deployment Policy](deployment-policy.md)
- [Alerting](alerting.md)
- `.github/workflows/supabase-migrations.yml` — sanctioned migration path
- `.github/workflows/seed-database.yml` — sanctioned seed path
