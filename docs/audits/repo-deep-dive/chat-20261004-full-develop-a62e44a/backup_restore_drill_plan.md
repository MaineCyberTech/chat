# Backup / restore drill plan

Existing runbooks: `docs/runbooks/backup-strategy.md`, `docs/runbooks/database-restore.md`,
`docs/runbooks/redis-recovery.md`.

Drill (not yet evidenced at `a62e44a` — see DR-P3 finding):
1. Snapshot prod Postgres; record size + timestamp.
2. Restore into an isolated database; run `pnpm test:rls` and a smoke message flow.
3. Restore Redis from its snapshot; verify queue backlog recovery.
4. Measure RTO/RPO; commit the dated result under `docs/operations/`.
