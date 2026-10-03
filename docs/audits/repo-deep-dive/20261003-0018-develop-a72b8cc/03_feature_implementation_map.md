# 03 — Feature Implementation Map

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Map claimed features to implementation evidence and flag gaps between claim and code, focusing on auth, messaging, webhooks, workers, notifications, search, uploads.

## Evidence Reviewed

- `README.md`, `AGENTS.md` feature tables
- `apps/api/src/modules/**/routes.ts`, `service.ts`
- `apps/worker/src/main.ts`, `apps/worker/src/processors/*`
- `supabase/migrations/*`
- `packages/config/webhook-utils.ts` (referenced)

## Verification Performed

- Sampled headline claims ("magic link auth", "webhook HMAC + SSRF + DLQ", "6 BullMQ processors", "real-time") and checked the corresponding code path.
- Compared worker queue registrations against admin queue-name lists.

## Executive Summary

Most features have real implementations, but several claimed behaviors are only partially wired: the magic-link endpoint is a no-op (the client must call Supabase directly), webhook retries use in-process `setTimeout` instead of the BullMQ worker, and the webhook/push/socket paths use the wrong Supabase role (see ARCH). Claimed "6 BullMQ processors" is supported (7 queues registered).

## Inventory

| Feature | Claim (README/AGENTS) | Evidence | Verdict |
|---|---|---|---|
| Magic link auth | "Magic link authentication" | `apps/api/src/modules/auth/routes.ts:30-40` | Partial (endpoint no-op) |
| Workspaces/channels/messages | Implemented | module routes + services | Supported |
| Real-time Socket.io | rooms/typing/presence | `apps/api/src/lib/socket.ts` | Partial (role mismatch) |
| Webhooks HMAC+SSRF+DLQ | "HMAC + SSRF + circuit breaker + DLQ" | `apps/api/src/modules/webhooks/service.ts` | Partial (broken under RLS, non-durable retry) |
| 6 BullMQ processors | claim | `apps/worker/src/main.ts:105-121` (7 queues) | Supported |
| Push (VAPID) | claim | `apps/api/src/modules/notifications/push-subscription-service.ts` | Partial (anon list) |
| Search (tsvector) | claim | `supabase/migrations/..._create_search.sql`, `..._enhanced_search.sql` | Supported |
| File uploads signed URL | claim | `apps/api/src/validators/upload.ts`, auth avatar route | Supported (with gaps) |

## Findings

### Finding ID: FEAT-P1-001 - `/v1/auth/magic-link` does not send a magic link

- Severity: P1
- Confidence: High
- Area: FEAT
- Evidence:
  - `apps/api/src/modules/auth/routes.ts:30-40` — validates email then `res.json({ success: true, message: "Magic link sent if account exists" })`; no Supabase `signInWithOtp` call.
  - `apps/api/src/modules/auth/service.ts` — no OTP/magic-link method.
- What is happening: The endpoint always reports success without performing any email send.
- Why it matters: callers believe mail was sent; the only path that works is the Web app calling Supabase directly, making the API contract misleading and untestable.
- User / business impact: support confusion; no server-side control over magic-link issuance/rate limiting.
- Security / privacy / reliability impact: medium.
- Recommended fix: implement `supabase.auth.admin.generateLink`/`signInWithOtp` server-side and return a neutral response; or remove the endpoint and document the client-side flow.
- Suggested validation: API test asserts an email is enqueued (or endpoint removed from OpenAPI).
- Owner suggestion: Auth lead
- Effort estimate: S
- Dependencies: None
- Status: open
- Endpoint / data path: `POST /v1/auth/magic-link` → handler → (no storage/email)

### Finding ID: FEAT-P1-002 - Webhook retries are in-process `setTimeout`, not durable

