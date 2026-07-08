# Database Migration Runbook

This runbook covers creating, testing, applying, and rolling back database migrations.

## Naming Rules

All migration files MUST follow these naming rules:

| Rule          | Requirement                                                              |
| ------------- | ------------------------------------------------------------------------ |
| **Format**    | `packages/db/sql/migrations/`: `00X_description.sql`                     |
|               | `supabase/migrations/`: `YYYYMMDDHHMMSS_description.sql`                 |
| **No spaces** | Use underscores (`_`) between words — never spaces or hyphens            |
| **Lowercase** | All lowercase except the timestamp portion                               |
| **Descriptive** | Use a brief, kebab-case description of the change (e.g., `add_user_preferences`, `create_audit_logs`) |
| **Unique**    | No two migrations can have the same timestamp or sequence number         |

### Good Examples

```
packages/db/sql/migrations/007_add_user_preferences.sql
supabase/migrations/20260707120000_create_audit_logs.sql
```

### Bad Examples

```
packages/db/sql/migrations/007-My-Change.sql          # hyphens + mixed case
supabase/migrations/20260707120000.sql                 # missing description
supabase/migrations/20260707 120000 create table.sql   # spaces in name
```

## Migration Structure

### Dual Migration Directories

The project uses two migration directories:

1. **`packages/db/sql/migrations/`** — Core schema (001_users.sql through 006_user_preferences.sql)
   - Applied via local dev setup script (`scripts/setup-dev.ps1/.sh`)
   - Also applied manually via Supabase SQL Editor in production

2. **`supabase/migrations/`** — Additional features (audit_logs.sql, webhooks.sql, notifications.sql)
   - Applied via Supabase CLI (`supabase migration up`)
   - Version-controlled with Supabase

> **Note**: This dual-directory structure is a known issue. Future work should consolidate under `supabase/migrations/`.

---

## Creating a New Migration

### 1. Determine the Type

| Change Type                                   | Directory                     | Naming                           |
| --------------------------------------------- | ----------------------------- | -------------------------------- |
| Core table/schema                             | `packages/db/sql/migrations/` | `00X_description.sql`            |
| Feature-specific (RLS, functions, new tables) | `supabase/migrations/`        | `YYYYMMDDHHMMSS_description.sql` |

### 2. Create the Migration File

```bash
# For core migrations (packages/db/sql/migrations/)
# Use next sequential number: 007, 008, etc.
cat > packages/db/sql/migrations/007_new_feature.sql << 'EOF'
-- 007_new_feature.sql
-- Description of what this migration does
-- Run after 006_user_preferences.sql

CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
-- ... policies here
EOF
```

```bash
# For Supabase migrations (supabase/migrations/)
supabase migration new new_feature
# Edits the generated file in supabase/migrations/
```

### 3. Migration Rules

- **Always additive only** — No `DROP COLUMN`, `DROP TABLE`, `ALTER TYPE` on existing columns
- **Use `IF NOT EXISTS`** for tables, indexes, policies
- **Use `CREATE OR REPLACE`** for functions
- **Include rollback comments** explaining how to reverse
- **Test locally first** before committing

---

## Testing Migrations Locally

### 1. Start Local Supabase

```bash
npx supabase start
```

### 2. Apply Core Migrations

```bash
# Via setup script (applies all core migrations)
pnpm setup:dev

# Or manually:
for f in packages/db/sql/migrations/*.sql packages/db/sql/functions/*.sql packages/db/sql/policies/*.sql; do
  npx supabase db execute --file "$f"
done
```

### 3. Apply Supabase Migrations

```bash
supabase migration up
```

### 4. Verify

```bash
# Check applied migrations
supabase migration list

# Inspect schema
npx supabase db diff --schema public

# Run tests
pnpm test
```

### 5. Reset and Re-test (Optional)

```bash
npx supabase db reset
# Re-applies all migrations from scratch
```

---

## Applying to Staging/Production

### Option A: Supabase Dashboard (Current Process)

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration SQL content
3. Execute in SQL Editor
4. Verify no errors

### Option B: Supabase CLI (Recommended for CI/CD)

