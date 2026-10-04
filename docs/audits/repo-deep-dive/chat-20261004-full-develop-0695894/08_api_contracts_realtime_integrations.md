# 08 — API Contracts, Realtime & Integrations

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

HTTP contract consistency, OpenAPI coverage, realtime events, webhooks, and third-party integrations (LiveKit, push/email).

## Evidence Reviewed

- `apps/api/src/app.ts`, `route-registry.ts`, `modules/openapi/routes.ts`, `modules/openapi/__tests__/openapi-coverage.test.ts`
- `apps/api/src/lib/postgrest-filter.ts`, `middleware/error-handler.ts`, `lib/app-error.ts`
- `apps/api/src/validators/auth.ts`, `modules/auth/routes.ts`
- `apps/api/src/lib/socket.ts`, `modules/webhooks/*`, `modules/notifications/*`

## Verification Performed

- Re-checked each contract finding from the prior base audit against HEAD.
- Confirmed `/metrics` now requires a dedicated token.
- Confirmed PostgREST filter inputs are normalized/quoted.
- Confirmed `customStatus` is validated.
- Confirmed an OpenAPI coverage test now exists.

## Executive Summary

All contract findings from the prior base audit are resolved at `0695894`. Error handling is centralized, PostgREST filter interpolation is replaced with a helper, `customStatus` is schema-validated, `/metrics` requires a token, and an OpenAPI coverage test compares documented routes against the mounted router. No new contract findings were identified.

## Inventory

| Endpoint group | Base | Evidence |
|---|---|---|
| Auth | `/v1/auth` | `route-registry.ts` |
| Workspaces | `/v1/workspaces` | `route-registry.ts` |
| Webhooks | `/v1` | `route-registry.ts` |
| Admin | `/v1/admin` | `route-registry.ts` |
| OpenAPI | `/v1/openapi.json` | `modules/openapi/routes.ts` |
| Metrics | `/metrics` | `app.ts:103` (`requireMetricsAccess`) |

## Reconciliation of prior API findings

| Prior ID | Verdict at HEAD | Evidence |
|---|---|---|
| API-P1-001 (`/metrics` any authenticated user) | `verified-fixed` | `apps/api/src/app.ts:103` uses `requireMetricsAccess` (`middleware/metrics-auth.ts`). |
| API-P2-002 (inconsistent error shapes) | `verified-fixed` | `apps/api/src/modules/admin/__tests__/admin-error-envelope.test.ts` asserts the envelope. |
| API-P2-003 (input in PostgREST `.or`) | `verified-fixed` | `apps/api/src/lib/postgrest-filter.ts` (`containsPattern`, `quotePostgrestValue`) with `postgrest-filter.test.ts`. |
| API-P2-004 (unvalidated `customStatus`) | `verified-fixed` | `apps/api/src/validators/auth.ts:12-25` caps length at 100 and rejects control chars. |
| API-P3-005 (OpenAPI coverage) | `verified-fixed` | `openapi-coverage.test.ts` diffs mounted routes against the documented spec. |

## Findings

No new findings identified at commit `0695894`.

## Risks

- Residual webhook SSRF redirect risk is tracked as SEC-P2-002.

## Recommendations

1. Keep the OpenAPI coverage test blocking.

## Quick Wins

- None.

## Hardening Backlog

- Publish a Socket.io event catalog.

## Suggested Tests

- Error-envelope contract test (present).
- Filter-fuzzing test (present).

## Suggested Documentation Updates

- Realtime event catalog.

## Open Questions

- Does `validateWebhookUrl` pin the validated IP to the connection? No — see SEC-P2-002.

## Appendix

- `/metrics` is defined directly in `app.ts` outside the route registry.
