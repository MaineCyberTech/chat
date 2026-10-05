# Focused security / supply-chain / CI deep-dive - chat

## Findings

| ID | Severity | Title | Report |
|---|---|---|---|
| SEC-P0-001 | P0 | Production deploy created `users_select USING (true)` exposing all users (fixed) | lens_focused_security_supply_chain_ci.md |
| API-P1-001 | P1 | `/metrics` readable by any authenticated user (fixed) | lens_focused_security_supply_chain_ci.md |
| CI-P1-001 | P1 | Production provision/deploy ran destructive Terraform with no approval (fixed) | lens_focused_security_supply_chain_ci.md |
| CI-P1-002 | P1 | Security scans were non-blocking (fixed) | lens_focused_security_supply_chain_ci.md |
| EXEC-P1-001 | P1 | Release gate must remain conditional pending P1/P2 remediation | lens_focused_security_supply_chain_ci.md |
| FEAT-P1-001 | P1 | `/v1/auth/magic-link` did not send a magic link (fixed) | lens_focused_security_supply_chain_ci.md |
| FEAT-P1-002 | P1 | Webhook retries were in-process setTimeout, not durable (fixed) | lens_focused_security_supply_chain_ci.md |
| FINAL-P1-001 | P1 | Release gate must remain conditional pending P2 remediation | lens_focused_security_supply_chain_ci.md |
| OBS-P1-001 | P1 | No alerting wired despite metrics and a tracked TODO (fixed) | lens_focused_security_supply_chain_ci.md |
| RLS-P1-001 | P1 | Global `users_select USING (true)` policy (fixed) | lens_focused_security_supply_chain_ci.md |
| SC-P1-001 | P1 | Credential committed to the repository (fixed) | lens_focused_security_supply_chain_ci.md |
| SEC-P1-001 | P1 | Seed workflow could re-open global user RLS / seed shared-password accounts (fixed) | lens_focused_security_supply_chain_ci.md |
| SEC-P1-002 | P1 | Tracked credential file `test-signin.json` (fixed) | lens_focused_security_supply_chain_ci.md |
| SEC-P1-003 | P1 | Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed) | lens_focused_security_supply_chain_ci.md |
| SEC-P1-004 | P1 | SSH was open to the internet by default (fixed) | lens_focused_security_supply_chain_ci.md |
| TEST-P1-001 | P1 | E2E tests skipped without `test-signin.json` and were non-blocking (fixed) | lens_focused_security_supply_chain_ci.md |
| WH-P1-001 | P1 | Webhook retries were not durable (fixed) | lens_focused_security_supply_chain_ci.md |
| ACM-P2-001 | P2 | RBAC matrix is enforced per-route but not documented as a single ARtifact | lens_focused_security_supply_chain_ci.md |
| ADMIN-P2-001 | P2 | Bulk import / compliance export operated globally (fixed) | lens_focused_security_supply_chain_ci.md |
| AI-P2-001 | P2 | AI endpoint is a stub with no tenancy/data-governance or rate-limit contract | lens_focused_security_supply_chain_ci.md |
| API-P2-001 | P2 | User input interpolated into PostgREST `.or(...)` filters (fixed) | lens_focused_security_supply_chain_ci.md |
| API-P2-002 | P2 | `PATCH /v1/auth/status` accepted unvalidated customStatus (fixed) | lens_focused_security_supply_chain_ci.md |
| API-P2-003 | P2 | Inconsistent error response shapes (fixed) | lens_focused_security_supply_chain_ci.md |
| ARCH-P2-001 | P2 | Single-node topology: one droplet hosts all services and local Redis | lens_focused_security_supply_chain_ci.md |
| ARCH-P2-002 | P2 | Webhook service used an anonymous Supabase client (fixed) | lens_focused_security_supply_chain_ci.md |
| BP-P2-001 | P2 | In-repo branch-protection gate covers only `main`, not `develop` | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-001 | P2 | Webhook SSRF + missing encryption key form a plausible internal-reach chain | lens_focused_security_supply_chain_ci.md |
| CI-P2-001 | P2 | `infra-development` destroys infra on every push to `develop` | lens_focused_security_supply_chain_ci.md |
| CI-P2-002 | P2 | Auto-commit workflows hold `contents: write` and push to main/develop | lens_focused_security_supply_chain_ci.md |
| CI-P2-003 | P2 | `develop` (auto-deploy target) is not covered by the branch-protection gate | lens_focused_security_supply_chain_ci.md |
| CI-P2-004 | P2 | `workflow_dispatch` inputs interpolated into `run:` (script injection) (fixed) | lens_focused_security_supply_chain_ci.md |
| DATA-P2-001 | P2 | Duplicate `add_user_groups` migrations | lens_focused_security_supply_chain_ci.md |
| DATA-P2-002 | P2 | `gdpr_delete_user` is a hard multi-table delete with partial coverage | lens_focused_security_supply_chain_ci.md |
| DATA-P2-003 | P2 | Deploy workflows seeded production with test users (fixed) | lens_focused_security_supply_chain_ci.md |
| DATA-P2-004 | P2 | Rollback scripts were only proven to exist (fixed) | lens_focused_security_supply_chain_ci.md |
| EXEC-P2-001 | P2 | Prior pilot register self-consistency (stale-base false positive) corrected | lens_focused_security_supply_chain_ci.md |
| FEAT-P2-001 | P2 | Webhook idempotency key was regenerated per attempt (fixed) | lens_focused_security_supply_chain_ci.md |
| FEAT-P2-002 | P2 | Naive input sanitizer blocked legitimate content (fixed) | lens_focused_security_supply_chain_ci.md |
| FILE-P2-001 | P2 | Uploads return a public URL from `chat-uploads` and trust client-declared content type | lens_focused_security_supply_chain_ci.md |
| FINAL-P2-001 | P2 | Dependency risk-acceptances expire 2027-01-04 | lens_focused_security_supply_chain_ci.md |
| INFRA-P2-001 | P2 | Single-droplet infrastructure has no environment isolation | lens_focused_security_supply_chain_ci.md |
| INV-P2-001 | P2 | Stale generated reconciliation artifacts remain tracked at the repository root | lens_focused_security_supply_chain_ci.md |
| MT-P2-001 | P2 | IDOR: admin dead-letter retry was not tenant-scoped (fixed) | lens_focused_security_supply_chain_ci.md |
| MT-P2-002 | P2 | Cross-tenant user directory via auth service (fixed) | lens_focused_security_supply_chain_ci.md |
| NOTIF-P2-001 | P2 | Notifications are delivered only via Web Push; no durable multi-channel delivery/retry | lens_focused_security_supply_chain_ci.md |
| OBS-P2-001 | P2 | No distributed tracing / correlation to a collector | lens_focused_security_supply_chain_ci.md |
| PRIV-P2-001 | P2 | GDPR erasure path is a hard multi-table delete with partial coverage | lens_focused_security_supply_chain_ci.md |
| RES-P2-001 | P2 | Single-node failure domains: API, worker, Redis and DB proxy co-resident | lens_focused_security_supply_chain_ci.md |
| RLS-P2-001 | P2 | RLS policy test exists but is not executed by CI | lens_focused_security_supply_chain_ci.md |
| SC-P2-001 | P2 | Production web container received the Supabase service-role key (fixed) | lens_focused_security_supply_chain_ci.md |
| SC-P2-002 | P2 | GitHub Actions were not pinned to commit SHAs (fixed) | lens_focused_security_supply_chain_ci.md |
| SC-P2-003 | P2 | Dependency vulnerability scanning was advisory-only (fixed) | lens_focused_security_supply_chain_ci.md |
| SC-P2-004 | P2 | Dependency risk-acceptances expire 2027-01-04 | lens_focused_security_supply_chain_ci.md |
| SEC-P2-001 | P2 | `WEBHOOK_ENCRYPTION_KEY` is not delivered by the production compose stack | lens_focused_security_supply_chain_ci.md |
| SEC-P2-002 | P2 | Webhook SSRF validation does not constrain redirects or DNS rebinding | lens_focused_security_supply_chain_ci.md |
| TEST-P2-001 | P2 | Low coverage thresholds / non-blocking diff coverage (fixed) | lens_focused_security_supply_chain_ci.md |
| TEST-P2-002 | P2 | RLS tenant-isolation SQL test exists but is not run by CI | lens_focused_security_supply_chain_ci.md |
| TEST-P2-003 | P2 | Migration rollback was validated by file existence only (fixed) | lens_focused_security_supply_chain_ci.md |
| WH-P2-001 | P2 | Replay/idempotency key was regenerated per attempt (fixed) | lens_focused_security_supply_chain_ci.md |
| WH-P2-002 | P2 | Webhook delivery follows redirects / does not pin the validated IP (SSRF) | lens_focused_security_supply_chain_ci.md |
| ACM-P3-001 | P3 | Admin `/stats` leaks global cross-tenant counters | lens_focused_security_supply_chain_ci.md |
| ADMIN-P3-001 | P3 | Admin error buffer is in-memory only (lost on restart) | lens_focused_security_supply_chain_ci.md |
| ARCH-P3-001 | P3 | Worker health/metrics bind loopback but rely on a shared token | lens_focused_security_supply_chain_ci.md |
| BP-P3-001 | P3 | Server-side environment/ruleset configuration is not verifiable from source | lens_focused_security_supply_chain_ci.md |
| CHAIN-P3-001 | P3 | Public upload URL + client-declared content type is a stored-content risk | lens_focused_security_supply_chain_ci.md |
| CI-P3-001 | P3 | 13 workflows omit an explicit `permissions:` block | lens_focused_security_supply_chain_ci.md |
| CTR-P3-001 | P3 | Containers lack runtime hardening beyond non-root and digest pinning | lens_focused_security_supply_chain_ci.md |
| CTR-P3-002 | P3 | First-party images are referenced by mutable tag (`:latest`/`:dev`) | lens_focused_security_supply_chain_ci.md |
| DET-P3-001 | P3 | [DEP] trivy not installed (dependency vuln scan skipped) | lens_focused_security_supply_chain_ci.md |
| DET-P3-002 | P3 | [SUPPLY] 9 container image(s) without a digest pin | lens_focused_security_supply_chain_ci.md |
| DET-P3-003 | P3 | [SUPPLY] hadolint not installed (Dockerfile lint skipped) | lens_focused_security_supply_chain_ci.md |
| DOC-P3-001 | P3 | Deployment policy contradicts the development deploy workflow (DB changes) | lens_focused_security_supply_chain_ci.md |
| DOC-P3-002 | P3 | Stale one-off reconciliation docs remain in the tree | lens_focused_security_supply_chain_ci.md |
| DR-P3-001 | P3 | No evidence of an executed restore drill / RPO-RTO validation | lens_focused_security_supply_chain_ci.md |
| EVOL-P3-001 | P3 | No extension/plugin contract or versioned public API surface | lens_focused_security_supply_chain_ci.md |
| FILE-P3-001 | P3 | No per-tenant/user quota or total-storage cap on uploads | lens_focused_security_supply_chain_ci.md |
| HYGIENE-P3-001 | P3 | Tracked shell scripts lacked the exec bit (fixed) | lens_focused_security_supply_chain_ci.md |
| HYGIENE-P3-002 | P3 | Duplicated logic/schema and one-off scripts remain | lens_focused_security_supply_chain_ci.md |
| HYGIENE-P3-003 | P3 | Unresolved operational-metrics TODO (fixed) | lens_focused_security_supply_chain_ci.md |
| INFRA-P3-001 | P3 | Terraform state/backend and provider versions exist but drift checks are absent | lens_focused_security_supply_chain_ci.md |
| INV-P3-001 | P3 | Committed audit/hardening bundles inflate the repository tree | lens_focused_security_supply_chain_ci.md |
| INV-P3-002 | P3 | Character-encoding (mojibake) artifacts remain in workflow/log text | lens_focused_security_supply_chain_ci.md |
| IR-P3-001 | P3 | No evidence of a conducted incident tabletop exercise | lens_focused_security_supply_chain_ci.md |
| MOB-P3-001 | P3 | Service worker offline strategy is not covered by tests or a documented cache policy | lens_focused_security_supply_chain_ci.md |
| MT-P3-001 | P3 | Admin `/stats` returns global cross-tenant counts (residual) | lens_focused_security_supply_chain_ci.md |
| NOTIF-P3-001 | P3 | Push subscription lifecycle (revocation/expiry) is not monitored | lens_focused_security_supply_chain_ci.md |
| OBS-P3-001 | P3 | Error tracking (Sentry) is optional and admin error buffer is in-memory | lens_focused_security_supply_chain_ci.md |
| PERF-P3-001 | P3 | No performance budget / regression gate in CI | lens_focused_security_supply_chain_ci.md |
| PRIV-P3-001 | P3 | No automated data-retention enforcement | lens_focused_security_supply_chain_ci.md |
| REL-P3-001 | P3 | CHANGELOG has no generator/CI gate | lens_focused_security_supply_chain_ci.md |
| RES-P3-001 | P3 | Chaos and load tests are not part of a scheduled pipeline | lens_focused_security_supply_chain_ci.md |
| SBOM-P3-001 | P3 | SBOMs are generated but not signed or attested | lens_focused_security_supply_chain_ci.md |
| SBOM-P3-002 | P3 | No license policy / dependency-review gate | lens_focused_security_supply_chain_ci.md |
| SC-P3-001 | P3 | Large binary archives committed to the repository | lens_focused_security_supply_chain_ci.md |
| SEARCH-P3-001 | P3 | No documented search data-flow / retention statement | lens_focused_security_supply_chain_ci.md |
| SECRET-P3-001 | P3 | Secret rotation is documented but not scheduled or monitored | lens_focused_security_supply_chain_ci.md |
| SECRET-P3-002 | P3 | `.env` example files diverge between environments | lens_focused_security_supply_chain_ci.md |
| USE-P3-001 | P3 | No end-to-end onboarding assertion for the invitation/membership flow | lens_focused_security_supply_chain_ci.md |
| UX-P3-001 | P3 | Accessibility is audited by an ad-hoc script, not a CI gate | lens_focused_security_supply_chain_ci.md |

