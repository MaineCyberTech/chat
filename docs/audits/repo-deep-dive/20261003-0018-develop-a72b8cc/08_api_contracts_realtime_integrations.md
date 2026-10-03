# 08 — API Contracts, Realtime & Integrations

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

HTTP contract consistency, versioning, OpenAPI, realtime events, webhooks, and third-party integrations (LiveKit, push/email).

## Evidence Reviewed

- `apps/api/src/app.ts`, `route-registry.ts`, `modules/openapi/routes.ts`, `docs/api/openapi.json`
- `apps/api/src/modules/*/routes.ts` (error shapes), `lib/app-error.ts`, `middleware/error-handler.ts`
- `apps/api/src/lib/socket.ts`, `modules/webhooks/*`, `modules/notifications/push-subscription-service.ts`, `modules/livekit/*`
- `packages/config/webhook-utils.ts` (interface)

## Verification Performed

- Compared error envelopes across representative routes.
- Checked OpenAPI presence and route-registry coverage.
- Traced webhook/LiveKit/push integration paths.
- Verified `/metrics` authorization chain in `app.ts`.

## Executive Summary

Contracts are mostly consistent (`{ error: { code, message } }` via `AppError`), but several admin routes return ad-hoc shapes. `/metrics` is protected only by authentication (any user), and search endpoints interpolate user input into PostgREST `.or()` filters. Realtime/webhook correctness is limited by the anon-client bug (ARCH-P1-001/002).

## Inventory

| Endpoint group | Base | Evidence |
|---|---|---|
| Auth | `/v1/auth` | `route-registry.ts:53-71` |
| Workspaces | `/v1/workspaces` | `route-registry.ts:72-90` |
| Messages/Channels | `/v1` | `route-registry.ts:91-92` |
| Webhooks | `/v1` | `route-registry.ts:93` |
| Admin | `/v1/admin` | `route-registry.ts:108` |
| OpenAPI | `/v1/openapi.json` | `modules/openapi/routes.ts` |
| Socket | `/v1/socket.io` | `lib/socket.ts:50` |

## Findings

### Finding ID: API-P1-001 - `/metrics` is readable by any authenticated user

- Severity: P1
- Confidence: High
- Area: API
- Evidence:
  - `apps/api/src/app.ts:103-106` — `/metrics` uses only `authenticate`, then returns `register.metrics()`
  - `apps/api/src/middleware/authenticate.ts` — any valid token passes
  - `apps/api/src/lib/metrics.ts` — exposes per-channel message counters (`labelNames:["channel_id"]`) and business gauges
- What is happening: Scraping metrics requires only a normal user session.
- Why it matters: per-channel activity and platform-wide counts leak to any user.
- User / business impact: competitive/tenant intelligence leak.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: restrict `/metrics` to a network allowlist or an admin/service token; drop high-cardinality tenant labels.
- Suggested validation: non-admin token receives 403.
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: API-P2-002 - Inconsistent error response shapes in parts of the API

- Severity: P2
- Confidence: Medium
- Area: API
- Evidence:
  - `apps/api/src/modules/admin/routes.ts:358` — `res.status(404).json({ error: "Dead letter not found…" })` (string, not envelope)
  - `apps/api/src/modules/admin/routes.ts:488-491` — uses `{ error: { code, message } }`
  - `apps/api/src/middleware/error-handler.ts` — canonical envelope `{ error: { … , requestId } }`
- What is happening: Some handlers bypass the standard envelope.
- Why it matters: clients/SDK cannot rely on a single error schema.
- User / business impact: client bugs.
- Security / privacy / reliability impact: low-medium.
- Recommended fix: route all errors through `AppError`/`errorHandler`.
- Suggested validation: contract test asserting the envelope for every route.
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: API-P2-003 - User input interpolated into PostgREST filters (`.or(...)`)

- Severity: P2
- Confidence: Medium
- Area: API
- Evidence:
  - `apps/api/src/modules/auth/service.ts:43-46` — `.or(\`display_name.ilike.%${query}%\`)`
  - `apps/api/src/modules/admin/routes.ts:101` — `.or(\`email.ilike.%${search}%,display_name.ilike.%${search}%\`)`
- What is happening: Raw query strings are embedded in PostgREST filter expressions.
- Why it matters: while PostgREST is parameterized at the SQL level, filter-syntax characters (`,` `(` `)` `.`) allow filter manipulation and malformed requests; it's an injection-class anti-pattern.
- User / business impact: unexpected results/errors.
- Security / privacy / reliability impact: low-medium (could widen filters beyond intended columns).
- Recommended fix: use structured `.ilike()` calls and escape/whitelist input; validate allowed characters.
- Suggested validation: fuzz query strings with `(`, `)`, `,`, `%`.
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: API-P2-004 - `PATCH /v1/auth/status` accepts unvalidated `customStatus`

- Severity: P2
- Confidence: Medium
- Area: API
- Evidence:
  - `apps/api/src/modules/auth/routes.ts:187-220` — only `status` is checked; `customStatus` is stored directly to `user_presence.custom_status` and broadcast
- What is happening: An unbounded string is persisted and emitted over sockets.
- Why it matters: stored-content risk/abuse; no length cap.
- User / business impact: UI abuse.
- Security / privacy / reliability impact: low-medium.
- Recommended fix: add a Zod schema (length, charset) and sanitize before broadcast.
- Suggested validation: oversized/typed input returns 400.
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: API-P3-005 - OpenAPI spec coverage/consistency needs verification

- Severity: P3
- Confidence: Low
- Area: API
- Evidence:
  - `docs/api/openapi.json` exists (CI `validate.yml:168-206` only checks `openapi/info/paths` presence)
  - `apps/api/src/route-registry.ts` declares endpoints for only a few routers; most have no `endpoints` metadata
- What is happening: The spec is minimal and not checked against the implemented route registry.
- Why it matters: clients may drift from the API.
- User / business impact: integration friction.
- Security / privacy / reliability impact: low.
- Recommended fix: generate the spec from route definitions or add a route-coverage test.
- Suggested validation: OpenAPI path count matches registered routes.
- Owner suggestion: API lead
- Effort estimate: M
- Dependencies: None
- Status: open

## Risks

- Metrics/PII leak; contract drift.

## Recommendations

1. Lock down `/metrics`.
2. Centralize error handling; add contract tests.
3. Remove string interpolation from filters.

## Quick Wins

- Restrict `/metrics`; replace `.or` interpolations.

## Hardening Backlog

- Generate OpenAPI from code; add Socket event schema docs.

## Suggested Tests

- Error-envelope contract test; filter fuzzing test.
- Socket event authorization test.

## Suggested Documentation Updates

- Real-time event catalog.

## Open Questions

- Does `validateWebhookUrl` protect against DNS rebinding (TOCTOU between validation and fetch)? The URL is re-validated at delivery (`webhooks/service.ts:222`) but DNS can change between check and `fetch` — Unknown/further review.

## Appendix

- `/metrics` and `/` are defined directly in `app.ts` outside the registry.
