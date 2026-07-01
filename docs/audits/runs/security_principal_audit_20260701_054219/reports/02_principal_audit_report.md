# Principal Audit Report

- Prompt: **security_principal_audit**
- Domain: **security**
- Run ID: **security_principal_audit_20260701_054219**
- Generated: **2026-07-01T12:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **5**, P3: **8**
- Readiness: **78.00**

## Findings

### P1 — Users search endpoint missing requireOrgAccess

- **File:** `apps/api/src/routes/users.ts`
- **Category:** auth
- **Impact:** Authenticated users can search across all tenants
- **Fix:** Add requireOrgAccess middleware to search route

### P1 — CSP missing frame-ancestors directive

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** headers
- **Impact:** Clickjacking risk on all pages
- **Fix:** Add frame-ancestors 'self' to CSP header

### P2 — Magic link email not normalized before send

- **File:** `apps/api/src/routes/auth.ts`
- **Category:** validation
- **Impact:** user@Example.com and user@example.com treated differently
- **Fix:** Lowercase email before sending magic link
