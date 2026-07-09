# Principal Audit Report

- Prompt: **api_realtime_contract_audit**
- Domain: **api**
- Run ID: **api_realtime_contract_audit_20260709_070759**
- Generated: **2026-07-09T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **1**, P3: **2**
- Readiness: **82.00**

## Findings

### P2 — Channel export endpoint fetches all messages without pagination or limit
- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** pagination
- **Impact:** GET /channels/:channelId/export fetches ALL messages in a channel using .select() with no limit or offset. For channels with thousands of messages, this causes unbounded memory allocation, slow response times, and potential OOM crashes on both server and client side.
- **Fix:** Add pagination with streaming or chunked responses. Implement max limit cap (e.g., 1000 per request) and cursor-based pagination similar to the main message list endpoint.

### P3 — In-memory idempotency fallback Map is not shared across instances
- **File:** `apps/api/src/lib/idempotency.ts`
- **Category:** resilience
- **Impact:** When Redis is unavailable, idempotency keys fall back to an in-process Map. In multi-instance deployments, each instance has its own Map, so duplicate message creation or channel creation is possible if requests route to different instances during Redis failure.
- **Fix:** For multi-instance safety, consider a shared fallback (e.g., database-backed idempotency with upsert) or document that single-instance mode is required when Redis is down.

### P3 — No response schema validation for any API endpoint
- **File:** `apps/api/src/route-registry.ts`
- **Category:** contract_validation
- **Impact:** While request validation exists (zod schemas), no endpoint validates response payloads against a schema. Contract drift between frontend expectations and actual API responses cannot be caught during development or CI. A backend change that removes or renames a field breaks frontend silently.
- **Fix:** Add response validation schemas for all endpoints. Integrate into route registry with optional strict mode for CI validation.
