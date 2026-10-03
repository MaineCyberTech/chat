# Roadmap

Run: `20261003-0018-develop-a72b8cc` · Target: `C:\temp\chat` @ `a72b8cc` · Profile: base

## Immediate (0–1 day)

| Item | Findings | Effort | Success test |
|---|---|---|---|
| Remove deploy-time RLS/seed SQL | SEC-P0-001, CI-P1-002, DATA-P1-001 | S | `users_select_own` after migrations; no `database/query` in deploy |
| Remove `--volumes` from prunes | DATA-P1-002, CI-P1-004 | S | Redis volume persists across deploy |
| Restrict SSH default | SEC-P1-007 | S | Port 22 limited to operator CIDRs |
| Remove/rotate `test-signin.json` | SEC-P1-002, SUPPLY-P1-001 | S | Secret scan clean |

## This week (2–7 days)

| Item | Findings | Effort |
|---|---|---|
| Scope all admin/export/import endpoints to caller's workspaces | SEC-P1-003/004/005/006 | M |
| Correct Supabase client selection in webhooks/socket/push | ARCH-P1-001/002, FINAL-P1-001 | M |
| Make E2E + security scans blocking; self-provision E2E auth | CI-P1-003, TEST-P1-001 | M |
| Lock down `/metrics` | API-P1-001 | S |
| Require production environment review | CI-P1-001 | S |

## This month (8–30 days)

| Item | Findings | Effort |
|---|---|---|
| RLS integration test tier | TEST-P2-003 | L |
| Migration up/down/up CI | DATA-P2-004, TEST-P2-004 | M |
| Durable webhook retries + stable idempotency | FEAT-P1-002/003 | M |
| Alerting + durable logs | OBS-P1-001/003 | M |
| SHA-pin Actions; SBOM for prod | SUPPLY-P2-002/004 | M |
| GDPR deletion completeness/idempotency | DATA-P2-005 | M |
| Repo hygiene purge; encoding normalization | INV-P2-001, HYG-P2-001, INV-P3-001 | S |
| Contract consistency + sanitizer cleanup | API-P2-002/003/004, FEAT-P2-004 | M |

## This quarter (31–90 days)

| Item | Findings | Effort |
|---|---|---|
| HA topology / managed Redis / backup+restore drill | ARCH-P2-003 | L |
| Distributed tracing (OTel) | OBS-P2-004 | L |
| OpenAPI generated from code; realtime event catalog | API-P3-005 | M |
| Platform-admin role model | SEC-P1-006 | M |
| Signed images / provenance | SUPPLY-P2-004 | M |

## Milestones

- **M1 (safe-gate):** all P0 + security/CI P1s fixed and re-verified → eligible to lift NO-GO condition.
- **M2 (hardened):** RLS tests, blocking gates, durable integrations, alerting.
- **M3 (resilient):** HA, tracing, provenance, documented SLOs/runbooks.
