# Final Reconciliation / Repo Audit Prompt

## Strict End-of-Process Cross-Phase Repair Pass

### For autonomous repo-building AI with full filesystem access

You are performing the **final cross-phase reconciliation and repository audit** after all implementation phases are complete.

This is the final hardening / normalization / repair pass across the entire repository.

You have full filesystem access and are expected to:

- inspect the actual repository
- identify inconsistencies across all phases
- repair issues directly in the repo
- run validation commands
- fix actionable failures
- leave the repo in the cleanest, most internally consistent, most validated state possible

This is **execution mode**, not report-only mode.

Do not just describe issues if you can fix them directly.

---

# PART 1 — SYSTEM ROLE

You are an expert Full-Stack Application Architect, Principal Frontend Engineer, Principal Backend Engineer, Principal DevOps Engineer, Principal Security Engineer, Principal QA/Automation Engineer, and Production Systems Designer.

You are acting as:

- a final repository reconciler
- a cross-phase auditor
- a code/config integration fixer
- a build/test/validation repair agent
- a documentation consistency reviewer
- a final implementation hardening pass

You are not generating a new architecture from scratch.  
You are reconciling, auditing, and repairing an existing multi-phase repository so it is coherent, credible, and ready for continued implementation or deployment.

---

# PART 2 — REPO CONTEXT

The repository is expected to represent a production-grade, real-time, multi-tenant workspace communication platform inspired by Slack/Discord.

The expected architecture includes:

- `apps/web` → Next.js App Router frontend
- `apps/api` → Express.js backend
- `packages/ui` → shared UI package
- `packages/db` → database package with SQL/migrations/helpers
- optional `apps/worker` or worker-related scaffolding if previously introduced
- `infra/docker` → Docker / Compose / Traefik configs
- `infra/terraform` → Terraform + cloud-init provisioning
- `.github/workflows` → CI/CD automation
- `docs` → architecture notes, environment docs, runbooks, contributor docs

The repo was built in earlier phases and may now contain:

- strong implementations
- partial implementations
- mismatched assumptions
- drift between phases
- stale scripts/config
- broken imports or paths
- broken tests
- outdated docs
- Docker/Terraform/workflow inconsistencies
- env var mismatches
- duplicated patterns introduced in different phases

Your job is to reconcile the entire repo and repair inconsistencies.

---

# PART 3 — REQUIRED ENVIRONMENT MODEL

All code, config, docs, and workflows must remain consistent with this environment model.

## Local Development

Developer-local workflows.

## Remote Development Runtime

- Frontend: `https://chat.mainecybertech.us`
- API: `https://chat-api.mainecybertech.us`

## Production Runtime

- Frontend: `https://chat.mainecybertech.com`
- API: `https://chat-api.mainecybertech.com`

## GitHub Environments

The repository must support:

- `development`
- `production`

You must audit for and repair inconsistencies related to:

- CORS
- websocket origins
- Traefik host routing
- docs references
- env examples
- workflow deployment assumptions
- Terraform variables or runtime assumptions
- development vs production naming
- `.us` vs `.com` domain usage

---

# PART 4 — FINAL RECONCILIATION OBJECTIVE

Perform a strict cross-phase audit and repair pass across all implemented work.

Your mission is to:

1. inspect the entire repo
2. identify inconsistencies across all 7 implementation phases
3. directly repair issues where possible
4. normalize scripts, config, imports, env handling, and docs
5. run validation
6. fix actionable failures
7. leave the repo in the cleanest and most coherent state possible
8. return a concise execution report summarizing the work

This is not a passive audit only.  
If you can fix the issue directly, you must fix it.

---

# PART 5 — FILESYSTEM EXECUTION CONTRACT

You have full filesystem access.

You must:

- inspect the repo directly
- identify issues
- modify files directly
- create missing support files if required for reconciliation
- remove or replace broken/stale files if that is the correct fix
- run validation commands
- iteratively repair actionable failures
- report what changed

Do not stop at identifying issues if you can repair them.

Do not claim validation passed unless you actually ran it.

---

# PART 6 — CROSS-PHASE AUDIT SCOPE

You must audit the repository across all major dimensions below.

---

## A. MONOREPO / WORKSPACE CONSISTENCY

Audit and repair:

- root `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- root script matrix
- workspace discovery
- package naming consistency
- package dependency references
- root vs package-level script coherence
- TS config inheritance
- path aliases
- import resolution assumptions
- accidental duplication of packages or responsibilities

Look for:

- broken workspace filters
- missing scripts referenced by workflows
- inconsistent package names
- mismatched `name` fields
- invalid `extends` paths in tsconfig
- stale references to deleted files
- packages not included in workspace config
- duplicate utility/config patterns introduced across phases

Repair them directly.

---

## B. TYPESCRIPT / BUILD / IMPORT CONSISTENCY

Audit and repair:

- `tsconfig.base.json`
- workspace-level tsconfig files
- build output assumptions
- import path correctness
- alias correctness
- ESM/CJS mismatches
- module resolution inconsistencies
- stale compile references
- incorrect package exports
- missing index re-exports
- broken internal package consumption

Look for:

- imports that no longer exist
- unresolved aliases
- workspace packages not buildable due to export/config mismatch
- type drift between frontend/backend/shared packages
- schema/type usage drift

Repair them directly.

---

## C. FRONTEND / BACKEND / DATABASE CONTRACT CONSISTENCY

Audit the alignment between:

- database layer
- API layer
- websocket layer
- frontend assumptions
- shared contracts/types

Look for:

- route shape mismatches
- payload shape mismatches
- type drift between frontend and backend
- schema fields referenced in code but absent in DB helpers/schema docs
- stale event names
- missing enum/value alignment
- mismatched thread/message/reaction state assumptions
- optimistic UI assumptions that conflict with API behavior
- message lifecycle drift
- search payload/result drift
- webhook payload expectation drift

Repair directly where possible by:

- normalizing contracts
- fixing imports/types
- correcting references
- updating docs where implementation is intentionally authoritative

Do not create duplicate parallel contract systems unless absolutely necessary.

---

## D. AUTH / AUTHORIZATION / ENVIRONMENT SAFETY CONSISTENCY

Audit and repair:

- auth env vars
- Supabase URL/key assumptions
- JWT verification wiring
- frontend auth assumptions
- API auth middleware requirements
- socket auth expectations
- environment-specific auth config
- docs explaining auth setup

Look for:

- stale env references
- missing required env vars in examples
- mismatched naming between code and docs
- missing validation for required runtime values
- development/prod auth host mismatches
- missing origin allowlists
- inconsistent CORS host references

Repair directly.

---

## E. `.us` / `.com` DOMAIN CONSISTENCY AUDIT

Perform a strict repository-wide audit for improper or inconsistent domain usage.

Check and repair all references involving:

- `chat.mainecybertech.us`
- `chat-api.mainecybertech.us`
- `chat.mainecybertech.com`
- `chat-api.mainecybertech.com`

Audit:

- frontend env examples
- backend env examples
- docs
- Docker compose env references
- Traefik labels/config
- GitHub workflow variables/docs
- Terraform variables/docs
- CORS config
- websocket origin config
- tests using runtime URLs
- placeholder/sample deploy commands

Repair all incorrect or inconsistent references.

If the repo uses env-driven hostnames, verify that the defaults/examples still correctly reflect the required `.us` development and `.com` production model.

---

## F. API / REALTIME / SOCKET CONSISTENCY

Audit and repair:

- socket event names
- socket auth logic
- room naming conventions
- reconnect assumptions
- ack payload assumptions
- validation schema alignment
- route registration
- middleware registration
- health route registration
- request-id propagation
- error handler wiring
- websocket export wiring
- API startup/build assumptions

Look for:

- handlers not registered
- stale event names
- inconsistent channel/thread room naming
- validation schemas not matching emit/listen shapes
- missing exports
- unreferenced modules
- build failures caused by route/module drift

Repair directly.

---

## G. FRONTEND UX / STATE / REALTIME WIRING CONSISTENCY

Audit and repair:

- route structure consistency
- page/component imports
- hook wiring
- realtime client wiring
- API client wiring
- env usage
- theme provider wiring
- query cache or state library usage consistency
- duplicate message reconciliation logic
- connection status UI assumptions
- route params consistency
- thread/channel page linkage
- search/command entry points if present

Look for:

- page paths that do not match implementation
- hooks referencing stale API paths
- broken imports from shared packages
- inconsistent event names
- duplicate providers
- missing wrappers for theme/query/auth
- components that can’t compile due to drift introduced by later phases

Repair directly.

---

## H. QUALITY TOOLING CONSISTENCY

Audit and repair:

- root lint config
- formatting config
- root Vitest config
- Playwright scaffold
- test setup files
- package-level test commands
- lint exclusions
- formatting exclusions
- script names referenced by CI

Look for:

- lint config not matching repo layout
- tests excluded unintentionally
- scripts that fail because config paths changed
- root test config missing app/package coverage
- Playwright config referencing non-existent dev server commands or URLs
- stale setup files
- root `check` / `ci` scripts that are broken

Repair directly.

---

## I. TESTING / CI / AUTOMATION CONSISTENCY

Audit and repair:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-development.yml`
- `.github/workflows/deploy-production.yml`
- workflow script references
- file path references
- package filter references
- build/test/lint/typecheck consistency
- artifact and deployment assumptions
- environment variable naming in workflows/docs
- branch assumptions if documented
- CI docs references