- Severity: P1
- Confidence: High
- Area: FEAT
- Evidence:
  - `apps/api/src/modules/webhooks/service.ts:330-347` — schedule retry via `setTimeout` in the API process
  - `apps/worker/src/processors/webhook-delivery.ts` + `apps/worker/src/main.ts:105` — a BullMQ webhook-delivery processor also exists
  - `AGENTS.md` — claims webhooks use the BullMQ worker
- What is happening: Deliveries processed inline by the API enqueue an in-memory timer; a process restart loses retries. The documented BullMQ path is not the one used by `triggerEvent`.
- Why it matters: failed deliveries are silently dropped; DLQ population is unreliable.
- User / business impact: missing integrations and duplicate/lost events.
- Security / privacy / reliability impact: high reliability.
- Recommended fix: enqueue retries onto the BullMQ `webhook-delivery` queue with `jobId`/delay; remove `setTimeout` scheduling.
- Suggested validation: kill API during a transient failure and confirm retry still executes via worker.
- Owner suggestion: Integrations lead
- Effort estimate: M
- Dependencies: ARCH-P1-001
- Status: open

### Finding ID: FEAT-P2-003 - Webhook idempotency key is regenerated per attempt

- Severity: P2
- Confidence: High
- Area: FEAT
- Evidence:
  - `apps/api/src/modules/webhooks/service.ts:220,240-248` — `idempotencyKey = randomUUID()` computed inside `deliver` per attempt
  - comment at lines 324-325 claims `delivery.id` is the idempotency key
- What is happening: Each delivery/retry sends a new `X-Idempotency-Key`, so receivers cannot deduplicate retries.
- Why it matters: at-least-once delivery becomes at-least-once *with duplicates*, risking double-processing.
- User / business impact: downstream duplicate side effects.
- Security / privacy / reliability impact: medium.
- Recommended fix: derive idempotency key from the delivery/event id persisted before the first attempt.
- Suggested validation: two retries of the same delivery carry the same key.
- Owner suggestion: Integrations
- Effort estimate: S
- Dependencies: FEAT-P1-002
- Status: open

### Finding ID: FEAT-P2-004 - Naive input sanitizer blocks legitimate content

- Severity: P2
- Confidence: Medium
- Area: FEAT
- Evidence:
  - `apps/api/src/middleware/input-sanitizer.ts:17-21` — SQL pattern includes bare words `select|insert|update|delete|drop|…` and `sys`
  - `input-sanitizer.ts:23` — only `content` and `notification_prefs` are exempt
- What is happening: Any string field containing e.g. "select" or "update" is rejected with HTTP 400, and the patterns are bypassable by case/whitespace variants while still blocking ordinary prose.
- Why it matters: false positives break display names, channel names, webhook names, search terms.
- User / business impact: user-facing failures.
- Security / privacy / reliability impact: low security value (no real injection defense given parameterized PostgREST/SQL), medium UX.
- Recommended fix: remove regex SQL "injection" detection (rely on parameterized queries/RLS), keep output encoding; restrict XSS patterns to stored-HTML fields.
- Suggested validation: test creating a channel named "Select Team" succeeds.
- Owner suggestion: API lead
- Effort estimate: S
- Dependencies: None
- Status: open

## Risks

- Claimed integrations fail silently rather than erroring.

## Recommendations

1. Reconcile every README/AGENTS feature claim with an automated status file.
2. Replace ad-hoc retries with the queue-based processor.

## Quick Wins

- Fix webhook idempotency key; exempt safe fields from sanitizer.

## Hardening Backlog

- End-to-end integration test exercising webhooks through BullMQ.

## Suggested Tests

- Webhook retry survives API restart.
- Magic-link endpoint behavior test.

## Suggested Documentation Updates

- Correct `AGENTS.md` webhook/real-time descriptions.

## Open Questions

- Is `packages/config/webhook-utils.ts` `validateWebhookUrl` DNS-rebinding-safe? Not fully reviewed here; see 08.

## Appendix

- `apps/worker/src/processors` includes webhook-delivery, notification, search-indexer, cleanup, data-retention, compliance-export, reminder (7).
