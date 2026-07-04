# Reconciliation Report

- Prompt: **final_reconciliation_repo_audit**
- Domain: **audit**
- Run ID: **final_reconciliation_repo_audit_20260703_062611**
- Generated: **2026-07-03T06:20:00Z**
- Decision: **NO-GO**
- P0: **2**, P1: **3**
- P2: **4**, P3: **2**
- Readiness: **0.00**

## Findings

### P0 — Critical prompt files (final_reconciliation_repo_audit_prompt.md, final_reconciliation_principal_audit_prompt.md, final_full_repo_deep_dive_quality_confirmation_prompt.md) are stubs containing 'Replace this placeholder' - not usable for execution

- **File:** `docs/prompts/final_reconciliation_prompt_pack/`
- **Category:** Naming Inconsistency
- **Impact:** Core reconciliation prompts cannot be executed as-is. The testrun_001/prompts/ directory contains placeholders instead of executable prompts.
- **Fix:** Populate stub prompt files with the full content from final_reconciliation_prompt_pack/FULL_PROMPT_PACK.md phases

### P0 — Dev compose web service depends_on api: condition: service_healthy, but the dev API service has no healthcheck defined (prod compose has it)

- **File:** `infra/docker/docker-compose.devremote.yml`
- **Category:** Env Misalignment
- **Impact:** `docker compose up` will wait indefinitely for the API healthcheck to pass. Dev environment fails to start on fresh deployments.
- **Fix:** Add healthcheck block to dev API service matching the prod pattern, or remove the condition from depends_on

### P1 — All 4 worker processors (webhook-delivery, notification, search-indexer, cleanup) are TODO stubs that return mock responses - no actual work is performed

- **File:** `apps/worker/src/processors/`
- **Category:** Structural Drift
- **Impact:** The worker service runs but does nothing. Webhook delivery, notification processing, search indexing, and cleanup are no-ops. The entire worker infrastructure is cosmetic.
- **Fix:** Implement actual business logic in each processor, or remove the worker if processing happens in-process in the API

### P1 — Dev Dockerfiles use node:20-alpine while production Dockerfiles use node:22-alpine - version mismatch between environments

- **File:** `apps/api/Dockerfile.dev`
- **Category:** Env Misalignment
- **Impact:** Local dev runs on Node 20, production runs on Node 22. Behavior differences between versions may cause production-only bugs.
- **Fix:** Align dev Dockerfiles to use node:22-alpine to match production

### P1 — Terraform variable default droplet_size is s-1vcpu-512mb-10gb but tfvars uses s-2vcpu-2gb - default has not been updated after OOM upgrade documented in AGENTS.md

- **File:** `infra/terraform/variables.tf`
- **Category:** Env Misalignment
- **Impact:** New deployments using defaults will provision undersized droplets that will OOM.
- **Fix:** Update default droplet_size to s-2vcpu-2gb in variables.tf

### P2 — Feature-flags module is the only one with logic in lib/ instead of modules/ with service.ts - every other module has co-located routes.ts + service.ts

- **File:** `apps/api/src/lib/feature-flags.ts`
- **Category:** Structural Drift
- **Impact:** Structural inconsistency makes the codebase harder to navigate. Move feature-flags logic from lib/ to modules/feature-flags/service.ts
- **Fix:** Move feature-flags business logic to modules/feature-flags/service.ts

### P2 — Duplicate migration files: 20260625000007_add_missing_indexes.sql and 20260627000001_add_missing_indexes.sql define overlapping indexes. Two data retention migrations exist (20260625000015, 20260627000002)

- **File:** `supabase/migrations/`
- **Category:** Structural Drift
- **Impact:** Unclear which migration is canonical. Risk of running superseded migrations on new databases.
- **Fix:** Remove superseded migration files after verifying no production migration chain depends on them

### P2 — push-subscription-service.ts is the only service file that doesn't follow service.ts naming convention

- **File:** `apps/api/src/modules/notifications/push-subscription-service.ts`
- **Category:** Naming
- **Impact:** Inconsistent filename pattern. File should be service.ts or live in a subdirectory.
- **Fix:** Rename to service.ts or extract to subdirectory

### P2 — Cloud-init UFW firewall only opens ports 22, 80, 443 but DigitalOcean firewall allows LiveKit ports (7882-7892 UDP, 3478 UDP, 5349 TCP)

- **File:** `infra/terraform/templates/cloud-init.yaml.tftpl`
- **Category:** Env Misalignment
- **Impact:** LiveKit TURN/WebRTC ports blocked by UFW despite DO firewall allowing them. Media/voice calls will fail.
- **Fix:** Add UFW rules for LiveKit ports to cloud-init template

### P3 — 8 docs files still reference the removed infra/docker/traefik/ directory

- **File:** `docs/audits/compare/01_INVENTORY.md`
- **Category:** Stale Docs
- **Impact:** Stale documentation references that confuse readers about the current architecture.
- **Fix:** Update or remove Traefik references from all 8 docs files

### P3 — AGENTS.md claims setup-dev.sh uses wrong migration paths (packages/db/sql/) and that hardening.yml triggers on push/pull_request - both claims are incorrect/stale

- **File:** `AGENTS.md`
- **Category:** Stale Docs
- **Impact:** Incorrect documentation misleads developers about the actual codebase state.
- **Fix:** Update AGENTS.md to reflect current state: correct migration paths and actual hardening.yml triggers
