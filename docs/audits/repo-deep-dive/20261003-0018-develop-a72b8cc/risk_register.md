# Risk Register

Run: `20261003-0018-develop-a72b8cc` · Target: `C:\temp\chat` @ `a72b8cc` · Profile: base

Scoring: Likelihood (L) and Impact (I) low/med/high. Severity per shared model.

| Rank | Risk ID | Title | Severity | L | I | Source findings | Owner | Window |
|---:|---|---|---|---|---|---|---|---|
| 1 | R-01 | Prod RLS weakened to `USING (true)` → all users' PII readable | P0 | High | High | SEC-P0-001, CI-P1-002 | Security/Release | Immediate |
| 2 | R-02 | Deploy seeds prod with known-password test accounts | P1 | High | High | DATA-P1-001 | Release | Immediate |
| 3 | R-03 | Admin endpoints leak cross-tenant users/audit/exports | P1 | High | High | SEC-P1-003/004/005/006 | API | 7 days |
| 4 | R-04 | Webhook/socket/push broken or unauthorized due to anon client | P1 | High | High | ARCH-P1-001/002, FINAL-P1-001 | API | 7 days |
| 5 | R-05 | Deploy deletes Redis volume → queued work lost | P1 | High | Med | DATA-P1-002, CI-P1-004 | Infra | Immediate |
| 6 | R-06 | SSH open to `0.0.0.0/0` | P1 | High | High | SEC-P1-007 | Infra | Immediate |
| 7 | R-07 | Committed credential `test-signin.json` | P1 | High | High | SEC-P1-002, SUPPLY-P1-001 | Security | Immediate |
| 8 | R-08 | E2E/security gates non-blocking → regressions ship | P1 | High | Med | CI-P1-003, TEST-P1-001 | QA/CI | 7 days |
| 9 | R-09 | Prod auto-deploy without enforced review | P1 | Med | High | CI-P1-001, CI-P2-007 | Release | 7 days |
| 10 | R-10 | Webhook signature optional; retries non-durable | P1 | Med | Med | SEC-P1-008, FEAT-P1-002 | Integrations | 30 days |
| 11 | R-11 | `/metrics` readable by any user; tenant labels | P1 | High | Med | API-P1-001, OBS-P2-002 | API | 7 days |
| 12 | R-12 | No alerting wired | P1 | High | Med | OBS-P1-001 | Ops | 30 days |
| 13 | R-13 | Single-node topology / no HA / Redis SPOF | P2 | Med | High | ARCH-P2-003 | Infra | 30–90 days |
| 14 | R-14 | Coverage/diff-coverage weak; no RLS tests | P2 | High | Med | TEST-P2-002/003 | QA | 30 days |
| 15 | R-15 | Migration rollback never executed; duplicate migration | P2 | Med | Med | DATA-P2-003/004, TEST-P2-004 | DB | 30 days |
| 16 | R-16 | Actions tag-pinned; SBOM not for prod | P2 | Med | Med | SUPPLY-P2-002/004 | CI | 30 days |
| 17 | R-17 | GDPR deletion partial/coupled | P2 | Med | Med | DATA-P2-005 | Privacy | 30 days |
| 18 | R-18 | Generated artifacts/archives/encoding debris | P2/P3 | High | Low | INV-P2-001, HYG-P2-001, SUPPLY-P3-005 | Maintainer | 30 days |
| 19 | R-19 | Naive sanitizer blocks legitimate content | P2 | Med | Low | FEAT-P2-004 | API | 30 days |
| 20 | R-20 | Contract drift (errors, OpenAPI, status field) | P2/P3 | Med | Low | API-P2-002/003/004, API-P3-005 | API | 90 days |
| 21 | R-21 | Admin error logs in-memory only | P2 | Med | Low | OBS-P2-003 | Ops | 30 days |
| 22 | R-22 | CSRF length-mismatch 500 | P2 | Low | Low | SEC-P2-009 | API | 90 days |
| 23 | R-23 | Socket typing/leave to arbitrary rooms | P2 | Low | Low | SEC-P2-010 | Real-time | 30 days |

## Accepted / monitor

- None recommended at present.

## Notes

- R-01/R-02 are the same automated mechanism (deploy-time SQL) manifesting as security and data risks.
- Severity totals: P0 1, P1 24, P2 31, P3 7 (63 findings).
