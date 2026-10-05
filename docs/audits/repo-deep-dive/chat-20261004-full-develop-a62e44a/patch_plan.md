# Patch plan

## SEC-P0-001 - Production deploy created `users_select USING (true)` exposing all users (fixed)

n/a

## API-P1-001 - `/metrics` readable by any authenticated user (fixed)

n/a

## CI-P1-001 - Production provision/deploy ran destructive Terraform with no approval (fixed)

n/a

## CI-P1-002 - Security scans were non-blocking (fixed)

n/a

## EXEC-P1-001 - Release gate must remain conditional pending P1/P2 remediation

Re-run owning domains after remediation.

## FEAT-P1-001 - `/v1/auth/magic-link` did not send a magic link (fixed)

n/a

## FEAT-P1-002 - Webhook retries were in-process setTimeout, not durable (fixed)

n/a

## FINAL-P1-001 - Release gate must remain conditional pending P2 remediation

Close the webhook-encryption/SSRF and RLS-in-CI items before an unconditional GO.

## OBS-P1-001 - No alerting wired despite metrics and a tracked TODO (fixed)

n/a

## RLS-P1-001 - Global `users_select USING (true)` policy (fixed)

n/a

## SC-P1-001 - Credential committed to the repository (fixed)

n/a

## SEC-P1-001 - Seed workflow could re-open global user RLS / seed shared-password accounts (fixed)

n/a

## SEC-P1-002 - Tracked credential file `test-signin.json` (fixed)

n/a

## SEC-P1-003 - Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed)

n/a

## SEC-P1-004 - SSH was open to the internet by default (fixed)

n/a

## TEST-P1-001 - E2E tests skipped without `test-signin.json` and were non-blocking (fixed)

n/a

## WH-P1-001 - Webhook retries were not durable (fixed)

n/a

## ACM-P2-001 - RBAC matrix is enforced per-route but not documented as a single ARtifact

Add an authz annotation to the route registry and a contract test asserting middleware per route.

## ADMIN-P2-001 - Bulk import / compliance export operated globally (fixed)

n/a

## AI-P2-001 - AI endpoint is a stub with no tenancy/data-governance or rate-limit contract

Define data-governance (no cross-tenant prompt data), per-user rate limits and cost caps before adding a provider.

## API-P2-001 - User input interpolated into PostgREST `.or(...)` filters (fixed)

n/a

## API-P2-002 - `PATCH /v1/auth/status` accepted unvalidated customStatus (fixed)

n/a

## API-P2-003 - Inconsistent error response shapes (fixed)

n/a

## ARCH-P2-001 - Single-node topology: one droplet hosts all services and local Redis

Define an RTO/RPO and either managed Postgres/Redis or a warm standby.

## ARCH-P2-002 - Webhook service used an anonymous Supabase client (fixed)

n/a

## BP-P2-001 - In-repo branch-protection gate covers only `main`, not `develop`

Record the live ruleset for develop and extend the in-repo gate.

## CHAIN-P2-001 - Webhook SSRF + missing encryption key form a plausible internal-reach chain

Fix the SSRF redirect guard and deliver the encryption key through the compose stack.

## CI-P2-001 - `infra-development` destroys infra on every push to `develop`

Gate behind `environment: development` with manual approval, or scope to a dry run.

## CI-P2-002 - Auto-commit workflows hold `contents: write` and push to main/develop

Use a scoped bot token / PR-based update instead of direct push.

## CI-P2-003 - `develop` (auto-deploy target) is not covered by the branch-protection gate

Extend the gate to develop or make production only deploy from a protected branch.

## CI-P2-004 - `workflow_dispatch` inputs interpolated into `run:` (script injection) (fixed)

n/a

## DATA-P2-001 - Duplicate `add_user_groups` migrations

Squash/drop one migration and add an order/duplicate gate.

## DATA-P2-002 - `gdpr_delete_user` is a hard multi-table delete with partial coverage

Cover every FK table or use ON DELETE CASCADE with a documented retention matrix.

## DATA-P2-003 - Deploy workflows seeded production with test users (fixed)

n/a

## DATA-P2-004 - Rollback scripts were only proven to exist (fixed)

