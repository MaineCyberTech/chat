# Principal Audit Report

- Prompt: **platform_readiness_expansion**
- Domain: **features**
- Run ID: **platform_readiness_expansion_20260701_073216**
- Generated: **2026-07-01T07:32:14Z**
- Decision: **NO-GO**
- P0: **2**, P1: **3**
- P2: **2**, P3: **1**
- Readiness: **27.00**

## Findings

### P0 — TypeScript types are severely out of sync with DB schema — 6 types defined vs 16 tables exist; soft-delete fields missing

- **File:** `packages/db/src/types.ts`
- **Category:** shared_types
- **Impact:** Feature expansion will produce type errors across all packages; developers forced to use 'any'
- **Fix:** Run supabase gen types typescript --local > packages/db/src/types.ts before starting feature implementation; add CI check for type-schema drift

### P0 — No background job infrastructure — no job queue (Bull/BullMQ), no worker process, no scheduled task framework

- **File:** ``
- **Category:** worker_needs
- **Impact:** Notification fanout, webhook delivery retry, search indexing, and media processing all require async workers; current architecture handles these synchronously or not at all
- **Fix:** Design job queue abstraction: Redis-backed BullMQ for Node.js, worker process pattern (apps/worker/), job retry/DLQ handling, scheduled job support for retention/pruning

### P1 — API versioning uses /v1/ prefix but no version negotiation headers (Accept-version, Sunset, Deprecation)

- **File:** `apps/api/src/`
- **Category:** api_versioning
- **Impact:** Expanding API for new features cannot gracefully deprecate old endpoints; breaking changes affect all clients
- **Fix:** Implement version negotiation: Accept-Version header support, Deprecation/Sunset headers on old versions, version migration guide in docs

### P1 — No down/rollback scripts for any existing 26 migrations — feature expansion adds more migrations without rollback capability

- **File:** `supabase/migrations/`
- **Category:** migration_discipline
- **Impact:** Schema changes for 11 new features will compound the rollback problem; forward-fix becomes only option
- **Fix:** Write down scripts for existing ALTER TABLE migrations (#14-16); mandate down scripts for all future migrations

### P1 — No business analytics or feature usage tracking — cannot measure adoption of new features

- **File:** ``
- **Category:** observability
- **Impact:** Cannot determine whether feature investments (threads, mentions, search) are being used or are having impact
- **Fix:** Add feature usage tracking: create feature_events table (event_type TEXT, user_id, metadata JSONB); instrument feature entry points; create adoption dashboard

### P2 — No realtime event naming convention or registry — socket events are ad-hoc in service files

- **File:** ``
- **Category:** package_boundaries
- **Impact:** New feature realtime events will have inconsistent naming; clients must reverse-engineer event payloads
- **Fix:** Create realtime event registry (TypeScript enum or const object) in packages/realtime/ with typed payloads for all events

### P2 — No API contract validation between frontend and backend — types are duplicated or manually maintained

- **File:** ``
- **Category:** shared_types
- **Impact:** Frontend/backend contract drift for new features will cause silent production failures
- **Fix:** Create packages/contract/ with shared API request/response types shared between apps/api and apps/web; add JSON Schema validation or use tRPC

### P3 — Feature flags exist in DB but are not wired to code — cannot dark-launch new features

- **File:** ``
- **Category:** feature_flag_infrastructure
- **Impact:** New features must be deployed all-at-once; no gradual rollout or kill-switch capability
- **Fix:** Wire featureFlagService.evaluateFlag() into feature boundaries before implementing new features; set up flag evaluation in frontend via API
