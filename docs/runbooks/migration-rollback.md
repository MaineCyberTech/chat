# Migration Rollback Runbook

## Overview

This runbook describes how to roll back Supabase database migrations in
development, staging, and production environments.

## Prerequisites

- Access to the target Supabase project (dashboard or `psql` connection)
- `supabase` CLI installed and linked to the project
- Python 3.8+ (for the rollback generator script)

## Rollback Script Generator

Auto-generated rollback scripts live in `supabase/rollback/`. To regenerate
them after adding new migrations:

```powershell
python scripts/db-rollback-generator.py
```

Options:

| Flag         | Description                                   |
| ------------ | --------------------------------------------- |
| `--dry-run`  | Preview what would be generated without writing |
| `--migrations-dir` | Custom path to migrations directory      |
| `--rollback-dir`   | Custom path for rollback output directory |

The generator parses each migration file and produces a `_down.sql` script
that reverses supported SQL statements:

| Migration Pattern              | Rollback Action                                 |
| ------------------------------ | ----------------------------------------------- |
| `CREATE TABLE`                 | `DROP TABLE ... CASCADE`                        |
| `CREATE INDEX`                 | `DROP INDEX IF EXISTS`                          |
| `CREATE TRIGGER`               | `DROP TRIGGER IF EXISTS`                        |
| `CREATE FUNCTION`              | `DROP FUNCTION IF EXISTS`                       |
| `ALTER TABLE ADD COLUMN`       | `ALTER TABLE DROP COLUMN IF EXISTS`             |
| `ALTER TABLE ADD CONSTRAINT`   | `ALTER TABLE DROP CONSTRAINT IF EXISTS`         |
| `CREATE POLICY`                | `DROP POLICY IF EXISTS`                        |
| `INSERT INTO` (seed data)      | `DELETE FROM` (placeholder WHERE clause)        |
| `UPDATE`                       | `# Manual rollback needed` comment              |
| `ALTER TABLE ENABLE RLS`       | `ALTER TABLE DISABLE ROW LEVEL SECURITY`        |
| `ALTER TABLE DISABLE RLS`      | `ALTER TABLE ENABLE ROW LEVEL SECURITY`         |
| `CREATE EXTENSION`             | Comment (extensions cannot be safely dropped)   |

## Rollback Procedure

### Step 1: Identify the migration to roll back

```powershell
# List applied migrations
supabase migration list
```

### Step 2: Generate or locate the rollback script

```powershell
# Regenerate all rollback scripts
python scripts/db-rollback-generator.py

# The rollback script for migration 20260625000004_create_messages.sql
# will be at: supabase/rollback/20260625000004_create_messages_down.sql
```

### Step 3: Review the rollback script

Always review the generated `_down.sql` for:

- **Manual placeholders**: Lines starting with `-- Manual rollback needed`
  require you to write the correct reversing SQL before running.
- **Seed data deletes**: `DELETE FROM` statements have a `WHERE FALSE`
  placeholder—replace with the actual condition matching the seed insert.
- **Dependency order**: Tables with foreign keys must be dropped in the
  reverse order of creation.

### Step 4: Execute the rollback

**Local development (docker)**:

```powershell
# Source the current rollback directly
psql $SUPABASE_LOCAL_DB_URL -f supabase/rollback/<migration_name>_down.sql

# Or apply all rollbacks in reverse chronological order
Get-ChildItem supabase/rollback/*_down.sql | Sort-Object Name -Descending | ForEach-Object {
    Write-Host "Applying: $_"
    psql $SUPABASE_LOCAL_DB_URL -f $_.FullName
}
```

**Remote (remote/local Supabase project)**:

```powershell
supabase db execute --file supabase/rollback/<migration_name>_down.sql
```

**Production (direct psql via bastion)**:

```bash
# Requires psql connection string with appropriate credentials
psql "$SUPABASE_DB_URL" -f supabase/rollback/<migration_name>_down.sql
```

### Step 5: Verify the rollback

Run the following checks:

```sql
-- Confirm the table/column/constraint no longer exists
\d <table_name>

-- Check Supabase schema version table (if using migrations)
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;

-- Run application smoke tests
```

### Step 6: Update the local migration state

If using the Supabase CLI locally, mark the migration as not applied:

```powershell
# This will apply migrations up to but not including the rolled-back one
supabase migration up
```

## Caveats

1. **Destructive operations**: `DROP TABLE ... CASCADE` will remove
   dependent objects (foreign keys, views, etc.). Ensure no critical data
   will be lost before running.

2. **Data loss**: Rolling back a `CREATE TABLE` drops the table and all its
   data. If you need to preserve data, back up the table first:

   ```sql
   CREATE TABLE backup_<name> AS SELECT * FROM <name>;
   ```

3. **Manual intervention**: `UPDATE` statements and complex constraint
   additions cannot be automatically reversed. Review manual placeholders
   carefully.

4. **Sequential rollback order**: Roll back migrations in **reverse**
   chronological order (newest first) to avoid dependency issues.

5. **Pending migrations**: After rolling back, ensure no pending migrations
   depend on the rolled-back schema.

## Emergency Rollback (Production)

If a bad migration is already applied to production:

1. **Isolate**: Immediately disable the feature flag or route that depends
   on the new schema.
2. **Assess**: Determine if the migration can be hotfixed forward (add a
   new migration) or must be rolled back.
3. **Back up**: Take a pg_dump of affected tables before any destructive
   rollback.
4. **Execute**: Run the rollback during a maintenance window.
5. **Verify**: Run smoke tests and monitor error rates.
6. **Communicate**: Notify the team that the rollback is complete.

## Preventing Rollback Pain

- Keep migrations **small and atomic**—one logical change per file.
- Avoid mixing schema changes with data migrations in the same file.
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` so re-runs are safe.
- Always review generated rollback scripts as part of PR review.
- Test rollbacks in a local or staging environment before running in production.
