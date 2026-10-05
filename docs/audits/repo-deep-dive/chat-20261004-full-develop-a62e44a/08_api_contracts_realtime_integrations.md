# 08_api_contracts_realtime_integrations — Prompt 08 - API Contracts, Realtime, and Integrations Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `08_api_contracts_realtime_integrations.md` (area API, prompt)

## Verification Performed

OpenAPI coverage, error envelopes,
PostgREST filter escaping and validator coverage re-checked; all historical
API findings are fixed at a62e44a.

## Findings

| ID | Severity | Title |
|---|---|---|
| API-P1-001 | P1 | `/metrics` readable by any authenticated user (fixed) |
| API-P2-001 | P2 | User input interpolated into PostgREST `.or(...)` filters (fixed) |
| API-P2-002 | P2 | `PATCH /v1/auth/status` accepted unvalidated customStatus (fixed) |
| API-P2-003 | P2 | Inconsistent error response shapes (fixed) |
