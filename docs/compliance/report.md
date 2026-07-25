# Compliance Report

## SOC 2

| Trust Service Criteria | Status      | Notes                                            |
| ---------------------- | ----------- | ------------------------------------------------ |
| Security               | In Progress | RBAC, RLS, audit logging, rate limiting in place |
| Availability           | In Progress | Docker health checks, auto-restart, CI/CD        |
| Confidentiality        | In Progress | TLS (Caddy), JWT auth, storage RLS               |
| Processing Integrity   | In Progress | Idempotency keys, Zod validation, error handling |
| Privacy                | In Progress | GDPR export/delete endpoints, consent logging    |

## ISO 27001

| Control Area           | Status      |
| ---------------------- | ----------- |
| Info Security Policies | Not Started |
| Asset Management       | Not Started |
| Access Control         | In Progress |
| Cryptography           | In Progress |
| Operations Security    | In Progress |
| Supplier Relationships | Not Started |
| Incident Management    | Planned     |
| Business Continuity    | Not Started |

Full compliance program development is gated on production adoption metrics.