---

# Full-domain deep-dive — chat @ a62e44a

Run `chat-20261004-full-develop-a62e44a` (full mode, 43 domains).

# Executive Summary

- Target: `chat` @ `a62e44a` (branch `develop`)
- Run: `chat-20261004-full-develop-a62e44a` (full mode, full-domain)
- Verdict: **GO WITH CONDITIONS**

## Findings

- 99 total: P0 1, P1 16, P2 43, P3 39.
- Domains covered: deterministic, 00_audit_orchestrator, 01_repository_inventory, 02_architecture_runtime_topology, 03_feature_implementation_map, 06_security_authz_tenancy_audit, 24_access_control_matrix_audit, 25_multi_tenant_isolation_attack_simulation, 26_admin_console_abuse_case_audit, 07_data_schema_migration_runtime_validation, 37_supabase_rls_policy_deep_dive, 08_api_contracts_realtime_integrations, 27_webhook_delivery_replay_idempotency_audit, 28_file_upload_download_security_audit, 29_billing_payments_reconciliation_audit, 30_notification_email_push_delivery_audit, 31_search_indexing_privacy_audit, 10_github_actions_cicd_governance, 34_branch_protection_required_checks, 11_supply_chain_dependency_secrets, 35_sbom_license_policy, 36_container_runtime_security, 38_env_secret_rotation, 12_infra_deployment_environment_drift, 09_testing_quality_release_confidence, 13_resilience_recovery_failure_modes, 32_backup_restore_drill, 33_incident_tabletop_exercise, 14_observability_monitoring_incident_readiness, 15_performance_scalability_cost, 04_usability_workflow_audit, 05_ui_ux_accessibility_audit, 17_mobile_pwa_responsive_access, 18_privacy_compliance_data_governance, 39_analytics_tracking_privacy, 16_documentation_devex_operator_readiness, 19_platform_evolution_extensibility, 20_ai_automation_agent_readiness, 21_repo_hygiene_maintainability, 45_exploit_chain_attack_path_audit, 22_final_risk_register_roadmap, 23_executive_summary_release_gate, 40_release_notes_changelog_generator.

