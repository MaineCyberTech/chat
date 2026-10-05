# 07_data_schema_migration_runtime_validation — Prompt 07 - Data, Schema, Migration, and Runtime Validation Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `07_data_schema_migration_runtime_validation.md` (area DATA, prompt)

## Verification Performed

Reviewed all 78 migrations and
76 rollback scripts; the migration up/down/up gate now executes downs in
reverse. Two schema defects remain: duplicate `add_user_groups` migrations and
the hard multi-table `gdpr_delete_user`.

## Findings

| ID | Severity | Title |
|---|---|---|
| DATA-P2-001 | P2 | Duplicate `add_user_groups` migrations |
| DATA-P2-002 | P2 | `gdpr_delete_user` is a hard multi-table delete with partial coverage |
| DATA-P2-003 | P2 | Deploy workflows seeded production with test users (fixed) |
| DATA-P2-004 | P2 | Rollback scripts were only proven to exist (fixed) |