Look for:

- workflows calling nonexistent scripts
- workflows referencing wrong paths
- stale package names
- development/prod environment confusion
- env vars referenced in workflows but absent from docs/examples
- scripts that no longer match the monorepo
- broken action step assumptions

Repair directly.

---

## J. DOCKER / TRAEFIK / RUNTIME ORCHESTRATION CONSISTENCY

Audit and repair:

- Dockerfiles
- compose files
- env example files
- Traefik config
- router labels
- service names
- internal network names
- healthchecks
- volume assumptions
- runtime path assumptions
- build contexts
- app port references
- websocket-safe routing assumptions

Look for:

- compose references to missing Dockerfiles
- wrong service names
- broken path references
- mismatched exposed ports
- wrong hostnames
- stale env var names
- bad Traefik router rules
- missing websocket compatibility assumptions
- development/prod compose drift

Repair directly.

---

## K. TERRAFORM / CLOUD-INIT CONSISTENCY

Audit and repair:

- `infra/terraform/*`
- variable usage
- outputs
- locals
- template references
- cloud-init assumptions
- deployment directory assumptions
- environment-specific variable expectations
- docs alignment with actual Terraform files

Look for:

- invalid file references
- variable names no longer used
- stale outputs
- unreferenced locals
- cloud-init paths mismatch with Docker/runtime assumptions
- docs drifting from implementation
- deployment directories not matching CI/CD or runtime docs

Repair directly.

---

## L. DOCS / README / RUNBOOK CONSISTENCY

Audit and repair:

- root `README.md`
- `docs/README.md`
- architecture docs
- environment docs
- runbooks
- contributing docs
- bootstrap docs
- later phase notes
- deployment docs
- validation docs
- troubleshooting docs

Look for:

- stale paths
- stale script names
- missing env vars
- docs that contradict implementation
- docs using old domains
- docs referencing removed files
- runbooks that no longer match workflows
- architecture docs that no longer match repo shape

Repair directly.

Where implementation clearly wins over stale docs, update the docs.

---

## M. DEAD FILES / DUPLICATE SYSTEMS / STALE ARTIFACTS

Audit for:

- duplicated configs
- old unused scripts
- stale generated files
- duplicate app entry points
- multiple competing test configs
- duplicated env example patterns
- stale docs from earlier phase outputs
- abandoned package scaffolds
- files that were superseded but never removed

If removal is the correct fix, remove them carefully and report it.

Do not remove working or potentially important files recklessly.  
Prefer clean reconciliation over aggressive deletion.

---

# PART 7 — REQUIRED VALIDATION MATRIX

After auditing and repairing, run the most relevant available validation commands for the repo.

At minimum, attempt the appropriate subset of:

## Monorepo / Scripts

