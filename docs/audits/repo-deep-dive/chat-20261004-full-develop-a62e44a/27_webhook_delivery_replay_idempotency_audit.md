# 27_webhook_delivery_replay_idempotency_audit — Prompt 27 - Webhook Delivery, Replay, and Idempotency Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `27_webhook_delivery_replay_idempotency_audit.md` (area WH, prompt)

## Verification Performed

Replay/idempotency/durability
walk of the webhook pipeline. Delivery is durable and idempotent; the SSRF
redirect gap is carried here as the webhook-domain owner.

## Findings

| ID | Severity | Title |
|---|---|---|
| WH-P1-001 | P1 | Webhook retries were not durable (fixed) |
| WH-P2-001 | P2 | Replay/idempotency key was regenerated per attempt (fixed) |
| WH-P2-002 | P2 | Webhook delivery follows redirects / does not pin the validated IP (SSRF) |