Top risks:

- `SEC-P0-001` — Production deploy created `users_select USING (true)` exposing all users (fixed)
- `API-P1-001` — `/metrics` readable by any authenticated user (fixed)
- `CI-P1-001` — Production provision/deploy ran destructive Terraform with no approval (fixed)
- `CI-P1-002` — Security scans were non-blocking (fixed)
- `EXEC-P1-001` — Release gate must remain conditional pending P1/P2 remediation
- `FEAT-P1-001` — `/v1/auth/magic-link` did not send a magic link (fixed)
- `FEAT-P1-002` — Webhook retries were in-process setTimeout, not durable (fixed)
- `FINAL-P1-001` — Release gate must remain conditional pending P2 remediation
- `OBS-P1-001` — No alerting wired despite metrics and a tracked TODO (fixed)
- `RLS-P1-001` — Global `users_select USING (true)` policy (fixed)
- `SC-P1-001` — Credential committed to the repository (fixed)
- `SEC-P1-001` — Seed workflow could re-open global user RLS / seed shared-password accounts (fixed)
- `SEC-P1-002` — Tracked credential file `test-signin.json` (fixed)
- `SEC-P1-003` — Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed)
- `SEC-P1-004` — SSH was open to the internet by default (fixed)
- `TEST-P1-001` — E2E tests skipped without `test-signin.json` and were non-blocking (fixed)
- `WH-P1-001` — Webhook retries were not durable (fixed)


