# 03 — Feature Implementation Map

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

Map claimed features to implementation evidence and flag gaps between claim and code (auth, messaging, real-time, webhooks, workers, notifications, search, uploads).

## Evidence Reviewed

- `README.md`, `AGENTS.md` feature tables
- `apps/api/src/modules/**/routes.ts`, `service.ts`
- `apps/worker/src/main.ts`, `apps/worker/src/processors/*`
- `apps/api/src/lib/webhook-queue.ts`, `packages/config/webhook-utils.ts`
- `supabase/migrations/*`

## Verification Performed

- Re-checked the four feature claims that failed the prior audit at `a72b8cc` against HEAD.
- Traced the webhook delivery/retry path end-to-end (API enqueue → BullMQ worker).
- Confirmed the magic-link endpoint now calls Supabase.
- Counted registered worker queues.

## Executive Summary

The prior feature gaps are resolved. Magic-link now sends an email OTP server-side, webhook retries are durable BullMQ jobs with a stable per-delivery idempotency key, and the worker registers all expected processors. No new feature-implementation findings were identified in this domain.

## Inventory

| Feature | Claim | Evidence | Verdict |
|---|---|---|---|
| Magic-link auth | "Magic link authentication" | `apps/api/src/modules/auth/service.ts:67-90` (`signInWithOtp`) | Supported |
| Workspaces/channels/messages | Implemented | module routes + services | Supported |
| Real-time Socket.io | rooms/typing/presence | `apps/api/src/lib/socket.ts` (user-scoped client) | Supported |
| Webhooks (HMAC + SSRF + DLQ) | claim | `apps/api/src/modules/webhooks/service.ts`, `apps/api/src/lib/webhook-queue.ts` | Supported (SSRF redirect caveat, SEC-P2-002) |
| BullMQ processors | claim | `apps/worker/src/main.ts:1-16` (7 queues) | Supported |
| Push (VAPID) | claim | `apps/api/src/modules/notifications/push-subscription-service.ts` | Supported |
| Search (tsvector) | claim | search migrations | Supported |
| File uploads (signed URL) | claim | `apps/api/src/validators/upload.ts` | Supported |

## Reconciliation of prior feature findings

| Prior ID | Verdict at HEAD | Evidence |
|---|---|---|
| FEAT-P1-001 (`/v1/auth/magic-link` no-op) | `verified-fixed` | `apps/api/src/modules/auth/service.ts:67-90` calls `supabase.auth.signInWithOtp`. |
| FEAT-P1-002 (in-process `setTimeout` retries) | `verified-fixed` | `apps/api/src/lib/webhook-queue.ts:46-82` enqueues durable `webhook-delivery` jobs. |
| FEAT-P2-003 (idempotency key regenerated) | `verified-fixed` | `service.ts:214-216,350-362` generates the key once per delivery and passes it to the retry job; `apps/worker/src/processors/webhook-delivery.ts:183,192` reuses it. |
| FEAT-P2-004 (naive SQL sanitizer) | `partially-fixed` | `apps/api/src/middleware/input-sanitizer.ts:17` still exempts only `content`/`notification_prefs`; residual UX risk tracked under hardening backlog. |

## Findings

No new findings identified at commit `0695894`.

## Risks

- None new in this domain; webhook SSRF redirect/DNS-rebinding residual is tracked as SEC-P2-002.

## Recommendations

1. Add an end-to-end test that exercises a webhook through the BullMQ worker.

## Quick Wins

- None.

## Hardening Backlog

- Reduce false positives in `input-sanitizer.ts`.

## Suggested Tests

- Webhook retry survives an API restart.
- Magic-link path asserts an email is enqueued.

## Suggested Documentation Updates

- Keep `AGENTS.md` feature status generated from tests where possible.

## Open Questions

- None.

## Appendix

- Worker processors registered: webhook-delivery, notification, search-indexer, cleanup, data-retention, compliance-export, reminder.