```bash
# Link to project (one-time)
supabase link --project-ref <project-ref>

# Push migrations
supabase db push

# Or apply specific migration
supabase migration up --include-all
```

### Option C: GitHub Actions (Future)

Add a migration job to `deploy-production.yml`:

```yaml
- name: Apply Migrations
  run: |
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## Rolling Back Migrations

### ⚠️ No Automated Rollback

**PostgreSQL does not support transactional DDL rollback.** Once applied, migrations cannot be automatically reversed.

### Manual Rollback Strategies

#### 1. Soft Delete / New Migration (Preferred)

Create a new migration that reverses the change:

```sql
-- 008_rollback_new_feature.sql
-- Reverts 007_new_feature.sql

DROP POLICY IF EXISTS "policy_name" ON public.new_table;
ALTER TABLE public.new_table DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.new_table;
```

#### 2. Point-in-Time Recovery (PITR)

For catastrophic issues:

1. Go to Supabase Dashboard → Database → Backups
2. Select "Point-in-time recovery"
3. Choose timestamp before migration
4. Restore to new branch/project
5. Verify data, then promote

#### 3. Manual SQL Reversal

For simple changes, run reversal SQL directly:

```sql
-- Example: Remove a column added by mistake
ALTER TABLE public.messages DROP COLUMN IF EXISTS new_column;
```

---

## Migration Checklist

### Before Creating

- [ ] Discuss schema change in PR/issue
- [ ] Check for existing similar patterns
- [ ] Plan rollback strategy
- [ ] Consider performance impact (indexes, FK, FK)

### Before Applying

- [ ] Test locally with `supabase db reset`
- [ ] Run full test suite (`pnpm test`)
- [ ] Review SQL for syntax errors
- [ ] Verify additive-only (no destructive ops)

### After Applying

- [ ] Verify in Supabase Dashboard → Table Editor
- [ ] Run health checks on affected environments
- [ ] Monitor Sentry for new errors
- [ ] Update TypeScript types if schema changed (`packages/db/src/types.ts`)

---

## TypeScript Type Generation

After migration applies, regenerate types:

```bash
# Local development
npx supabase gen types typescript --local > packages/db/src/types.ts

# Production (requires linked project)
npx supabase gen types typescript --project-id <ref> > packages/db/src/types.ts
```

Commit the updated `types.ts` with the migration.

---

## Common Migration Patterns

### Add Column with Default

```sql
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE;
```

### Create Index Concurrently (Production)

```sql
-- Use CONCURRENTLY to avoid locks on large tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_edited
ON public.messages (edited) WHERE edited = TRUE;
```

### Add RLS Policy

```sql
CREATE POLICY "policy_name" ON public.table_name
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

### Create Function with Search Path

```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS VOID AS $$
BEGIN
  -- function body
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;
```

---

## Supabase-Specific Notes

### Local Development

- Supabase CLI runs PostgreSQL in Docker
- Port: 54321 (API), 54323 (Studio), 54324 (Inbucket)
- Data persists in `supabase/.temp/`

### Production

- Managed PostgreSQL on Supabase
- Connection pooling via PgBouncer (port 6543)
- Read replicas available for analytics

### Migrations in CI

Current CI does NOT run migrations automatically. They must be applied manually or via Supabase Dashboard. Future work should add migration step to deploy workflows.

---

## Emergency Procedures

### Migration Fails in Production

1. **Stop** — Do not run more migrations
2. **Assess** — Check error in Supabase logs
3. **Revert** — If possible, run reversal SQL manually
4. **PITR** — If data corrupted, use point-in-time recovery
5. **Communicate** — Update team, document in incident report

### Lock Contention

If migration hangs on lock:

```sql
-- Check blocking queries
SELECT * FROM pg_locks WHERE NOT granted;

-- Cancel blocking query (get PID from above)
SELECT pg_cancel_backend(<pid>);
```

---

## References

- [Supabase Migrations Docs](https://supabase.com/docs/guides/deployment/database-migrations)
- [PostgreSQL DDL Locking](https://www.postgresql.org/docs/current/ddl-locking.html)
- Project migrations: `packages/db/sql/migrations/`, `supabase/migrations/`