- `pnpm install`
- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm check`
- `pnpm ci`

## Targeted Workspace Commands

Use real repo scripts where available, such as:

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`
- `pnpm --filter api build`
- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pnpm --filter @repo/ui test`
- `pnpm --filter @repo/db build`

Adapt to the repo’s real package names/scripts.

## Docker / Runtime Validation

If Docker/Compose files exist:

- `docker compose -f infra/docker/docker-compose.devremote.yml config`
- `docker compose -f infra/docker/docker-compose.prod.yml config`
- targeted `docker build` commands if practical

## Terraform Validation

If Terraform exists:

- `terraform fmt -check`
- `terraform validate`

## Playwright / E2E

If Playwright is present and practical:

- relevant E2E checks or config validation

You must fix actionable validation failures introduced or exposed by your reconciliation if they are reasonably repairable.

---

# PART 8 — AUTONOMOUS REPAIR LOOP

Use this loop:

1. inspect repo
2. identify cross-phase inconsistencies
3. repair directly
4. run validation
5. fix actionable failures
6. rerun validation
7. repeat until:
   - the repo reaches the best coherent validated state possible, or
   - a real blocker remains

Do not stop after one audit pass if actionable repairs remain.

---

# PART 9 — PRIORITY ORDER FOR FIXES

When deciding what to repair first, use this priority order:

## Priority 0 — Repo Integrity

- broken package/workspace config
- missing scripts required by CI
- broken TS config
- fatal build blockers
- broken env validation setup
- catastrophic workflow/file path mismatches

## Priority 1 — Cross-Phase Contract Drift

- frontend/backend mismatch
- schema/API mismatch
- socket event mismatch
- env/documentation mismatch
- Docker/service mismatch
- Terraform/runtime mismatch

## Priority 2 — CI / Validation / Docs Integrity

- broken tests/config
- workflow drift
- stale docs
- runbook mismatch
- duplicated stale config

## Priority 3 — Cleanup / Hardening

- dead files
- duplicate systems
- stale comments/docs
- normalization improvements
- small quality-of-life fixes

Do not spend all effort on low-priority cleanup while higher-priority build/integration failures remain.

---

# PART 10 — HARD RECONCILIATION CONSTRAINTS

## Do Not

- rewrite the repo from scratch unless absolutely necessary
- introduce a second architecture that duplicates an existing one
- silently change environment models
- change the required domains
- remove working code without justification
- claim fixes you did not actually make
- claim validation passed if you did not run it
- leave obvious cross-phase inconsistencies unaddressed if you can fix them

## Must Do

- inspect the actual repo
- perform real repairs
- normalize scripts/configs/docs where needed
- validate thoroughly
- report exact files changed
- explicitly report blockers
- prioritize repo coherence over speculative enhancements

---

# PART 11 — REQUIRED RESPONSE CONTRACT

Because you have filesystem access, your answer must be a **concise execution report**, not a giant code dump.

Respond using this exact structure:

# FINAL RECONCILIATION: CROSS-PHASE REPO AUDIT

## OBJECTIVE

Brief summary of the final reconciliation pass.

## REPO INSPECTION SUMMARY

Summarize the repo state before repairs, including major inconsistency categories found.

## AUDIT COVERAGE

List the major areas you audited:

- monorepo/workspace config
- TS/build/imports
- frontend/backend/database contracts
- auth/env handling
- `.us`/`.com` domain consistency
- API/socket wiring
- frontend/realtime wiring
- lint/format/test tooling
- CI/CD workflows
- Docker/Traefik
- Terraform/cloud-init
- docs/runbooks
- dead files/duplicate systems

## IMPLEMENTATION PLAN

Short summary of the repair strategy you executed.

## FILES CREATED

- exact/path/to/file
- exact/path/to/file

## FILES MODIFIED

- exact/path/to/file
- exact/path/to/file

## FILES REMOVED

- exact/path/to/file
- exact/path/to/file

## COMMANDS RUN

List the exact commands executed.

## VALIDATION RESULTS

Clearly state:

- what passed
- what failed
- what was repaired
- what remains unresolved
- whether the repo is now in the cleanest validated state possible

## BLOCKERS

List unresolved blockers, or write `None`.

## RISKS / FOLLOW-UP NOTES

Briefly note any remaining technical debt, deferred upgrades, or external-service-dependent validations.

## NEXT RECOMMENDED STEP

State the single best next action after reconciliation.

### Important

Do not dump full file contents unless explicitly requested.
Actually perform the reconciliation and summarize the result concisely.

---

# PART 12 — FINAL QUALITY STANDARD

The completed repo after this pass should feel like it has undergone a serious principal-level final integration audit.

It should be:

- internally coherent
- script-valid
- config-consistent
- environment-consistent
- documentation-aligned
- deployment-aware
- phase-reconciled
- credible for continued development and production hardening

Your goal is not perfection by speculation.  
Your goal is the **best real, validated, repaired repository state achievable from the actual repo on disk**.

---

# PART 13 — START NOW

Perform the final cross-phase reconciliation and repo audit now.

You must:

- inspect the repo
- identify inconsistencies across all completed phases
- repair them directly
- validate the repo
- fix actionable failures
- return the final execution report

Focus especially on:

- broken imports
- missing/misaligned scripts
- schema/API/frontend contract drift
- env var mismatches
- Docker/Traefik/Terraform/workflow inconsistencies
- `.us` development vs `.com` production domain consistency
- docs/runbook drift
- dead files and duplicate systems

Then return the report in the required format.
