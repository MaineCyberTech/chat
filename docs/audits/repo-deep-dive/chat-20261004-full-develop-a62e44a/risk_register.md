# Follow-up register

| Finding | Severity | Title | Owner | Target | Status | Note |
|---|---|---|---|---|---|---|
| SEC-P0-001 | P0 | Production deploy created `users_select USING (true)` exposing all users (fixed) | @owner | SEC | open | n/a |
| API-P1-001 | P1 | `/metrics` readable by any authenticated user (fixed) | @owner | API | open | n/a |
| CI-P1-001 | P1 | Production provision/deploy ran destructive Terraform with no approval (fixed) | @owner | CI | open | n/a |
| CI-P1-002 | P1 | Security scans were non-blocking (fixed) | @owner | CI | open | n/a |
| EXEC-P1-001 | P1 | Release gate must remain conditional pending P1/P2 remediation | @owner | EXEC | open | Re-run owning domains after remediation. |
| FEAT-P1-001 | P1 | `/v1/auth/magic-link` did not send a magic link (fixed) | @owner | FEAT | open | n/a |
| FEAT-P1-002 | P1 | Webhook retries were in-process setTimeout, not durable (fixed) | @owner | FEAT | open | n/a |
| FINAL-P1-001 | P1 | Release gate must remain conditional pending P2 remediation | @owner | FINAL | open | Close the webhook-encryption/SSRF and RLS-in-CI items before an unconditional GO. |
| OBS-P1-001 | P1 | No alerting wired despite metrics and a tracked TODO (fixed) | @owner | OBS | open | n/a |
| RLS-P1-001 | P1 | Global `users_select USING (true)` policy (fixed) | @owner | RLS | open | n/a |
| SC-P1-001 | P1 | Credential committed to the repository (fixed) | @owner | SC | open | n/a |
| SEC-P1-001 | P1 | Seed workflow could re-open global user RLS / seed shared-password accounts (fixed) | @owner | SEC | open | n/a |
| SEC-P1-002 | P1 | Tracked credential file `test-signin.json` (fixed) | @owner | SEC | open | n/a |
| SEC-P1-003 | P1 | Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed) | @owner | SEC | open | n/a |
| SEC-P1-004 | P1 | SSH was open to the internet by default (fixed) | @owner | SEC | open | n/a |
| TEST-P1-001 | P1 | E2E tests skipped without `test-signin.json` and were non-blocking (fixed) | @owner | TEST | open | n/a |
| WH-P1-001 | P1 | Webhook retries were not durable (fixed) | @owner | WH | open | n/a |
| ACM-P2-001 | P2 | RBAC matrix is enforced per-route but not documented as a single ARtifact | @owner | ACM | open | Add an authz annotation to the route registry and a contract test asserting middleware per route. |
| ADMIN-P2-001 | P2 | Bulk import / compliance export operated globally (fixed) | @owner | ADMIN | open | n/a |
| AI-P2-001 | P2 | AI endpoint is a stub with no tenancy/data-governance or rate-limit contract | @owner | AI | open | Define data-governance (no cross-tenant prompt data), per-user rate limits and cost caps before adding a provider. |
| API-P2-001 | P2 | User input interpolated into PostgREST `.or(...)` filters (fixed) | @owner | API | open | n/a |
| API-P2-002 | P2 | `PATCH /v1/auth/status` accepted unvalidated customStatus (fixed) | @owner | API | open | n/a |
| API-P2-003 | P2 | Inconsistent error response shapes (fixed) | @owner | API | open | n/a |
| ARCH-P2-001 | P2 | Single-node topology: one droplet hosts all services and local Redis | @owner | ARCH | open | Define an RTO/RPO and either managed Postgres/Redis or a warm standby. |
| ARCH-P2-002 | P2 | Webhook service used an anonymous Supabase client (fixed) | @owner | ARCH | open | n/a |
| BP-P2-001 | P2 | In-repo branch-protection gate covers only `main`, not `develop` | @owner | BP | open | Record the live ruleset for develop and extend the in-repo gate. |
| CHAIN-P2-001 | P2 | Webhook SSRF + missing encryption key form a plausible internal-reach chain | @owner | CHAIN | open | Fix the SSRF redirect guard and deliver the encryption key through the compose stack. |
| CI-P2-001 | P2 | `infra-development` destroys infra on every push to `develop` | @owner | CI | open | Gate behind `environment: development` with manual approval, or scope to a dry run. |
| CI-P2-002 | P2 | Auto-commit workflows hold `contents: write` and push to main/develop | @owner | CI | open | Use a scoped bot token / PR-based update instead of direct push. |
| CI-P2-003 | P2 | `develop` (auto-deploy target) is not covered by the branch-protection gate | @owner | CI | open | Extend the gate to develop or make production only deploy from a protected branch. |
| CI-P2-004 | P2 | `workflow_dispatch` inputs interpolated into `run:` (script injection) (fixed) | @owner | CI | open | n/a |
| DATA-P2-001 | P2 | Duplicate `add_user_groups` migrations | @owner | DATA | open | Squash/drop one migration and add an order/duplicate gate. |
| DATA-P2-002 | P2 | `gdpr_delete_user` is a hard multi-table delete with partial coverage | @owner | DATA | open | Cover every FK table or use ON DELETE CASCADE with a documented retention matrix. |
| DATA-P2-003 | P2 | Deploy workflows seeded production with test users (fixed) | @owner | DATA | open | n/a |
| DATA-P2-004 | P2 | Rollback scripts were only proven to exist (fixed) | @owner | DATA | open | n/a |
| EXEC-P2-001 | P2 | Prior pilot register self-consistency (stale-base false positive) corrected | @owner | EXEC | open | n/a |
| FEAT-P2-001 | P2 | Webhook idempotency key was regenerated per attempt (fixed) | @owner | FEAT | open | n/a |
| FEAT-P2-002 | P2 | Naive input sanitizer blocked legitimate content (fixed) | @owner | FEAT | open | n/a |
| FILE-P2-001 | P2 | Uploads return a public URL from `chat-uploads` and trust client-declared content type | @owner | FILE | open | Sniff magic bytes server-side, block SVG/HTML, and use private buckets with short-lived signed download URLs. |
| FINAL-P2-001 | P2 | Dependency risk-acceptances expire 2027-01-04 | @owner | FINAL | open | Track the expiry and remediate. |
| INFRA-P2-001 | P2 | Single-droplet infrastructure has no environment isolation | @owner | INFRA | open | Separate state/workspaces and hosts per environment. |
| INV-P2-001 | P2 | Stale generated reconciliation artifacts remain tracked at the repository root | @owner | INV | open | Delete the one-off reconciliation artifacts from the tree (keep audit history in docs/audits). |
| MT-P2-001 | P2 | IDOR: admin dead-letter retry was not tenant-scoped (fixed) | @owner | MT | open | n/a |
| MT-P2-002 | P2 | Cross-tenant user directory via auth service (fixed) | @owner | MT | open | n/a |
| NOTIF-P2-001 | P2 | Notifications are delivered only via Web Push; no durable multi-channel delivery/retry | @owner | NOTIF | open | Add a delivery log and retry/fallback channel; prune expired subscriptions. |
| OBS-P2-001 | P2 | No distributed tracing / correlation to a collector | @owner | OBS | open | Add OTLP export + a collector, or document the decision. |
| PRIV-P2-001 | P2 | GDPR erasure path is a hard multi-table delete with partial coverage | @owner | PRIV | open | Complete the table coverage and add a retention matrix. |
| RES-P2-001 | P2 | Single-node failure domains: API, worker, Redis and DB proxy co-resident | @owner | RES | open | Define failure domains and a warm standby; schedule chaos tests. |
| RLS-P2-001 | P2 | RLS policy test exists but is not executed by CI | @owner | RLS | open | Run the RLS SQL test in the validate workflow against a real Postgres service. |
| SC-P2-001 | P2 | Production web container received the Supabase service-role key (fixed) | @owner | SC | open | n/a |
| SC-P2-002 | P2 | GitHub Actions were not pinned to commit SHAs (fixed) | @owner | SC | open | n/a |
| SC-P2-003 | P2 | Dependency vulnerability scanning was advisory-only (fixed) | @owner | SC | open | n/a |
| SC-P2-004 | P2 | Dependency risk-acceptances expire 2027-01-04 | @owner | SC | open | Track the expiry; prefer remediation over renewal. |
| SEC-P2-001 | P2 | `WEBHOOK_ENCRYPTION_KEY` is not delivered by the production compose stack | @owner | SEC | open | Add WEBHOOK_ENCRYPTION_KEY to infra/docker/.env.prod.example and the prod compose for api and worker. |
| SEC-P2-002 | P2 | Webhook SSRF validation does not constrain redirects or DNS rebinding | @owner | SEC | open | Set redirect:'manual' (or re-validate every hop) and re-resolve/pin the IP used for the request. |
| TEST-P2-001 | P2 | Low coverage thresholds / non-blocking diff coverage (fixed) | @owner | TEST | open | n/a |
| TEST-P2-002 | P2 | RLS tenant-isolation SQL test exists but is not run by CI | @owner | TEST | open | Run it in validate against a Postgres service. |
| TEST-P2-003 | P2 | Migration rollback was validated by file existence only (fixed) | @owner | TEST | open | n/a |
| WH-P2-001 | P2 | Replay/idempotency key was regenerated per attempt (fixed) | @owner | WH | open | n/a |
| WH-P2-002 | P2 | Webhook delivery follows redirects / does not pin the validated IP (SSRF) | @owner | WH | open | redirect:'manual' + IP-pinned dispatch with per-hop re-validation. |
| ACM-P3-001 | P3 | Admin `/stats` leaks global cross-tenant counters | @owner | ACM | open | Scope users/messages counts to getAdminWorkspaceIds(req). |
| ADMIN-P3-001 | P3 | Admin error buffer is in-memory only (lost on restart) | @owner | ADMIN | open | Ship admin errors to the structured logger/Sentry sink. |
| ARCH-P3-001 | P3 | Worker health/metrics bind loopback but rely on a shared token | @owner | ARCH | open | Rotate the metrics token with the secret-rotation runbook. |
| BP-P3-001 | P3 | Server-side environment/ruleset configuration is not verifiable from source | @owner | BP | open | Capture the live settings into docs/operations as an evidence snapshot. |
| CHAIN-P3-001 | P3 | Public upload URL + client-declared content type is a stored-content risk | @owner | CHAIN | open | Private bucket + magic-byte validation + strict Content-Disposition. |
| CI-P3-001 | P3 | 13 workflows omit an explicit `permissions:` block | @owner | CI | open | Add least-privilege permissions to every workflow. |
| CTR-P3-001 | P3 | Containers lack runtime hardening beyond non-root and digest pinning | @owner | CTR | open | Add cap_drop:[ALL], no-new-privileges, read_only + tmpfs, and a seccomp profile. |
| CTR-P3-002 | P3 | First-party images are referenced by mutable tag (`:latest`/`:dev`) | @owner | CTR | open | Deploy by image digest emitted from build-push. |
| DET-P3-001 | P3 | [DEP] trivy not installed (dependency vuln scan skipped) | @owner | DET | open | remediation |
| DET-P3-002 | P3 | [SUPPLY] 9 container image(s) without a digest pin | @owner | DET | open | remediation |
| DET-P3-003 | P3 | [SUPPLY] hadolint not installed (Dockerfile lint skipped) | @owner | DET | open | remediation |
| DOC-P3-001 | P3 | Deployment policy contradicts the development deploy workflow (DB changes) | @owner | DOC | open | Reconcile the policy with the actual workflow. |
| DOC-P3-002 | P3 | Stale one-off reconciliation docs remain in the tree | @owner | DOC | open | Remove or archive. |
| DR-P3-001 | P3 | No evidence of an executed restore drill / RPO-RTO validation | @owner | DR | open | Run a restore drill and commit the result under docs/operations. |
| EVOL-P3-001 | P3 | No extension/plugin contract or versioned public API surface | @owner | EVOL | open | Document a versioning/deprecation policy and an extension contract. |
| FILE-P3-001 | P3 | No per-tenant/user quota or total-storage cap on uploads | @owner | FILE | open | Add per-user quota and a cleanup/retention job (worker cleanup exists for other data). |
| HYGIENE-P3-001 | P3 | Tracked shell scripts lacked the exec bit (fixed) | @owner | HYGIENE | open | n/a |
| HYGIENE-P3-002 | P3 | Duplicated logic/schema and one-off scripts remain | @owner | HYGIENE | open | Consolidate duplicates and move one-off generators under scripts/audits with an owner. |
| HYGIENE-P3-003 | P3 | Unresolved operational-metrics TODO (fixed) | @owner | HYGIENE | open | n/a |
| INFRA-P3-001 | P3 | Terraform state/backend and provider versions exist but drift checks are absent | @owner | INFRA | open | Add `terraform plan` on PR and a scheduled drift detection. |
| INV-P3-001 | P3 | Committed audit/hardening bundles inflate the repository tree | @owner | INV | open | Move generated mirrors to releases/artifacts; keep the canonical run only. |
| INV-P3-002 | P3 | Character-encoding (mojibake) artifacts remain in workflow/log text | @owner | INV | open | Normalise to ASCII/UTF-8 with an editor pass. |
| IR-P3-001 | P3 | No evidence of a conducted incident tabletop exercise | @owner | IR | open | Run a tabletop and commit the scenario + actions. |
| MOB-P3-001 | P3 | Service worker offline strategy is not covered by tests or a documented cache policy | @owner | MOB | open | Document the cache policy and add an SW update test. |
| MT-P3-001 | P3 | Admin `/stats` returns global cross-tenant counts (residual) | @owner | MT | open | Scope the users/messages counts. |
| NOTIF-P3-001 | P3 | Push subscription lifecycle (revocation/expiry) is not monitored | @owner | NOTIF | open | Track push delivery outcomes and prune 404/410 endpoints. |
| OBS-P3-001 | P3 | Error tracking (Sentry) is optional and admin error buffer is in-memory | @owner | OBS | open | Require a DSN in production and persist admin errors. |
| PERF-P3-001 | P3 | No performance budget / regression gate in CI | @owner | PERF | open | Add p95 budgets and a nightly trend dashboard. |
| PRIV-P3-001 | P3 | No automated data-retention enforcement | @owner | PRIV | open | Implement a retention scheduler and record the policy. |
| REL-P3-001 | P3 | CHANGELOG has no generator/CI gate | @owner | REL | open | Adopt changesets or commitlint with a release-notes job. |
| RES-P3-001 | P3 | Chaos and load tests are not part of a scheduled pipeline | @owner | RES | open | Add a nightly chaos/load budget run. |
| SBOM-P3-001 | P3 | SBOMs are generated but not signed or attested | @owner | SBOM | open | Sign SBOMs (cosign attest) and publish a provenance attestation. |
| SBOM-P3-002 | P3 | No license policy / dependency-review gate | @owner | SBOM | open | Add a license allow-list gate and dependency-review on PRs. |
| SC-P3-001 | P3 | Large binary archives committed to the repository | @owner | SC | open | Move archives to release assets / object storage. |
| SEARCH-P3-001 | P3 | No documented search data-flow / retention statement | @owner | SEARCH | open | Document that search is in-database and tenant-scoped, or add a search design doc if one is introduced. |
| SECRET-P3-001 | P3 | Secret rotation is documented but not scheduled or monitored | @owner | SECRET | open | Add an inventory with owners + last-rotated dates and an alert on overdue rotation. |
| SECRET-P3-002 | P3 | `.env` example files diverge between environments | @owner | SECRET | open | Generate env examples from a single schema. |
| USE-P3-001 | P3 | No end-to-end onboarding assertion for the invitation/membership flow | @owner | USE | open | Add an invite/accept E2E scenario. |
| UX-P3-001 | P3 | Accessibility is audited by an ad-hoc script, not a CI gate | @owner | UX | open | Run axe on key routes in CI with a violation budget. |
