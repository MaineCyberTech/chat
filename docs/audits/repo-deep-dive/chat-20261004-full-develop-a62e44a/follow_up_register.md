# Follow-up register

Run: `chat-20261004-full-develop-a62e44a` · Target: `chat` @ `a62e44a` · Profile: base

Register mirrored 1:1 with `risk_register.md` so `tools/check_run.sh` passes.

| Finding | Severity | Title | Owner | Target | Status | Note |
|---|---|---|---|---|---|---|
| SEC-P0-001 | P0 | Production deploy created `users_select USING (true)` exposing all users (fixed) | @security | SEC | verified-fixed | SEC-P0-001 closed; current policy is workspace-co-member scoped. |
| API-P1-001 | P1 | `/metrics` readable by any authenticated user (fixed) | @api | API | verified-fixed | Now guarded by requireMetricsAccess + METRICS_TOKEN. |
| CI-P1-001 | P1 | Production provision/deploy ran destructive Terraform with no approval (fixed) | @release | CI | verified-fixed | PR #89; provision/build/deploy now use `environment: production`. |
| CI-P1-002 | P1 | Security scans were non-blocking (fixed) | @ci | CI | verified-fixed | Trivy image scan now exit-code 1 for HIGH/CRITICAL. |
| EXEC-P1-001 | P1 | Release gate must remain conditional pending P1/P2 remediation | @eng-lead | EXEC | open | See RELEASE_GATE.md and FINAL findings. |
| FEAT-P1-001 | P1 | `/v1/auth/magic-link` did not send a magic link (fixed) | @api | FEAT | verified-fixed | Re-verified: apps/api/src/modules/auth/service.ts calls signInWithOtp. |
| FEAT-P1-002 | P1 | Webhook retries were in-process setTimeout, not durable (fixed) | @api | FEAT | verified-fixed | Durable queue verified in apps/api/src/lib/webhook-queue.ts and the worker processor. |
| FINAL-P1-001 | P1 | Release gate must remain conditional pending P2 remediation | @eng-lead | FINAL | open | Derivative gate statement; see RELEASE_GATE.md. |
| OBS-P1-001 | P1 | No alerting wired despite metrics and a tracked TODO (fixed) | @ops | OBS | verified-fixed | PR #95; rules + ntfy receiver rendered by compose. |
| RLS-P1-001 | P1 | Global `users_select USING (true)` policy (fixed) | @db | RLS | verified-fixed | Current canonical policy is scoped; deploy no longer weakens it. |
| SC-P1-001 | P1 | Credential committed to the repository (fixed) | @security | SC | verified-fixed | Only the example credential file remains tracked. |
| SEC-P1-001 | P1 | Seed workflow could re-open global user RLS / seed shared-password accounts (fixed) | @security | SEC | verified-fixed | PR #88 plus the seed workflow now states production seeding is intentionally disabled. |
| SEC-P1-002 | P1 | Tracked credential file `test-signin.json` (fixed) | @security | SEC | verified-fixed | Only test-signin.example.json is tracked at a62e44a. |
| SEC-P1-003 | P1 | Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed) | @security | SEC | verified-fixed | SEC-P1-003..006 closed; handlers now derive `getAdminWorkspaceIds(req)`. |
| SEC-P1-004 | P1 | SSH was open to the internet by default (fixed) | @infra | SEC | verified-fixed | `ssh_allowed_ips` is now required and 0.0.0.0/0 is rejected by validation. |
| TEST-P1-001 | P1 | E2E tests skipped without `test-signin.json` and were non-blocking (fixed) | @qa | TEST | verified-fixed | validate.yml self-provisions and blocks. |
| WH-P1-001 | P1 | Webhook retries were not durable (fixed) | @api | WH | verified-fixed | Durable queue + worker processor verified. |
| ACM-P2-001 | P2 | RBAC matrix is enforced per-route but not documented as a single ARtifact | @security | ACM | open | requireAdmin centralised (ARCH-P3-005 fixed); no generated matrix/negative tests per role. |
| ADMIN-P2-001 | P2 | Bulk import / compliance export operated globally (fixed) | @api | ADMIN | verified-fixed | SEC-P1-004..006 closed; now scoped to admin workspaces. |
| AI-P2-001 | P2 | AI endpoint is a stub with no tenancy/data-governance or rate-limit contract | @api | AI | open | New at a62e44a; safe today but will be a governance gap if replaced by an LLM. |
| API-P2-001 | P2 | User input interpolated into PostgREST `.or(...)` filters (fixed) | @api | API | verified-fixed | lib/postgrest-filter.ts escapes values. |
| API-P2-002 | P2 | `PATCH /v1/auth/status` accepted unvalidated customStatus (fixed) | @api | API | verified-fixed | validators/auth.ts validates the field. |
| API-P2-003 | P2 | Inconsistent error response shapes (fixed) | @api | API | verified-fixed | Error-envelope contract test passes. |
| ARCH-P2-001 | P2 | Single-node topology: one droplet hosts all services and local Redis | @infra | ARCH | open | ARCH-P2-003 / pilot ARCH-P2-001 remain; no HA/warm standby at a62e44a. |
| ARCH-P2-002 | P2 | Webhook service used an anonymous Supabase client (fixed) | @api | ARCH | verified-fixed | Closed by the 2026-10-03 remediation wave; re-verified at a62e44a. |
| BP-P2-001 | P2 | In-repo branch-protection gate covers only `main`, not `develop` | @ci | BP | open | Same root cause as CI finding; server-side ruleset state = Unknown. |
| CHAIN-P2-001 | P2 | Webhook SSRF + missing encryption key form a plausible internal-reach chain | @security | CHAIN | open | Composite of SEC/WH findings; no P0/P1 chain found. |
| CI-P2-001 | P2 | `infra-development` destroys infra on every push to `develop` | @ci | CI | open | Reaffirms pilot CI-P2-001; workflow provisions and deletes duplicate droplets on develop. |
| CI-P2-002 | P2 | Auto-commit workflows hold `contents: write` and push to main/develop | @ci | CI | open | Reaffirms pilot CI-P2-003; both workflows still request contents:write. |
| CI-P2-003 | P2 | `develop` (auto-deploy target) is not covered by the branch-protection gate | @ci | CI | open | Reaffirms pilot CI-P2-004; validate.yml branch-protection job hard-codes main. |
| CI-P2-004 | P2 | `workflow_dispatch` inputs interpolated into `run:` (script injection) (fixed) | @ci | CI | verified-fixed | Closed with the actionlint/CI hardening wave (#97). |
| DATA-P2-001 | P2 | Duplicate `add_user_groups` migrations | @db | DATA | open | Reaffirms pilot DATA-P2-001; both files still present at a62e44a. |
| DATA-P2-002 | P2 | `gdpr_delete_user` is a hard multi-table delete with partial coverage | @db | DATA | open | Reaffirms original DATA-P2-005; not re-verified line-by-line (partial). |
| DATA-P2-003 | P2 | Deploy workflows seeded production with test users (fixed) | @release | DATA | verified-fixed | Deploy no longer seeds; capability remains only in the disabled seed workflow. |
| DATA-P2-004 | P2 | Rollback scripts were only proven to exist (fixed) | @ci | DATA | verified-fixed | validate.yml now executes downs in reverse and re-applies ups. |
| EXEC-P2-001 | P2 | Prior pilot register self-consistency (stale-base false positive) corrected | @audit-owner | EXEC | verified-fixed | The pilot's verified-fixed SHAs are ancestors of develop; false positive corrected. |
| FEAT-P2-001 | P2 | Webhook idempotency key was regenerated per attempt (fixed) | @api | FEAT | verified-fixed | Key generated once (service.ts:216) and reused by the retry job. |
| FEAT-P2-002 | P2 | Naive input sanitizer blocked legitimate content (fixed) | @api | FEAT | verified-fixed | Re-audit closed; sanitizer no longer strips legitimate markdown. |
| FILE-P2-001 | P2 | Uploads return a public URL from `chat-uploads` and trust client-declared content type | @api | FILE | open | New at a62e44a; no server-side magic-byte sniff and bucket visibility is unverified server-side. |
| FINAL-P2-001 | P2 | Dependency risk-acceptances expire 2027-01-04 | @security | FINAL | open | Derivative of SC finding. |
| INFRA-P2-001 | P2 | Single-droplet infrastructure has no environment isolation | @infra | INFRA | open | One droplet serves dev and (through the same module) prod flows. |
| INV-P2-001 | P2 | Stale generated reconciliation artifacts remain tracked at the repository root | @maintainer | INV | open | Reaffirms pilot INV-P2-001 at a62e44a. |
| MT-P2-001 | P2 | IDOR: admin dead-letter retry was not tenant-scoped (fixed) | @api | MT | verified-fixed | PR #90; re-verified tenant scoping in the admin webhooks routes. |
| MT-P2-002 | P2 | Cross-tenant user directory via auth service (fixed) | @security | MT | verified-fixed | PR #91; directory now uses an RLS-aware caller client. |
| NOTIF-P2-001 | P2 | Notifications are delivered only via Web Push; no durable multi-channel delivery/retry | @api | NOTIF | open | No email/SMS provider integration; push failures are not retried durably. |
| OBS-P2-001 | P2 | No distributed tracing / correlation to a collector | @ops | OBS | open | OBS-P2-004 residual; request-id/trace-context exist but no OTLP exporter. |
| PRIV-P2-001 | P2 | GDPR erasure path is a hard multi-table delete with partial coverage | @privacy | PRIV | open | Cross-ref DATA finding; the same defect is the privacy owner's concern. |
| RES-P2-001 | P2 | Single-node failure domains: API, worker, Redis and DB proxy co-resident | @infra | RES | open | Ambient/failure-domain analysis; overlaps ARCH/INFRA findings. |
| RLS-P2-001 | P2 | RLS policy test exists but is not executed by CI | @qa | RLS | open | TEST-P2-001 residual; `package.json` has test:rls but no workflow invokes it. |
| SC-P2-001 | P2 | Production web container received the Supabase service-role key (fixed) | @supply | SC | verified-fixed | PR #92; web compose service no longer receives the service-role key. |
| SC-P2-002 | P2 | GitHub Actions were not pinned to commit SHAs (fixed) | @supply | SC | verified-fixed | All external actions are 40-hex pinned at a62e44a. |
| SC-P2-003 | P2 | Dependency vulnerability scanning was advisory-only (fixed) | @security | SC | verified-fixed | Trivy image scan blocks; dependency exceptions are dated to 2027-01-04. |
| SC-P2-004 | P2 | Dependency risk-acceptances expire 2027-01-04 | @security | SC | open | Downgraded from pilot DEP-P2-001 (was 2026-11-03); same-major bumps applied #101. |
| SEC-P2-001 | P2 | `WEBHOOK_ENCRYPTION_KEY` is not delivered by the production compose stack | @security | SEC | open | Reaffirms pilot SEC-P2-003 at a62e44a; key is optional in env.ts. |
| SEC-P2-002 | P2 | Webhook SSRF validation does not constrain redirects or DNS rebinding | @security | SEC | open | Reaffirms pilot SEC-P2-002; validateWebhookUrl resolves DNS then delivery fetches later. |
| TEST-P2-001 | P2 | Low coverage thresholds / non-blocking diff coverage (fixed) | @qa | TEST | verified-fixed | vitest.config.base.ts:34-37 raised; no continue-on-error. |
| TEST-P2-002 | P2 | RLS tenant-isolation SQL test exists but is not run by CI | @qa | TEST | open | Same as RLS-domain finding; confirmed absent from all workflows. |
| TEST-P2-003 | P2 | Migration rollback was validated by file existence only (fixed) | @qa | TEST | verified-fixed | Downs are executed in reverse. |
| WH-P2-001 | P2 | Replay/idempotency key was regenerated per attempt (fixed) | @api | WH | verified-fixed | Key created once and reused on retry. |
| WH-P2-002 | P2 | Webhook delivery follows redirects / does not pin the validated IP (SSRF) | @security | WH | open | Same root cause as SEC SSRF finding; owned here for the delivery path. |
| ACM-P3-001 | P3 | Admin `/stats` leaks global cross-tenant counters | @api | ACM | open | Confirmed at a62e44a (admin.routes.ts /stats). |
| ADMIN-P3-001 | P3 | Admin error buffer is in-memory only (lost on restart) | @api | ADMIN | open | Pilot OBS-P2-003 residual (admin/error-buffer.ts). |
| ARCH-P3-001 | P3 | Worker health/metrics bind loopback but rely on a shared token | @ops | ARCH | open | Worker /metrics now token-gated; residual is shared-secret hygiene. |
| BP-P3-001 | P3 | Server-side environment/ruleset configuration is not verifiable from source | @release | BP | open | Marked Unknown per audit doctrine; not faked. |
| CHAIN-P3-001 | P3 | Public upload URL + client-declared content type is a stored-content risk | @security | CHAIN | open | Composite of FILE finding. |
| CI-P3-001 | P3 | 13 workflows omit an explicit `permissions:` block | @ci | CI | open | Reaffirms pilot CI-P3-002; measured at a62e44a. |
| CTR-P3-001 | P3 | Containers lack runtime hardening beyond non-root and digest pinning | @supply | CTR | open | Third-party images are digest-pinned now; hardening flags still absent. |
| CTR-P3-002 | P3 | First-party images are referenced by mutable tag (`:latest`/`:dev`) | @supply | CTR | open | Expected for locally-built images, but deploys are not digest-pinned to the built artifact. |
| DET-P3-001 | P3 | [DEP] trivy not installed (dependency vuln scan skipped) | @owner | DET | open |  |
| DET-P3-002 | P3 | [SUPPLY] 9 container image(s) without a digest pin | @owner | DET | open |  |
| DET-P3-003 | P3 | [SUPPLY] hadolint not installed (Dockerfile lint skipped) | @owner | DET | open |  |
| DOC-P3-001 | P3 | Deployment policy contradicts the development deploy workflow (DB changes) | @release | DOC | open | Reaffirms pilot CONF-P3-001. |
| DOC-P3-002 | P3 | Stale one-off reconciliation docs remain in the tree | @maintainer | DOC | open | Same artifacts as INV-P2-001. |
| DR-P3-001 | P3 | No evidence of an executed restore drill / RPO-RTO validation | @ops | DR | open | Docs exist; no dated drill result in the repo. |
| EVOL-P3-001 | P3 | No extension/plugin contract or versioned public API surface | @eng | EVOL | open | packages/sdk exists but no plugin/extension API or deprecation policy. |
| FILE-P3-001 | P3 | No per-tenant/user quota or total-storage cap on uploads | @api | FILE | open | Only a 10MB per-file cap is enforced. |
| HYGIENE-P3-001 | P3 | Tracked shell scripts lacked the exec bit (fixed) | @maintainer | HYGIENE | verified-fixed | PR #96; no 100644 *.sh remain. |
| HYGIENE-P3-002 | P3 | Duplicated logic/schema and one-off scripts remain | @maintainer | HYGIENE | open | Reaffirms HYG-P2-002 partial; duplicate requireAdmin fixed, migrations/logic duplicates remain. |
| HYGIENE-P3-003 | P3 | Unresolved operational-metrics TODO (fixed) | @ops | HYGIENE | verified-fixed | PR #95 removed the TODO. |
| INFRA-P3-001 | P3 | Terraform state/backend and provider versions exist but drift checks are absent | @infra | INFRA | open | No plan-on-PR drift check. |
| INV-P3-001 | P3 | Committed audit/hardening bundles inflate the repository tree | @maintainer | INV | open | docs/audits + hardening_super_bundle carry many generated mirrors. |
| INV-P3-002 | P3 | Character-encoding (mojibake) artifacts remain in workflow/log text | @maintainer | INV | open | Pilot INV-P3-001; not re-verified line-by-line at a62e44a (partial). |
| IR-P3-001 | P3 | No evidence of a conducted incident tabletop exercise | @ops | IR | open | Runbook present; no scenario/date/participants record. |
| MOB-P3-001 | P3 | Service worker offline strategy is not covered by tests or a documented cache policy | @web | MOB | open | SW + install prompt components exist; no test verifies cache/update safety. |
| MT-P3-001 | P3 | Admin `/stats` returns global cross-tenant counts (residual) | @api | MT | open | Same as ACM finding; confirmed open. |
| NOTIF-P3-001 | P3 | Push subscription lifecycle (revocation/expiry) is not monitored | @api | NOTIF | open | No metric for stale/410 push endpoints. |
| OBS-P3-001 | P3 | Error tracking (Sentry) is optional and admin error buffer is in-memory | @ops | OBS | open | Sentry wired only when DSN set; admin buffer lost on restart. |
| PERF-P3-001 | P3 | No performance budget / regression gate in CI | @perf | PERF | open | k6 load/smoke tests exist but are not budget-enforced. |
| PRIV-P3-001 | P3 | No automated data-retention enforcement | @privacy | PRIV | open | Consent docs exist; no scheduled retention/purge job. |
| REL-P3-001 | P3 | CHANGELOG has no generator/CI gate | @release | REL | open | CHANGELOG.md exists and is hand-written; no conventional-commit enforcement. |
| RES-P3-001 | P3 | Chaos and load tests are not part of a scheduled pipeline | @ops | RES | open | Tests exist under tests/chaos and tests/k6 but no schedule. |
| SBOM-P3-001 | P3 | SBOMs are generated but not signed or attested | @supply | SBOM | open | SUPPLY-P2-004 (prod SBOM) fixed; signing/attestation absent. |
| SBOM-P3-002 | P3 | No license policy / dependency-review gate | @supply | SBOM | open | LICENSE is present (proprietary all-rights-reserved); dependency licenses ungated. |
| SC-P3-001 | P3 | Large binary archives committed to the repository | @supply | SC | open | Reaffirms original SUPPLY-P3-005; not re-enumerated (partial). |
| SEARCH-P3-001 | P3 | No documented search data-flow / retention statement | @privacy | SEARCH | open | No search module; privacy statement for query logs is absent. |
| SECRET-P3-001 | P3 | Secret rotation is documented but not scheduled or monitored | @security | SECRET | open | Runbooks exist; no owner/date tracker or expiry alert. |
| SECRET-P3-002 | P3 | `.env` example files diverge between environments | @infra | SECRET | open | dev vs prod example key sets differ; WEBHOOK_ENCRYPTION_KEY absent from both. |
| USE-P3-001 | P3 | No end-to-end onboarding assertion for the invitation/membership flow | @ux | USE | open | E2E focuses on core messaging; invite/accept path lacks a persistent E2E. |
| UX-P3-001 | P3 | Accessibility is audited by an ad-hoc script, not a CI gate | @ux | UX | open | scripts/accessibility-audit.sh exists; no axe/pa11y gate in validate. |
