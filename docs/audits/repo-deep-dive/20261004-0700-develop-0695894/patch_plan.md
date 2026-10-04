# Patch plan

## SEC-P1-001 - Seed workflow can re-open global user RLS (USING true) in production and seed shared-password accounts

Remove RLS DDL from seed-database.yml; apply policies only via migrations. Block production seeding or require a protected environment. Never embed a shared password hash in CI.

## CI-P1-001 - Production provision job runs destructive Terraform with no environment approval

Attach a protected production environment to provision/build-images, require plan+approval before apply, and drop unused id-token: write.

## AUTH-P2-001 - IDOR: admin dead-letter retry is not tenant-scoped

Resolve the dead letter to its workspace and require it be within req.adminWorkspaceIds before calling retryDeadLetter.

## SEC-P2-001 - Cross-tenant user directory via auth service (service-role, unscoped)

Scope these queries to the caller's workspace co-members or use the user-scoped Supabase client instead of the service-role client.

## CI-P2-001 - infra-development destroys infra on every push to develop with weak controls

Add permissions: contents: read, gate with a protected development environment, pin known_hosts, separate plan from apply.

## CI-P2-002 - workflow_dispatch inputs interpolated directly into run: (script injection)

Pass inputs through env: and reference shell variables; validate run_id/source_branch with a strict regex.

## SUPPLY-P2-001 - Production web container receives the Supabase service-role key

Remove SUPABASE_SERVICE_ROLE_KEY from x-common-env and inject it only into api and worker.

## DEP-P2-001 - 33 HIGH/CRITICAL dependency advisories risk-accepted until 2026-11-03

Land dependency upgrades before expiry; keep allowlist per-CVE with tracking issues; verify fixed versions against the trivy/audit DB.

## CI-P2-003 - Auto-commit workflows hold contents: write and push to main

Use contents: read and open a PR, or restrict the bot with a narrowly scoped ruleset exception; do not skip CI on generated changes.

## CI-P2-004 - Branch-protection CI gate only validates main; develop (auto-deploy) unchecked

Validate main, develop and release/**; declare explicit permissions for the check; map required status checks per branch.

## SEC-P2-002 - Webhook SSRF protection does not constrain redirects/DNS rebinding

Reject 3xx with redirect: manual, pin the validated IP for the connection, and re-validate on every attempt.

## SEC-P2-003 - WEBHOOK_ENCRYPTION_KEY not passed by production compose and not in .env.example

Add WEBHOOK_ENCRYPTION_KEY to docker-compose.prod.yml, .env.example, and the rotation guide.

## SUPPLY-P3-001 - Container images pinned only by mutable tag

Pin base and infra images by @sha256 digest and let Dependabot bump digests.

## DEP-P3-001 - 24 medium/low advisories are non-gating

Add a non-blocking medium SARIF report and a scheduled triage.

## SUPPLY-P3-002 - Dockerfile lint: unpinned apk and shell-form HEALTHCHECK

Pin apk versions, use exec-form HEALTHCHECK, fix worker EXPOSE to 4100.

## CI-P3-001 - No actionlint/shellcheck gate despite known workflow lint findings

Add a pinned actionlint job to validate.yml.

## PORT-P3-001 - Tracked shell scripts lack the exec bit

git update-index --chmod=+x the intended executables.

## CONF-P3-001 - Deployment policy contradicts the development deploy workflow (DB changes)

Reconcile the policy with the workflows or remove migrations from the deploy workflow.

## CONF-P3-002 - Admin /stats returns global cross-tenant counts

Scope all four counts to workspaceIds.

## CI-P3-002 - Many workflows omit permissions: and rely on default token scope

Set a repo default of read-only and add explicit least-privilege permissions block per workflow.

## SUPPLY-P3-003 - SBOMs generated but not signed/attested; no license or dependency-review gate

Add build provenance attestation, sign images/SBOMs, and a dependency-review/license gate.

## SUPPLY-P3-004 - Containers lack runtime hardening beyond non-root

Add read_only, cap_drop: [ALL], security_opt: [no-new-privileges:true], and tmpfs for writable paths where compatible.