## Domain reports


---

# 00_audit_orchestrator — Prompt 00 - Audit Orchestrator

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `00_audit_orchestrator.md` (area ORCH, prompt)

## Verification Performed

Run orchestrator domain. Method: read-only clone of
`MaineCyberTech/chat` at `develop` `a62e44a`. Reconciled the three prior audit
artifacts (2026-10-03 full run, 2026-10-04 full-domain pilot, 2026-10-04
post-merge re-audit) against this commit; the deterministic lens was executed
on the lab ci-runner (`/var/lib/lab-repos/chat`). Partial-pass coverage is
recorded in `coverage.md`; no new P0/P1 was introduced by the 2026-10-04
remediation wave (#87-#102). This domain owns no findings of its own.

## Findings

_No findings in this domain._

---

# 01_repository_inventory — Prompt 01 - Comprehensive Repository Inventory

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `01_repository_inventory.md` (area INV, prompt)

## Verification Performed

Inventory via `git ls-files` (1049 files), workflow
count (22), migrations (78). Confirmed the historical stale-artifact set is
still tracked and the two credential artefacts (`test-signin.json`,
`hardening/exceptions`) are resolved to examples only.

## Findings

| ID | Severity | Title |
|---|---|---|
| INV-P2-001 | P2 | Stale generated reconciliation artifacts remain tracked at the repository root |
| INV-P3-001 | P3 | Committed audit/hardening bundles inflate the repository tree |
| INV-P3-002 | P3 | Character-encoding (mojibake) artifacts remain in workflow/log text |

---

# 02_architecture_runtime_topology — Prompt 02 - Architecture and Runtime Topology Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `02_architecture_runtime_topology.md` (area ARCH, prompt)

## Verification Performed

Reviewed topology from `infra/terraform`
and `infra/docker/docker-compose.prod.yml`; service clients from
`apps/api/src/lib/supabase.ts`, `socket.ts`, `app.ts`. Confirmed the prior
anonymous-client and unauth-worker-metrics findings are fixed.

## Findings

| ID | Severity | Title |
|---|---|---|
| ARCH-P2-001 | P2 | Single-node topology: one droplet hosts all services and local Redis |
| ARCH-P2-002 | P2 | Webhook service used an anonymous Supabase client (fixed) |
| ARCH-P3-001 | P3 | Worker health/metrics bind loopback but rely on a shared token |

---

# 03_feature_implementation_map — Prompt 03 - Feature Implementation and Gap Map

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `03_feature_implementation_map.md` (area FEAT, prompt)

## Verification Performed

Feature-by-feature walk of the auth, webhooks,
socket and sanitizer paths. All four historical feature findings verified fixed
at a62e44a.

## Findings

| ID | Severity | Title |
|---|---|---|
| FEAT-P1-001 | P1 | `/v1/auth/magic-link` did not send a magic link (fixed) |
| FEAT-P1-002 | P1 | Webhook retries were in-process setTimeout, not durable (fixed) |
| FEAT-P2-001 | P2 | Webhook idempotency key was regenerated per attempt (fixed) |
| FEAT-P2-002 | P2 | Naive input sanitizer blocked legitimate content (fixed) |

---

# 04_usability_workflow_audit — Prompt 04 - Usability and Workflow Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `04_usability_workflow_audit.md` (area USE, prompt)

## Verification Performed

Walked the primary sign-in -> workspace -> channel
-> message -> attachment -> notifications flow from the web routes/components.

## Findings

| ID | Severity | Title |
|---|---|---|
| USE-P3-001 | P3 | No end-to-end onboarding assertion for the invitation/membership flow |

---

# 05_ui_ux_accessibility_audit — Prompt 05 - UI/UX, Design System, and Accessibility Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `05_ui_ux_accessibility_audit.md` (area UX, prompt)

## Verification Performed

Accessibility script and component library reviewed.
No automated accessibility gate runs in CI.

## Findings

| ID | Severity | Title |
|---|---|---|
| UX-P3-001 | P3 | Accessibility is audited by an ad-hoc script, not a CI gate |

---

# 06_security_authz_tenancy_audit — Prompt 06 - Security, Authorization, and Tenancy Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `06_security_authz_tenancy_audit.md` (area SEC, prompt)

## Verification Performed

Security/authz/tenancy pass. Verified the
deploy/seed RLS weakening is gone, the seed workflow's production target is
disabled, admin user directory and audit-log/compliance endpoints are
workspace-scoped, SSH is restricted by CIDR, and webhook secrets are
encrypted at rest. New residual: `WEBHOOK_ENCRYPTION_KEY` is not delivered by
the production compose stack, and webhook SSRF still ignores redirects.

## Findings

| ID | Severity | Title |
|---|---|---|
| SEC-P0-001 | P0 | Production deploy created `users_select USING (true)` exposing all users (fixed) |
| SEC-P1-001 | P1 | Seed workflow could re-open global user RLS / seed shared-password accounts (fixed) |
| SEC-P1-002 | P1 | Tracked credential file `test-signin.json` (fixed) |
| SEC-P1-003 | P1 | Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed) |
| SEC-P1-004 | P1 | SSH was open to the internet by default (fixed) |
| SEC-P2-001 | P2 | `WEBHOOK_ENCRYPTION_KEY` is not delivered by the production compose stack |
| SEC-P2-002 | P2 | Webhook SSRF validation does not constrain redirects or DNS rebinding |

---

