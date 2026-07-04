# Migration Rollback

Supabase CLI does not support automatic rollback of migrations. If a migration needs to be reverted, use the manual process below.

## Manual Rollback Process

### 1. Identify the Migration to Revert

```sql
-- Check migration history
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;
```

Each row has a `version` column (timestamp like `20260625000001`) and `name`.

### 2. Generate the Rollback SQL

Review the migration file at `supabase/migrations/<version>_<name>.sql` and write the inverse statements. Common patterns:

| Migration Action                        | Rollback                                                     |
| --------------------------------------- | ------------------------------------------------------------ |
| `CREATE TABLE`                          | `DROP TABLE IF EXISTS public.<table> CASCADE;`               |
| `ALTER TABLE ADD COLUMN`                | `ALTER TABLE public.<table> DROP COLUMN IF EXISTS <column>;` |
| `CREATE INDEX`                          | `DROP INDEX IF EXISTS <index>;`                              |
| `ALTER TABLE ENABLE ROW LEVEL SECURITY` | `ALTER TABLE public.<table> DISABLE ROW LEVEL SECURITY;`     |
| `CREATE POLICY`                         | `DROP POLICY IF EXISTS <policy> ON public.<table>;`          |
| `ALTER TYPE ... ADD VALUE`              | Cannot be reverted; requires database-level cleanup          |

### 3. Execute Rollback Locally

```bash
# Connect to local Supabase
supabase db execute --file rollback.sql

# Verify
supabase db diff --schema public
```

### 4. Execute Rollback on Remote

```bash
# Using Supabase connection string
psql "$SUPABASE_DB_URL" -f rollback.sql
```

Or via the Supabase dashboard SQL editor.

### 5. Remove the Migration Record

```sql
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '<version>';
```

### 6. Commit the Rollback

```bash
git add rollback.sql
git commit -m "revert: rollback migration <version>_<name>"
```

## Safe Migration Practices

- **Always deploy migrations during low-traffic periods**
- **Test rollback SQL locally before applying to production**
- **Keep rollback scripts in `supabase/rollbacks/` for future reference**
- **For destructive operations (DROP TABLE, DROP COLUMN), ensure backups exist first**
