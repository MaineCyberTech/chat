# Principal Audit Report

- Prompt: **security_failing_test**
- Domain: **security**
- Run ID: **security_failing_test_20260701_053220**
- Generated: **2026-07-01T12:00:00Z**
- Decision: **NO-GO**
- P0: **2**, P1: **5**
- P2: **10**, P3: **15**
- Readiness: **51.70**

## Findings

### P0 — No auth on users route

- **File:** `apps/api/src/routes/users.ts`
- **Category:** auth
- **Impact:** Full data access
- **Fix:** Add requireAuth
