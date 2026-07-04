# Principal Audit Report

- Prompt: **incoming_webhook_pipeline**
- Domain: **features**
- Run ID: **incoming_webhook_pipeline_20260703_055339**
- Generated: **2026-07-03T12:00:00.000Z**
- Decision: **NO-GO**
- P0: **1**, P1: **2**
- P2: **1**, P3: **0**
- Readiness: **25.00**

## Findings

### P0 — Webhook secrets stored as plaintext in the `secret` column with no encryption at rest
- **File:** `supabase/migrations/20260625000012_create_webhooks.sql`
- **Category:** secret_storage
- **Impact:** A database dump or SQL injection exposes all webhook secrets, allowing attackers to forge valid HMAC signatures.
- **Fix:** Encrypt secrets at rest using pgcrypto (pgp_sym_encrypt) or application-level AES-GCM; decrypt only in memory at delivery time.

### P1 — DNS rebinding bypass possible: resolveHostname only resolves IPv4 (A records), has no TTL caching, and does not pin resolved IPs
- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** ssrf_protection
- **Impact:** An attacker controlling DNS for their webhook URL can initially resolve to a public IP, pass validation, then switch to 10.0.0.1.
- **Fix:** Add AAAA (IPv6) resolution, enforce minimum TTL caching, and validate IP at the connection level.

### P1 — No webhook payload formatter or templating — payload is always { event, ...payload } with raw internal schema
- **File:** `apps/api/src/modules/webhooks/service.ts:232`
- **Category:** payload_formatting
- **Impact:** Consumers receive internal domain schema with no ability to transform fields, rename keys, or inject computed values.
- **Fix:** Add per-webhook format config (JSON template, Liquid/Handlebars) and a transforms pipeline for key mapping.

### P2 — No webhook management frontend UI — no settings page or dialog to create, test, or monitor webhooks
- **File:** `apps/web/components/`
- **Category:** frontend_ui
- **Impact:** Users must interact with the API directly; no visibility into delivery logs, retry status, or dead-letter queue.
- **Fix:** Build a webhook management section in workspace settings with CRUD forms, delivery log viewer, manual retry button, and test-ping endpoint.