# 07_data_schema_migration_runtime_validation — Prompt 07 - Data, Schema, Migration, and Runtime Validation Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `07_data_schema_migration_runtime_validation.md` (area DATA, prompt)

## Verification Performed

Reviewed all 78 migrations and
76 rollback scripts; the migration up/down/up gate now executes downs in
reverse. Two schema defects remain: duplicate `add_user_groups` migrations and
the hard multi-table `gdpr_delete_user`.

## Findings

| ID | Severity | Title |
|---|---|---|
| DATA-P2-001 | P2 | Duplicate `add_user_groups` migrations |
| DATA-P2-002 | P2 | `gdpr_delete_user` is a hard multi-table delete with partial coverage |
| DATA-P2-003 | P2 | Deploy workflows seeded production with test users (fixed) |
| DATA-P2-004 | P2 | Rollback scripts were only proven to exist (fixed) |

---

# 08_api_contracts_realtime_integrations — Prompt 08 - API Contracts, Realtime, and Integrations Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `08_api_contracts_realtime_integrations.md` (area API, prompt)

## Verification Performed

OpenAPI coverage, error envelopes,
PostgREST filter escaping and validator coverage re-checked; all historical
API findings are fixed at a62e44a.

## Findings

| ID | Severity | Title |
|---|---|---|
| API-P1-001 | P1 | `/metrics` readable by any authenticated user (fixed) |
| API-P2-001 | P2 | User input interpolated into PostgREST `.or(...)` filters (fixed) |
| API-P2-002 | P2 | `PATCH /v1/auth/status` accepted unvalidated customStatus (fixed) |
| API-P2-003 | P2 | Inconsistent error response shapes (fixed) |

---

# 09_testing_quality_release_confidence — Prompt 09 - Testing, Quality, and Release Confidence Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `09_testing_quality_release_confidence.md` (area TEST, prompt)

## Verification Performed

Vitest thresholds, E2E self-provisioning
and the migration gate are all blocking now. The real-database RLS test still
does not run in CI.

## Findings

| ID | Severity | Title |
|---|---|---|
| TEST-P1-001 | P1 | E2E tests skipped without `test-signin.json` and were non-blocking (fixed) |
| TEST-P2-001 | P2 | Low coverage thresholds / non-blocking diff coverage (fixed) |
| TEST-P2-002 | P2 | RLS tenant-isolation SQL test exists but is not run by CI |
| TEST-P2-003 | P2 | Migration rollback was validated by file existence only (fixed) |

---

# 10_github_actions_cicd_governance — Prompt 10 - GitHub Actions, CI/CD, and Governance Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `10_github_actions_cicd_governance.md` (area CI, prompt)

## Verification Performed

Inspected all 22 workflows. Production
deploy/provision is gated behind the protected `production` environment;
security scans block; rollback executes. Residuals: destructive dev infra
workflow, auto-commit write scope, develop not branch-protected, and 13
workflows without explicit `permissions:`.

## Findings

| ID | Severity | Title |
|---|---|---|
| CI-P1-001 | P1 | Production provision/deploy ran destructive Terraform with no approval (fixed) |
| CI-P1-002 | P1 | Security scans were non-blocking (fixed) |
| CI-P2-001 | P2 | `infra-development` destroys infra on every push to `develop` |
| CI-P2-002 | P2 | Auto-commit workflows hold `contents: write` and push to main/develop |
| CI-P2-003 | P2 | `develop` (auto-deploy target) is not covered by the branch-protection gate |
| CI-P2-004 | P2 | `workflow_dispatch` inputs interpolated into `run:` (script injection) (fixed) |
| CI-P3-001 | P3 | 13 workflows omit an explicit `permissions:` block |

---

# 11_supply_chain_dependency_secrets — Prompt 11 - Supply Chain, Dependency, and Secrets Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `11_supply_chain_dependency_secrets.md` (area SC, prompt)

## Verification Performed

Secret/dependency/action supply-chain
review. The committed credential and the service-role key in the web container
are fixed; GitHub Actions are SHA-pinned; Trivy HIGH/CRITICAL is blocking.
Residuals are advisory-expiry and large binaries.

## Findings

| ID | Severity | Title |
|---|---|---|
| SC-P1-001 | P1 | Credential committed to the repository (fixed) |
| SC-P2-001 | P2 | Production web container received the Supabase service-role key (fixed) |
| SC-P2-002 | P2 | GitHub Actions were not pinned to commit SHAs (fixed) |
| SC-P2-003 | P2 | Dependency vulnerability scanning was advisory-only (fixed) |
| SC-P2-004 | P2 | Dependency risk-acceptances expire 2027-01-04 |
| SC-P3-001 | P3 | Large binary archives committed to the repository |

---

# 12_infra_deployment_environment_drift — Prompt 12 - Infrastructure, Deployment, and Environment Drift Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `12_infra_deployment_environment_drift.md` (area INFRA, prompt)

## Verification Performed

Terraform + compose review; the single
droplet is the only compute. dev/prod compose and env examples differ, and the
dev infra workflow can destroy resources.

## Findings

| ID | Severity | Title |
|---|---|---|
| INFRA-P2-001 | P2 | Single-droplet infrastructure has no environment isolation |
| INFRA-P3-001 | P3 | Terraform state/backend and provider versions exist but drift checks are absent |

---

# 13_resilience_recovery_failure_modes — Prompt 13 - Resilience, Recovery, and Failure Modes Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `13_resilience_recovery_failure_modes.md` (area RES, prompt)

## Verification Performed

Reviewed chaos scenarios, Redis recovery
and single-node failure modes. Chaos/k6 assets exist but are not scheduled.

## Findings

| ID | Severity | Title |
|---|---|---|
| RES-P2-001 | P2 | Single-node failure domains: API, worker, Redis and DB proxy co-resident |
| RES-P3-001 | P3 | Chaos and load tests are not part of a scheduled pipeline |

---

