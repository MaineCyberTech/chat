# Release Gate

- Target: `chat` @ `a62e44a` (`develop`)
- Run: `chat-20261004-full-develop-a62e44a`
- Decision: **GO WITH CONDITIONS**

## Basis

- P0 x1, P1 x16, P2 x43, P3 x39.

## Blocking findings

| ID | Sev | Title |
|---|---|---|
| SEC-P0-001 | P0 | Production deploy created `users_select USING (true)` exposing all users (fixed) |
| API-P1-001 | P1 | `/metrics` readable by any authenticated user (fixed) |
| CI-P1-001 | P1 | Production provision/deploy ran destructive Terraform with no approval (fixed) |
| CI-P1-002 | P1 | Security scans were non-blocking (fixed) |
| EXEC-P1-001 | P1 | Release gate must remain conditional pending P1/P2 remediation |
| FEAT-P1-001 | P1 | `/v1/auth/magic-link` did not send a magic link (fixed) |
| FEAT-P1-002 | P1 | Webhook retries were in-process setTimeout, not durable (fixed) |
| FINAL-P1-001 | P1 | Release gate must remain conditional pending P2 remediation |
| OBS-P1-001 | P1 | No alerting wired despite metrics and a tracked TODO (fixed) |
| RLS-P1-001 | P1 | Global `users_select USING (true)` policy (fixed) |
| SC-P1-001 | P1 | Credential committed to the repository (fixed) |
| SEC-P1-001 | P1 | Seed workflow could re-open global user RLS / seed shared-password accounts (fixed) |
| SEC-P1-002 | P1 | Tracked credential file `test-signin.json` (fixed) |
| SEC-P1-003 | P1 | Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed) |
| SEC-P1-004 | P1 | SSH was open to the internet by default (fixed) |
| TEST-P1-001 | P1 | E2E tests skipped without `test-signin.json` and were non-blocking (fixed) |
| WH-P1-001 | P1 | Webhook retries were not durable (fixed) |

## Verification required to change the verdict

Re-run the owning domains at the remediated commit and capture artifacts; confirm zero P0/P1 remains. This run records a delta only.

