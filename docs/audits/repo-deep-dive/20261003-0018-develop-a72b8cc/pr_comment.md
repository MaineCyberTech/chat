## repo-deep-dive results - 20261003-0018-develop-a72b8cc

Score: 0/100 (advisory) | Advisory: NO-GO

| Severity | Count |
|---|---|
| P0 | 1 |
| P1 | 24 |
| P2 | 31 |
| P3 | 7 |

Full gate: RELEASE_GATE.md in the run folder.

### Top findings

- **[P0]** SEC-P0-001: Production deploy creates `users_select USING (true)`, exposing all users' PII to any authenticated user
- **[P1]** API-P1-001: `/metrics` is readable by any authenticated user
- **[P1]** ARCH-P1-001: Webhook service uses the anonymous Supabase client, so RLS denies all operations
- **[P1]** ARCH-P1-002: Socket.io authorization and presence use the anonymous client; membership checks fail/bypass
- **[P1]** CI-P1-001: Production auto-deploys on push to `main` without a required review gate in-repo
- **[P1]** CI-P1-002: Deploy workflow mutates production schema and data from CI
- **[P1]** CI-P1-003: Security scans are non-blocking
- **[P1]** CI-P1-004: Deploy prunes all Docker volumes (data loss)
- **[P1]** DATA-P1-001: Deploy workflows seed production with test users and a hardcoded password
- **[P1]** DATA-P1-002: Deploy runs `docker system prune -af --volumes`, destroying the Redis named volume
- **[P1]** EXEC-P1-001: Release gate must be conditional on P0/P1 remediation
- **[P1]** FEAT-P1-001: `/v1/auth/magic-link` does not send a magic link
- **[P1]** FEAT-P1-002: Webhook retries are in-process `setTimeout`, not durable
- **[P1]** FINAL-P1-001: Systemic Supabase client/role mismatch
- **[P1]** FINAL-P1-002: Deploy pipeline mutates schema/policies/data outside migrations