n/a

## EXEC-P2-001 - Prior pilot register self-consistency (stale-base false positive) corrected

n/a

## FEAT-P2-001 - Webhook idempotency key was regenerated per attempt (fixed)

n/a

## FEAT-P2-002 - Naive input sanitizer blocked legitimate content (fixed)

n/a

## FILE-P2-001 - Uploads return a public URL from `chat-uploads` and trust client-declared content type

Sniff magic bytes server-side, block SVG/HTML, and use private buckets with short-lived signed download URLs.

## FINAL-P2-001 - Dependency risk-acceptances expire 2027-01-04

Track the expiry and remediate.

## INFRA-P2-001 - Single-droplet infrastructure has no environment isolation

Separate state/workspaces and hosts per environment.

## INV-P2-001 - Stale generated reconciliation artifacts remain tracked at the repository root

Delete the one-off reconciliation artifacts from the tree (keep audit history in docs/audits).

## MT-P2-001 - IDOR: admin dead-letter retry was not tenant-scoped (fixed)

n/a

## MT-P2-002 - Cross-tenant user directory via auth service (fixed)

n/a

## NOTIF-P2-001 - Notifications are delivered only via Web Push; no durable multi-channel delivery/retry

Add a delivery log and retry/fallback channel; prune expired subscriptions.

## OBS-P2-001 - No distributed tracing / correlation to a collector

Add OTLP export + a collector, or document the decision.

## PRIV-P2-001 - GDPR erasure path is a hard multi-table delete with partial coverage

Complete the table coverage and add a retention matrix.

## RES-P2-001 - Single-node failure domains: API, worker, Redis and DB proxy co-resident

Define failure domains and a warm standby; schedule chaos tests.

## RLS-P2-001 - RLS policy test exists but is not executed by CI

Run the RLS SQL test in the validate workflow against a real Postgres service.

## SC-P2-001 - Production web container received the Supabase service-role key (fixed)

n/a

## SC-P2-002 - GitHub Actions were not pinned to commit SHAs (fixed)

n/a

## SC-P2-003 - Dependency vulnerability scanning was advisory-only (fixed)

n/a

## SC-P2-004 - Dependency risk-acceptances expire 2027-01-04

Track the expiry; prefer remediation over renewal.

## SEC-P2-001 - `WEBHOOK_ENCRYPTION_KEY` is not delivered by the production compose stack

Add WEBHOOK_ENCRYPTION_KEY to infra/docker/.env.prod.example and the prod compose for api and worker.

## SEC-P2-002 - Webhook SSRF validation does not constrain redirects or DNS rebinding

Set redirect:'manual' (or re-validate every hop) and re-resolve/pin the IP used for the request.

## TEST-P2-001 - Low coverage thresholds / non-blocking diff coverage (fixed)

n/a

## TEST-P2-002 - RLS tenant-isolation SQL test exists but is not run by CI

Run it in validate against a Postgres service.

## TEST-P2-003 - Migration rollback was validated by file existence only (fixed)

n/a

## WH-P2-001 - Replay/idempotency key was regenerated per attempt (fixed)

n/a

## WH-P2-002 - Webhook delivery follows redirects / does not pin the validated IP (SSRF)

redirect:'manual' + IP-pinned dispatch with per-hop re-validation.

## ACM-P3-001 - Admin `/stats` leaks global cross-tenant counters

Scope users/messages counts to getAdminWorkspaceIds(req).

## ADMIN-P3-001 - Admin error buffer is in-memory only (lost on restart)

Ship admin errors to the structured logger/Sentry sink.

## ARCH-P3-001 - Worker health/metrics bind loopback but rely on a shared token

Rotate the metrics token with the secret-rotation runbook.

## BP-P3-001 - Server-side environment/ruleset configuration is not verifiable from source

Capture the live settings into docs/operations as an evidence snapshot.

## CHAIN-P3-001 - Public upload URL + client-declared content type is a stored-content risk

Private bucket + magic-byte validation + strict Content-Disposition.

## CI-P3-001 - 13 workflows omit an explicit `permissions:` block

Add least-privilege permissions to every workflow.

## CTR-P3-001 - Containers lack runtime hardening beyond non-root and digest pinning

