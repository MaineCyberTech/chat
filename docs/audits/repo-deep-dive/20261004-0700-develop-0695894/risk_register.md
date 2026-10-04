# Follow-up register

| Finding | Severity | Title | Owner | Target | Status | Note |
|---|---|---|---|---|---|---|
| SEC-P1-001 | P1 | Seed workflow can re-open global user RLS (USING true) in production and seed shared-password accounts | @owner | SEC | open | Remove RLS DDL from seed-database.yml; apply policies only via migrations. Block production seeding or require a protect |
| CI-P1-001 | P1 | Production provision job runs destructive Terraform with no environment approval | @owner | CI | open | Attach a protected production environment to provision/build-images, require plan+approval before apply, and drop unused |
| AUTH-P2-001 | P2 | IDOR: admin dead-letter retry is not tenant-scoped | @owner | AUTH | open | Resolve the dead letter to its workspace and require it be within req.adminWorkspaceIds before calling retryDeadLetter. |
| SEC-P2-001 | P2 | Cross-tenant user directory via auth service (service-role, unscoped) | @owner | SEC | open | Scope these queries to the caller's workspace co-members or use the user-scoped Supabase client instead of the service-r |
| CI-P2-001 | P2 | infra-development destroys infra on every push to develop with weak controls | @owner | CI | open | Add permissions: contents: read, gate with a protected development environment, pin known_hosts, separate plan from appl |
| CI-P2-002 | P2 | workflow_dispatch inputs interpolated directly into run: (script injection) | @owner | CI | open | Pass inputs through env: and reference shell variables; validate run_id/source_branch with a strict regex. |
| SUPPLY-P2-001 | P2 | Production web container receives the Supabase service-role key | @owner | SUPPLY | open | Remove SUPABASE_SERVICE_ROLE_KEY from x-common-env and inject it only into api and worker. |
| DEP-P2-001 | P2 | 33 HIGH/CRITICAL dependency advisories risk-accepted until 2026-11-03 | @owner | DEP | open | Land dependency upgrades before expiry; keep allowlist per-CVE with tracking issues; verify fixed versions against the t |
| CI-P2-003 | P2 | Auto-commit workflows hold contents: write and push to main | @owner | CI | open | Use contents: read and open a PR, or restrict the bot with a narrowly scoped ruleset exception; do not skip CI on genera |
| CI-P2-004 | P2 | Branch-protection CI gate only validates main; develop (auto-deploy) unchecked | @owner | CI | open | Validate main, develop and release/**; declare explicit permissions for the check; map required status checks per branch |
| SEC-P2-002 | P2 | Webhook SSRF protection does not constrain redirects/DNS rebinding | @owner | SEC | open | Reject 3xx with redirect: manual, pin the validated IP for the connection, and re-validate on every attempt. |
| SEC-P2-003 | P2 | WEBHOOK_ENCRYPTION_KEY not passed by production compose and not in .env.example | @owner | SEC | open | Add WEBHOOK_ENCRYPTION_KEY to docker-compose.prod.yml, .env.example, and the rotation guide. |
| SUPPLY-P3-001 | P3 | Container images pinned only by mutable tag | @owner | SUPPLY | open | Pin base and infra images by @sha256 digest and let Dependabot bump digests. |
| DEP-P3-001 | P3 | 24 medium/low advisories are non-gating | @owner | DEP | open | Add a non-blocking medium SARIF report and a scheduled triage. |
| SUPPLY-P3-002 | P3 | Dockerfile lint: unpinned apk and shell-form HEALTHCHECK | @owner | SUPPLY | open | Pin apk versions, use exec-form HEALTHCHECK, fix worker EXPOSE to 4100. |
| CI-P3-001 | P3 | No actionlint/shellcheck gate despite known workflow lint findings | @owner | CI | open | Add a pinned actionlint job to validate.yml. |
| PORT-P3-001 | P3 | Tracked shell scripts lack the exec bit | @owner | PORT | open | git update-index --chmod=+x the intended executables. |
| CONF-P3-001 | P3 | Deployment policy contradicts the development deploy workflow (DB changes) | @owner | CONF | open | Reconcile the policy with the workflows or remove migrations from the deploy workflow. |
| CONF-P3-002 | P3 | Admin /stats returns global cross-tenant counts | @owner | CONF | open | Scope all four counts to workspaceIds. |
| CI-P3-002 | P3 | Many workflows omit permissions: and rely on default token scope | @owner | CI | open | Set a repo default of read-only and add explicit least-privilege permissions block per workflow. |
| SUPPLY-P3-003 | P3 | SBOMs generated but not signed/attested; no license or dependency-review gate | @owner | SUPPLY | open | Add build provenance attestation, sign images/SBOMs, and a dependency-review/license gate. |
| SUPPLY-P3-004 | P3 | Containers lack runtime hardening beyond non-root | @owner | SUPPLY | open | Add read_only, cap_drop: [ALL], security_opt: [no-new-privileges:true], and tmpfs for writable paths where compatible. |
