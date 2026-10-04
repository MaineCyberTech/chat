# Roadmap

Run `chat-20261004-full-develop-0695894` · Target `chat` @ `0695894`.

## Immediate (same day)

- `SEC-P1-001` / `FINAL-P1-001`: remove `CREATE POLICY` and `encrypted_password` writes from `.github/workflows/seed-database.yml`; remove the `production` option (or gate it on a protected environment with reviewers).
- `CI-P1-001`: add `environment: production` to the `provision`/`build-images` jobs and split `terraform plan` from `apply`; drop unused `id-token: write`.
- `EXEC-P2-002`: correct the five prior `verified-fixed` rows to `open` at this commit, or merge the cited branches into `develop`.

## This week

- `AUTH-P2-001`: tenant-scope the admin dead-letter retry.
- `SEC-P2-001`: scope `searchUsers`/`getProfiles` to workspace co-members.
- `SEC-P2-003`: add `WEBHOOK_ENCRYPTION_KEY` to prod compose and `.env.example`.
- `SUPPLY-P2-001`: remove the service-role key from the web container.
- `CI-P2-001..004`: permissions, environment gates, input handling, branch-protection coverage.

## This month

- `DEP-P2-001` / `FINAL-P2-002`: land dependency upgrades before 2026-11-03.
- `TEST-P2-001`: run `scripts/test-db-rls.sh` in CI.
- `OBS-P1-001`: configure alerting.
- `SEC-P2-002`: harden webhook SSRF (redirect + IP pinning).
- `CI-P3-001/002`: actionlint and least-privilege permissions.
- `ARCH-P2-001`: plan HA/managed Redis with a tested restore.
- `DATA-P2-001`, `CONF-P3-001`, `INV-P2-001`: migration/policy/doc/root cleanup.

## This quarter

- `SUPPLY-P3-001..004`: digest pins, SBOM signing/attestation, container runtime hardening.
- `PORT-P3-001`, `ARCH-P3-002`, `CONF-P3-002`: exec bits, single admin-authz implementation, `/stats` scoping.