Add cap_drop:[ALL], no-new-privileges, read_only + tmpfs, and a seccomp profile.

## CTR-P3-002 - First-party images are referenced by mutable tag (`:latest`/`:dev`)

Deploy by image digest emitted from build-push.

## DET-P3-001 - [DEP] trivy not installed (dependency vuln scan skipped)

TBD

## DET-P3-002 - [SUPPLY] 9 container image(s) without a digest pin

TBD

## DET-P3-003 - [SUPPLY] hadolint not installed (Dockerfile lint skipped)

TBD

## DOC-P3-001 - Deployment policy contradicts the development deploy workflow (DB changes)

Reconcile the policy with the actual workflow.

## DOC-P3-002 - Stale one-off reconciliation docs remain in the tree

Remove or archive.

## DR-P3-001 - No evidence of an executed restore drill / RPO-RTO validation

Run a restore drill and commit the result under docs/operations.

## EVOL-P3-001 - No extension/plugin contract or versioned public API surface

Document a versioning/deprecation policy and an extension contract.

## FILE-P3-001 - No per-tenant/user quota or total-storage cap on uploads

Add per-user quota and a cleanup/retention job (worker cleanup exists for other data).

## HYGIENE-P3-001 - Tracked shell scripts lacked the exec bit (fixed)

n/a

## HYGIENE-P3-002 - Duplicated logic/schema and one-off scripts remain

Consolidate duplicates and move one-off generators under scripts/audits with an owner.

## HYGIENE-P3-003 - Unresolved operational-metrics TODO (fixed)

n/a

## INFRA-P3-001 - Terraform state/backend and provider versions exist but drift checks are absent

Add `terraform plan` on PR and a scheduled drift detection.

## INV-P3-001 - Committed audit/hardening bundles inflate the repository tree

Move generated mirrors to releases/artifacts; keep the canonical run only.

## INV-P3-002 - Character-encoding (mojibake) artifacts remain in workflow/log text

Normalise to ASCII/UTF-8 with an editor pass.

## IR-P3-001 - No evidence of a conducted incident tabletop exercise

Run a tabletop and commit the scenario + actions.

## MOB-P3-001 - Service worker offline strategy is not covered by tests or a documented cache policy

Document the cache policy and add an SW update test.

## MT-P3-001 - Admin `/stats` returns global cross-tenant counts (residual)

Scope the users/messages counts.

## NOTIF-P3-001 - Push subscription lifecycle (revocation/expiry) is not monitored

Track push delivery outcomes and prune 404/410 endpoints.

## OBS-P3-001 - Error tracking (Sentry) is optional and admin error buffer is in-memory

Require a DSN in production and persist admin errors.

## PERF-P3-001 - No performance budget / regression gate in CI

Add p95 budgets and a nightly trend dashboard.

## PRIV-P3-001 - No automated data-retention enforcement

Implement a retention scheduler and record the policy.

## REL-P3-001 - CHANGELOG has no generator/CI gate

Adopt changesets or commitlint with a release-notes job.

## RES-P3-001 - Chaos and load tests are not part of a scheduled pipeline

Add a nightly chaos/load budget run.

## SBOM-P3-001 - SBOMs are generated but not signed or attested

Sign SBOMs (cosign attest) and publish a provenance attestation.

## SBOM-P3-002 - No license policy / dependency-review gate

Add a license allow-list gate and dependency-review on PRs.

## SC-P3-001 - Large binary archives committed to the repository

Move archives to release assets / object storage.

## SEARCH-P3-001 - No documented search data-flow / retention statement

Document that search is in-database and tenant-scoped, or add a search design doc if one is introduced.

## SECRET-P3-001 - Secret rotation is documented but not scheduled or monitored

Add an inventory with owners + last-rotated dates and an alert on overdue rotation.

## SECRET-P3-002 - `.env` example files diverge between environments

Generate env examples from a single schema.

## USE-P3-001 - No end-to-end onboarding assertion for the invitation/membership flow

Add an invite/accept E2E scenario.

## UX-P3-001 - Accessibility is audited by an ad-hoc script, not a CI gate

Run axe on key routes in CI with a violation budget.