# 14_observability_monitoring_incident_readiness — Prompt 14 - Observability, Monitoring, and Incident Readiness Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `14_observability_monitoring_incident_readiness.md` (area OBS, prompt)

## Verification Performed

Alerting is now wired
(Prometheus + Alertmanager + ntfy, PR #95). Distributed tracing and error
tracking remain optional/incomplete.

## Findings

| ID | Severity | Title |
|---|---|---|
| OBS-P1-001 | P1 | No alerting wired despite metrics and a tracked TODO (fixed) |
| OBS-P2-001 | P2 | No distributed tracing / correlation to a collector |
| OBS-P3-001 | P3 | Error tracking (Sentry) is optional and admin error buffer is in-memory |

---

# 15_performance_scalability_cost — Prompt 15 - Performance, Scalability, and Cost Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `15_performance_scalability_cost.md` (area PERF, prompt)

## Verification Performed

Reviewed k6 assets, bundle analyzer, virtualised
lists. No performance budget or CI trend gate; DB connection/cost model
undocumented.

## Findings

| ID | Severity | Title |
|---|---|---|
| PERF-P3-001 | P3 | No performance budget / regression gate in CI |

---

# 16_documentation_devex_operator_readiness — Prompt 16 - Documentation, Developer Experience, and Operator Readiness Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `16_documentation_devex_operator_readiness.md` (area DOC, prompt)

## Verification Performed

Docs coverage is broad (runbooks,
architecture, compliance). Residual: a deployment-policy statement still
contradicts the development deploy workflow.

## Findings

| ID | Severity | Title |
|---|---|---|
| DOC-P3-001 | P3 | Deployment policy contradicts the development deploy workflow (DB changes) |
| DOC-P3-002 | P3 | Stale one-off reconciliation docs remain in the tree |

---

# 17_mobile_pwa_responsive_access — Prompt 17 - Mobile, PWA, and Responsive Access Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `17_mobile_pwa_responsive_access.md` (area MOB, prompt)

## Verification Performed

PWA assets present (manifest, service worker,
install/update prompts, push). No offline data story beyond the SW cache.

## Findings

| ID | Severity | Title |
|---|---|---|
| MOB-P3-001 | P3 | Service worker offline strategy is not covered by tests or a documented cache policy |

---

# 18_privacy_compliance_data_governance — Prompt 18 - Privacy, Compliance, and Data Governance Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `18_privacy_compliance_data_governance.md` (area PRIV, prompt)

## Verification Performed

Consent, legal (DPA, cookie banner) and GDPR
export/delete paths reviewed. Erasure completeness is the main residual.

## Findings

| ID | Severity | Title |
|---|---|---|
| PRIV-P2-001 | P2 | GDPR erasure path is a hard multi-table delete with partial coverage |
| PRIV-P3-001 | P3 | No automated data-retention enforcement |

---

# 19_platform_evolution_extensibility — Prompt 19 - Platform Evolution and Extensibility Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `19_platform_evolution_extensibility.md` (area EVOL, prompt)

## Verification Performed

Reviewed the route registry, SDK package and
feature-flag module for extension points. No public plugin/webhook-inbound API
beyond outbound webhooks.

## Findings

| ID | Severity | Title |
|---|---|---|
| EVOL-P3-001 | P3 | No extension/plugin contract or versioned public API surface |

---

# 20_ai_automation_agent_readiness — Prompt 20 - AI Automation and Agent Readiness Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `20_ai_automation_agent_readiness.md` (area AI, prompt)

## Verification Performed

The `ai` module is a deterministic text-transform
stub (spell/format actions), not an LLM integration. No prompt/data-governance
controls are needed yet, but the endpoint is unauthenticated-resistant only by
the global auth middleware.

## Findings

| ID | Severity | Title |
|---|---|---|
| AI-P2-001 | P2 | AI endpoint is a stub with no tenancy/data-governance or rate-limit contract |

---

# 21_repo_hygiene_maintainability — Prompt 21 - Repository Hygiene, Maintainability, and Code Health Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `21_repo_hygiene_maintainability.md` (area HYGIENE, prompt)

## Verification Performed

Hygiene pass on one-off scripts, duplicates and
encoding. Exec bits are fixed (#96); duplicates and stale artifacts remain.

## Findings

| ID | Severity | Title |
|---|---|---|
| HYGIENE-P3-001 | P3 | Tracked shell scripts lacked the exec bit (fixed) |
| HYGIENE-P3-002 | P3 | Duplicated logic/schema and one-off scripts remain |
| HYGIENE-P3-003 | P3 | Unresolved operational-metrics TODO (fixed) |

---

# 22_final_risk_register_roadmap — Prompt 22 - Final Risk Register, Roadmap, and Patch Plan

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `22_final_risk_register_roadmap.md` (area FINAL, prompt)

## Verification Performed

Synthesised the run. No P0/P1 remains open at
a62e44a; the residual set is P2/P3 structural/operational. The release gate is
conditional on the P2 webhook-encryption/SSRF and RLS-test-in-CI items.

## Findings

| ID | Severity | Title |
|---|---|---|
| FINAL-P1-001 | P1 | Release gate must remain conditional pending P2 remediation |
| FINAL-P2-001 | P2 | Dependency risk-acceptances expire 2027-01-04 |

---

# 23_executive_summary_release_gate — Prompt 23 - Executive Summary and Release Gate

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `23_executive_summary_release_gate.md` (area EXEC, prompt)

## Verification Performed

Produced the executive summary and gate for
this run, reconciling with the pilot and the post-merge re-audit.

## Findings

| ID | Severity | Title |
|---|---|---|
| EXEC-P1-001 | P1 | Release gate must remain conditional pending P1/P2 remediation |
| EXEC-P2-001 | P2 | Prior pilot register self-consistency (stale-base false positive) corrected |

---

# 24_access_control_matrix_audit — Prompt 24 - Access Control Matrix Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `24_access_control_matrix_audit.md` (area ACM, prompt)

## Verification Performed

Built the role/resource matrix from
`apps/api/src/middleware/require-admin.ts`, `authenticate.ts`, the module
routers and the RLS policies. Platform-admin vs workspace-admin are now a
single helper; anonymous Supabase fallbacks are gone.

## Findings

| ID | Severity | Title |
|---|---|---|
| ACM-P2-001 | P2 | RBAC matrix is enforced per-route but not documented as a single ARtifact |
| ACM-P3-001 | P3 | Admin `/stats` leaks global cross-tenant counters |

---

# 25_multi_tenant_isolation_attack_simulation — Prompt 25 - Multi-Tenant Isolation Attack Simulation

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `25_multi_tenant_isolation_attack_simulation.md` (area MT, prompt)

## Verification Performed

Simulated cross-tenant reads
against the admin surface and the auth directory. The historical IDOR and
user-directory findings are fixed; the global `/stats` counters remain.

## Findings

| ID | Severity | Title |
|---|---|---|
| MT-P2-001 | P2 | IDOR: admin dead-letter retry was not tenant-scoped (fixed) |
| MT-P2-002 | P2 | Cross-tenant user directory via auth service (fixed) |
| MT-P3-001 | P3 | Admin `/stats` returns global cross-tenant counts (residual) |

---

# 26_admin_console_abuse_case_audit — Prompt 26 - Admin Console Abuse Case Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `26_admin_console_abuse_case_audit.md` (area ADMIN, prompt)

## Verification Performed

Walked the admin routers for destructive
or bulk operations, tenant scoping and audit logging. Bulk import and
compliance exports are scoped; admin error handling is buffered in memory.

## Findings

| ID | Severity | Title |
|---|---|---|
| ADMIN-P2-001 | P2 | Bulk import / compliance export operated globally (fixed) |
| ADMIN-P3-001 | P3 | Admin error buffer is in-memory only (lost on restart) |

---

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

---

# 28_file_upload_download_security_audit — Prompt 28 - File Upload and Download Security Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `28_file_upload_download_security_audit.md` (area FILE, prompt)

## Verification Performed

Reviewed `validators/upload.ts`, the
`/messages/upload` handler and storage bucket usage. Validation is a
client-declared content-type + extension blocklist; uploads return a public
URL from the `chat-uploads` bucket.

## Findings

| ID | Severity | Title |
|---|---|---|
| FILE-P2-001 | P2 | Uploads return a public URL from `chat-uploads` and trust client-declared content type |
| FILE-P3-001 | P3 | No per-tenant/user quota or total-storage cap on uploads |

---

# 29_billing_payments_reconciliation_audit — Prompt 29 - Billing, Payments, and Reconciliation Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `29_billing_payments_reconciliation_audit.md` (area BILL, prompt)

## Verification Performed

Not applicable / future readiness:
no billing, payment, subscription or reconciliation module exists in `apps/*`
or `supabase/migrations`. The platform is workspace/role based with no
monetisation surface, so no payment handling, webhook reconciliation or PCI
scope was found to audit.

## Findings

_No findings in this domain._

---

# 30_notification_email_push_delivery_audit — Prompt 30 - Notification, Email, and Push Delivery Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `30_notification_email_push_delivery_audit.md` (area NOTIF, prompt)

## Verification Performed

Reviewed `notifications` service,
push-subscription service and web push client. Listing is user-scoped; push
subscriptions are stored per user. No transactional email provider is wired.

## Findings

| ID | Severity | Title |
|---|---|---|
| NOTIF-P2-001 | P2 | Notifications are delivered only via Web Push; no durable multi-channel delivery/retry |
| NOTIF-P3-001 | P3 | Push subscription lifecycle (revocation/expiry) is not monitored |

---

# 31_search_indexing_privacy_audit — Prompt 31 - Search, Indexing, and Privacy Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `31_search_indexing_privacy_audit.md` (area SEARCH, prompt)

## Verification Performed

Not applicable / future readiness: there is
no dedicated search index or external search backend. Message search, where
present, is a PostgREST query over tenant-scoped tables; no indexing of PII to
a third party was found.

## Findings

| ID | Severity | Title |
|---|---|---|
| SEARCH-P3-001 | P3 | No documented search data-flow / retention statement |

---

# 32_backup_restore_drill — Prompt 32 - Backup and Restore Drill Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `32_backup_restore_drill.md` (area DR, prompt)

## Verification Performed

Backup/restore runbooks exist (`backup-strategy.md`,
`database-restore.md`) but no executed-drill artifact at this commit.

## Findings

| ID | Severity | Title |
|---|---|---|
| DR-P3-001 | P3 | No evidence of an executed restore drill / RPO-RTO validation |

---

# 33_incident_tabletop_exercise — Prompt 33 - Incident Tabletop Exercise

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `33_incident_tabletop_exercise.md` (area IR, prompt)

## Verification Performed

Incident-response runbook exists; no tabletop
exercise artifact at this commit.

## Findings

| ID | Severity | Title |
|---|---|---|
| IR-P3-001 | P3 | No evidence of a conducted incident tabletop exercise |

---

# 34_branch_protection_required_checks — Prompt 34 - Branch Protection and Required Checks Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `34_branch_protection_required_checks.md` (area BP, prompt)

## Verification Performed

Branch-protection requirements are
server-side and cannot be proven from a clone. In-repo gate reviewed; it only
targets `main`.

## Findings

| ID | Severity | Title |
|---|---|---|
| BP-P2-001 | P2 | In-repo branch-protection gate covers only `main`, not `develop` |
| BP-P3-001 | P3 | Server-side environment/ruleset configuration is not verifiable from source |

---

# 35_sbom_license_policy — Prompt 35 - SBOM and License Policy Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `35_sbom_license_policy.md` (area SBOM, prompt)

## Verification Performed

SBOMs are produced for production images (deploy
workflow) but not signed/attested; no dependency-review or license policy gate
is wired.

## Findings

| ID | Severity | Title |
|---|---|---|
| SBOM-P3-001 | P3 | SBOMs are generated but not signed or attested |
| SBOM-P3-002 | P3 | No license policy / dependency-review gate |

---

# 36_container_runtime_security — Prompt 36 - Container Runtime Security Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `36_container_runtime_security.md` (area CTR, prompt)

## Verification Performed

Dockerfile/compose runtime review. Images run
non-root; third-party images are digest-pinned. Residual: no seccomp/cap-drop/
read-only/no-new-privileges runtime profile.

## Findings

| ID | Severity | Title |
|---|---|---|
| CTR-P3-001 | P3 | Containers lack runtime hardening beyond non-root and digest pinning |
| CTR-P3-002 | P3 | First-party images are referenced by mutable tag (`:latest`/`:dev`) |

---

# 37_supabase_rls_policy_deep_dive — Prompt 37 - Supabase RLS Policy Deep-Dive Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `37_supabase_rls_policy_deep_dive.md` (area RLS, prompt)

## Verification Performed

Deep-dived every policy in
`supabase/policies` and the migration chain that touches `public.users`,
`messages`, `channels` and tenant tables. The `USING (true)` user-read policy
is gone; the current policy is own-profile OR shared-workspace.

## Findings

| ID | Severity | Title |
|---|---|---|
| RLS-P1-001 | P1 | Global `users_select USING (true)` policy (fixed) |
| RLS-P2-001 | P2 | RLS policy test exists but is not executed by CI |

---

# 38_env_secret_rotation — Prompt 38 - Environment and Secret Rotation Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `38_env_secret_rotation.md` (area SECRET, prompt)

## Verification Performed

Reviewed `docs/security/secrets-rotation.md`,
`jwks_rotation.md` and the env examples. Rotation is documented but manual;
no expiry/rotation monitoring is wired.

## Findings

| ID | Severity | Title |
|---|---|---|
| SECRET-P3-001 | P3 | Secret rotation is documented but not scheduled or monitored |
| SECRET-P3-002 | P3 | `.env` example files diverge between environments |

---

# 39_analytics_tracking_privacy — Prompt 39 - Analytics, Tracking, and Privacy Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `39_analytics_tracking_privacy.md` (area AN, prompt)

## Verification Performed

Not applicable / future readiness: no
third-party analytics or tracking SDK (Segment/PostHog/GA) is present. Only
first-party metrics (Prometheus) and Sentry error reporting are wired.

## Findings

_No findings in this domain._

---

# 40_release_notes_changelog_generator — Prompt 40 - Release Notes and Changelog Generator

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `40_release_notes_changelog_generator.md` (area REL, prompt)

## Verification Performed

CHANGELOG.md is maintained manually; no
generator/CI enforcement ties releases to changelog entries.

## Findings

| ID | Severity | Title |
|---|---|---|
| REL-P3-001 | P3 | CHANGELOG has no generator/CI gate |

---

# 45_exploit_chain_attack_path_audit — Prompt 45 - Exploit Chain and Attack Path Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `45_exploit_chain_attack_path_audit.md` (area CHAIN, prompt)

## Verification Performed

Chained the residual findings. No P0/P1
exploit chain is reachable at a62e44a; the reachable chain requires the
webhook-encryption key to be misconfigured plus an SSRF redirect.

## Findings

| ID | Severity | Title |
|---|---|---|
| CHAIN-P2-001 | P2 | Webhook SSRF + missing encryption key form a plausible internal-reach chain |
| CHAIN-P3-001 | P3 | Public upload URL + client-declared content type is a stored-content risk |

---

# Deterministic checks — deterministic

Machine checks (no LLM). Findings use the `DET` area.

## Findings

| ID | Title | Severity |
|---|---|---|
| DET-P3-001 | [DEP] trivy not installed (dependency vuln scan skipped) | P3 |
| DET-P3-002 | [SUPPLY] 9 container image(s) without a digest pin | P3 |
| DET-P3-003 | [SUPPLY] hadolint not installed (Dockerfile lint skipped) | P3 |

## Detail

### Finding ID: DET-P3-001 - [DEP] trivy not installed (dependency vuln scan skipped)

Install trivy to enable the --deep dependency vulnerability scan.


### Finding ID: DET-P3-002 - [SUPPLY] 9 container image(s) without a digest pin

Pin images by digest (`image@sha256:...`) for reproducible, tamper-evident deploys.

- `infra/docker/docker-compose.prod.yml:29 ${WEB_IMAGE:-ghcr.io/mainecybertech/chat/web:latest}`
- `infra/docker/docker-compose.prod.yml:49 ${WORKER_IMAGE:-ghcr.io/mainecybertech/chat/worker:latest}`
- `infra/docker/docker-compose.prod.yml:116 ${API_IMAGE:-ghcr.io/mainecybertech/chat/api:latest}`
- `infra/docker/docker-compose.devremote.yml:26 ${WEB_IMAGE:-ghcr.io/mainecybertech/chat/web:dev}`
- `infra/docker/docker-compose.devremote.yml:69 ${WORKER_IMAGE:-ghcr.io/mainecybertech/chat/worker:dev}`
- `infra/docker/docker-compose.devremote.yml:106 ${API_IMAGE:-ghcr.io/mainecybertech/chat/api:dev}`
- `infra/docker/docker-compose.dev.yml:29 chat-web:dev`
- `infra/docker/docker-compose.dev.yml:61 chat-api:dev`
- `infra/docker/docker-compose.dev.yml:99 chat-worker:dev`

### Finding ID: DET-P3-003 - [SUPPLY] hadolint not installed (Dockerfile lint skipped)

Install hadolint to lint Dockerfiles in --deep mode.

