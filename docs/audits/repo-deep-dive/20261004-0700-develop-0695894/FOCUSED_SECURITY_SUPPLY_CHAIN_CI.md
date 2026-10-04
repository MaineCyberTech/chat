# Repo Deep-Dive — Security / Supply-Chain / CI (repo: chat)

## Audit Metadata

- Audit name: repo-deep-dive / chat
- Run: 20261004-llm
- Repository: `C:\temp\chat`
- Branch: `develop`
- Commit SHA: `06958941dcc669f1e4174c4477bd4ae9a69bad26` ("Merge pull request #87 … fix/lockfile-regen-20261004")
- Generated at: 2026-10-04
- Auditor: LLM security/supply-chain/CI subagent (evidence-first, read-only)
- Scope: secrets/credentials, dependencies & supply chain, GitHub Actions/CI-CD governance, authz/tenancy (RLS), container pinning/runtime, branch protection, secret rotation.
- Scope limitations: no network/vuln-DB access (trivy fixed-version availability not independently reproducible); GitHub server-side branch protection/ruleset rules and repo/org secret values are not visible from the working tree; live containers were not run.

---

## Verification performed

- Read all 21 files under `.github/workflows/`, `CODEOWNERS`, `dependabot.yml`, both `docker-compose` prod/dev files, all three app `Dockerfile`s, `.trivyignore`, `.pnpm-audit-exceptions.json`, `.npmrc`, `.dockerignore`, `.gitattributes`, `.env.example` plus all `.env*.example`.
- Read RLS migrations and the latest policy that defines `public.users` SELECT (`20260724000006_fix_database_p1_findings.sql`), the RLS tenant-isolation test `supabase/tests/rls_tenant_isolation.sql`, the API auth/authz middleware, webhook service/routes, rate-limit, CSRF, security headers, metrics-auth, admin routes, and the web Supabase browser client.
- Confirmed git file modes with `git ls-files -s` for the DET exec-bit claim.
- Secret values were never printed; only path + type are reported.

---

## Deterministic findings validation

| DET ID | Verdict | Evidence / notes |
|---|---|---|
| DET-P2-001 actionlint SC2086 | **REAL (low)** | `.github/workflows/build-push.yml:40`, `chaos-tests.yml:25,62`, `deploy-development.yml:37` contain unquoted shell expansions (e.g. `>> $GITHUB_ENV`, `$DO_TOKEN`, `$GITHUB_OUTPUT`). Real shellcheck info-level warnings. **No `actionlint`/`shellcheck` job exists in any workflow** (grep found 0 references), so this does not gate CI → impact downgraded to P3. |
| DET-P1-002 trivy 33 P1 (HIGH/CRITICAL) | **REAL (time-boxed)** | All listed packages are present in `pnpm-lock.yaml` (e.g. `brace-expansion@1.1.15/2.1.2/5.0.6`, `engine.io@6.6.9`, `fast-uri@3.1.3`, `postcss@8.4.31/8.5.15`, `nanoid@3.3.13`, `socket.io-parser@4.2.6`, `next`). CI runs trivy fs with `severity: HIGH,CRITICAL` + `exit-code: "1"` (`validate.yml:255-265`) but every listed CVE is in `.trivyignore` (expiry `2026-11-03`, `.trivyignore:5,10`). Real but explicitly risk-accepted. Fixed-version availability: **Unknown** (no vuln-DB access). Mix of runtime (`next`, `postcss`, `qs`, `body-parser`, `socket.io-parser`, `engine.io`, `fast-uri`) and dev (`esbuild`, `baseline-browser-mapping`, `vitest`-chain). |
| DET-P2-003 trivy 21 P2 | **REAL (presence)** | Packages present in `pnpm-lock.yaml` (`qs@6.15.2`, `dompurify@3.4.11`, `baseline-browser-mapping@2.10.x`, `postcss`, `next`, `fast-uri`, `brace-expansion`). These IDs are **not** in `.trivyignore`; CI only fails HIGH/CRITICAL so medium findings are non-gating. Fixed version: Unknown. |
| DET-P3-004 trivy 3 P3 | **REAL (presence)** | `body-parser@1.20.5`, `dompurify@3.4.11`, `esbuild@0.27.7/0.28.1` present in `pnpm-lock.yaml`. `esbuild`/vitest are dev-only. Not gating. Fixed version: Unknown. |
| DET-P2-005 10 shell scripts without exec bit | **REAL (mitigated)** | `git ls-files -s` shows mode `100644` for all 10 paths. Mitigations exist: `package.json` invokes `bash scripts/test-db-rls.sh`; docs use `bash scripts/setup-dev.sh`; `chaos-tests.yml:49,86` runs `chmod +x` before executing. Real repo-hygiene issue, low runtime impact. |
| DET-P2-006 gitleaks generic-api-key | **FALSE-POSITIVE** | `apps/web/components/shared/keyboard-shortcuts.tsx:15` is a keybinding label (`{ keys: "Ctrl+Shift+Down", labelKey: "nextChannel" }`); the rule matched the word "key". No secret. No `.gitleaks.toml` exists to allowlist it. |
| DET-P2-007 gitleaks jwt (4) | **FALSE-POSITIVE** | `.github/workflows/validate.yml:473` and `infra/docker/.env.dev.example:6,7,22` are the well-known **public Supabase local-dev demo JWTs** (`iss: supabase-demo`, `exp: 1983812996`). They are not real production credentials. `.env.dev.example:7` is a local service-role demo key; harmless but should be allowlisted in a `.gitleaks.toml` (none exists). |
| DET-P3-008 18 images without digest pin | **REAL** | `infra/docker/docker-compose.prod.yml:11,27,47,84,113,68`, `dev.yml`, `devremote.yml` use mutable tags (`caddy:2-alpine`, `redis:7-alpine`, `livekit/livekit-server:latest`, `…/api:latest`). |
| DET-P3-009 hadolint 6 issues | **REAL** | `apps/web/Dockerfile:53`, `apps/api/Dockerfile:46`, `apps/worker/Dockerfile:30` `apk add --no-cache wget` (DL3018); `apps/web/Dockerfile:59`, `apps/api/Dockerfile:50`, `apps/worker/Dockerfile:37` HEALTHCHECK shell-form (DL3025). All three images already run as non-root (good). |

---

## Findings

### chat-SEC-001 — P1 — Seed workflow re-opens global user read (RLS regression) and can seed known-password users into production

- Evidence:
  - `.github/workflows/seed-database.yml:4-13` `workflow_dispatch` with `environment` choice `development | production`.
  - `.github/workflows/seed-database.yml:79-85` creates/replaces RLS: `CREATE POLICY users_select ON public.users FOR SELECT TO authenticated USING (true)`.
  - `supabase/migrations/20260724000006_fix_database_p1_findings.sql:134-143` is the current, correct policy: `auth.uid() = id OR EXISTS (… co-members …)`.
  - `supabase/migrations/20260625000001_create_users.sql:10` `email TEXT NOT NULL` (PII is in this table).
  - `.github/workflows/seed-database.yml:71` sets a shared bcrypt hash for all `%@seed.test` users.
- What is happening: A manually-dispatchable workflow can target **production**, then (a) overwrite the tenant-scoped `users_select` policy with `USING (true)`, and (b) upsert seed accounts with a shared, documented password (`password123`).
- Why it matters: The current migration correctly scopes `public.users`; this workflow regresses it to a cross-tenant PII read. Because the web app uses the browser Supabase client (`apps/web/lib/supabase/client.ts:18-20`), any authenticated user can call PostgREST with their own JWT and read every tenant's user emails. Combined with seeded predictable credentials, this is a tenant-isolation and account-takeover risk on a production target.
- Recommendation: Remove the RLS `CREATE POLICY` statements from `seed-database.yml`; rely solely on versioned migrations. Forbid `environment=production` seeding (or gate on a protected environment + approval). Never set a shared password hash in CI.
- deterministic_ref: null. Confidence: high.

### chat-CI-001 — P1 — Production `provision` job runs destructive Terraform with no environment approval

- Evidence:
  - `.github/workflows/deploy-production.yml:16-17` triggers on `push: branches: [main]`.
  - `.github/workflows/deploy-production.yml:53-143` `provision` job: `terraform apply -auto-approve` (line 140) and deletes droplets/firewalls/DNS (lines 95-127).
  - `.github/workflows/deploy-production.yml:236-241` only the `deploy` job has `environment: production`; `provision`/`build-images` have no environment.
  - `.github/workflows/deploy-production.yml:19-22` grants `id-token: write` though no OIDC exchange is used.
- What is happening: Every push to `main` (or manual dispatch) immediately destroys/recreates production infrastructure with `-auto-approve`; approval protection only covers the later container `deploy` job.
- Why it matters: A bad merge to `main` can delete the production droplet, firewall, and DNS before any human approval step runs. `id-token: write` is unnecessary.
- Recommendation: Add `environment: production` (with required reviewers) to `provision` and `build-images`; run `terraform plan` and require approval before `apply`; drop unused `id-token: write`.
- deterministic_ref: null. Confidence: high.

### chat-AUTH-001 — P2 — IDOR: admin dead-letter retry is not tenant-scoped

- Evidence:
  - `apps/api/src/modules/admin/routes.ts:354-364` `POST /webhooks/dead-letters/:id/retry` calls `webhookService.retryDeadLetter(req.params.id)` with no workspace check, although the same file computes `workspaceIds` for sibling routes (`getAdminWorkspaceIds`, lines 25-37) and other handlers do scope by it.
  - `apps/api/src/modules/webhooks/service.ts:461-494` loads the dead letter by raw id and re-delivers it.
- What is happening: Any workspace admin can retry (and thereby trigger outbound delivery of) a dead letter belonging to a different workspace.
- Why it matters: Cross-tenant action/IDOR; an admin of workspace A can cause workspace B's webhook to be delivered (or probe its existence).
- Recommendation: Load the dead letter, resolve its `webhook_id → workspace_id`, and require it to be in `req.adminWorkspaceIds` before calling the service.
- deterministic_ref: null. Confidence: high.

### chat-SEC-002 — P2 — Cross-tenant user directory via auth service (service-role, unscoped)

- Evidence:
  - `apps/api/src/modules/auth/service.ts:44-53` `searchUsers` uses `getSupabaseAdmin()` and `ilike("display_name", …)` over the whole `users` table.
  - `apps/api/src/modules/auth/service.ts:55-64` `getProfiles(userIds)` uses the admin client and `.in("id", userIds)` for arbitrary IDs.
  - `apps/api/src/modules/auth/routes.ts:80-90` and `:93-105` expose these to any authenticated user.
- What is happening: Authenticated users can enumerate/search profiles and fetch arbitrary user IDs across all tenants (returns `id, display_name, avatar_url`; no email in this projection).
- Why it matters: Cross-tenant information disclosure; enables user enumeration for phishing/social engineering. (The stricter `users_select` RLS does not apply because the service-role client bypasses RLS.)
- Recommendation: Scope `searchUsers`/`getProfiles` to the caller's workspace co-members (join `workspace_members`), or use the user-scoped client instead of the admin client.
- deterministic_ref: null. Confidence: high.

### chat-CI-002 — P2 — `infra-development` destroys infra on every push to `develop` with weak controls

- Evidence:
  - `.github/workflows/infra-development.yml:4-8` triggers on `push: branches: [develop]`, `paths: infra/**`.
  - `:32-41` deletes duplicate droplets; `:93-105` deletes DNS records; `:107-126` `terraform apply -auto-approve`.
  - `:135-138` writes `CI_SSH_PRIVATE_KEY` to `/tmp/ssh_key` and uses `-o StrictHostKeyChecking=no`.
  - No `permissions:` block and no `environment:`.
- What is happening: Merging an `infra/**` change to `develop` auto-applies destructive infrastructure changes; default token permissions; SSH host-key verification disabled.
- Why it matters: Destructive infra changes ship without approval or least-privilege token scoping; disabling host-key checking enables MITM of the deploy SSH path.
- Recommendation: Add `permissions: contents: read`, gate with a protected `development` environment, pin host keys (`known_hosts`), and separate plan/apply with approval.
- deterministic_ref: null. Confidence: high.

### chat-CI-003 — P2 — `workflow_dispatch` inputs interpolated directly into `run:` (script injection)

- Evidence:
  - `.github/workflows/hardening-automation-runner.yml:17-19` `python … --run-id "${{ inputs.run_id }}"`.
  - `.github/workflows/environment-promotion-audit.yml:24` `--source-branch "${{ inputs.source_branch }}"`.
  - `.github/workflows/audit-release-certification.yml:30,34` `--run-id "${{ inputs.run_id }}"`.
- What is happening: Free-text workflow inputs are substituted into shell commands. Although dispatch requires write access, this is the classic GitHub Actions script-injection sink.
- Why it matters: A user able to dispatch can execute arbitrary shell on the runner (and reach the job's token/secrets).
- Recommendation: Pass inputs via `env:` and reference `"$RUN_ID"` in the script; add `zod`/regex validation of `run_id`/`source_branch`.
- deterministic_ref: null. Confidence: high.

### chat-SUPPLY-001 — P2 — Production web container receives the Supabase service-role key

- Evidence:
  - `infra/docker/docker-compose.prod.yml:3-7` `x-common-env` includes `SUPABASE_SERVICE_ROLE_KEY`.
  - `:26-32` `web` service merges `*common-env`; `:46-53` `worker`; `:112-124` `api`.
  - `apps/api/src/lib/supabase.ts:148-175` shows the service-role client bypasses RLS entirely.
- What is happening: The internet-facing Next.js `web` container is given the full-privilege service-role key even though only the API/worker need it.
- Why it matters: Expands blast radius of any web-tier compromise/log leak (full DB read/write, RLS bypass). Violates least privilege.
- Recommendation: Remove `SUPABASE_SERVICE_ROLE_KEY` from `x-common-env`; inject it only into `api`/`worker` services.
- deterministic_ref: null. Confidence: high.

### chat-DEP-001 — P2 — 33 HIGH/CRITICAL dependency advisories risk-accepted until 2026-11-03

- Evidence:
  - `validate.yml:227-254` `pnpm audit --prod` blocking with `.pnpm-audit-exceptions.json` (30 GHSA IDs, expiry `2026-11-03`).
  - `validate.yml:255-265` trivy fs `severity: HIGH,CRITICAL`, `exit-code: "1"`.
  - `.trivyignore:5,10` time-boxes the same findings to `2026-11-03`.
  - `pnpm-lock.yaml` contains the flagged packages (see DET table).
- What is happening: The gate fails closed, but a broad, time-boxed allowlist currently suppresses everything. Both allowlists expire the same day, after which CI will fail hard.
- Why it matters: Real known-vulnerable runtime packages (e.g. `next`, `qs`, `body-parser`, `postcss`, `socket.io-parser`) are shipping. If the dependency bump slips past expiry, releases block.
- Recommendation: Track and land the dependency upgrades before 2026-11-03; keep the allowlist small and per-CVE; verify fixed versions against the trivy/audit DB.
- deterministic_ref: DET-P1-002. Confidence: medium (presence high; fixed-version availability unknown).

### chat-CI-004 — P2 — Auto-commit workflows hold `contents: write` and push to `main`

- Evidence:
  - `.github/workflows/audit-ci-autocommit.yml:17-18` `permissions: contents: write`; `:45-49` `stefanzweifel/git-auto-commit-action` pushing `docs/audits/**`; trigger `push` to `main` (`:4-14`).
  - `.github/workflows/audit-badges-autocommit.yml:10-11` same; `:23-26` auto-commit on push to `main`/`development`.
- What is happening: On every matching push, a workflow runs in-repo Python and commits/pushes generated files directly to a protected branch with `[skip ci]`.
- Why it matters: Self-modifying automation with write access to `main`; if the generator or its inputs are tampered with, commits land without PR review. `[skip ci]` suppresses re-validation.
- Recommendation: Restrict to `contents: read` and open a PR (or use a dedicated bot with a ruleset exception), and never `[skip ci]` on generated changes.
- deterministic_ref: null. Confidence: medium.

### chat-BP-001 — P2 — Branch-protection CI gate only validates `main`; `develop` (auto-deploy) unchecked

- Evidence:
  - `validate.yml:273-323` `branch-protection` job hard-codes `const branch = 'main'` and required rule types `pull_request`, `required_status_checks`, `non_fast_forward`.
  - `ci.yml:5` `push` runs on `[main, develop]`; `.github/workflows/deploy-development.yml:6` auto-deploys `develop`.
  - `CODEOWNERS:2` has only a single catch-all owner line.
- What is happening: The in-repo governance gate never inspects `develop`, yet `develop` auto-deploys and is the integration branch. The check also needs repo "administration: read" for the rules endpoint under the default `GITHUB_TOKEN`.
- Why it matters: Weak/false assurance: a misconfigured `develop` passes the gate, and `main`-rule reads may fail depending on token scope.
- Recommendation: Validate `main`, `develop`, and `release/**`; declare explicit `permissions:` for the check; document the required ruleset/checks.
- deterministic_ref: null. Confidence: medium.

### chat-SEC-003 — P2 — Webhook SSRF protection does not constrain redirects/DNS rebinding

- Evidence:
  - `packages/config/webhook-utils.ts:64-83` validates scheme + resolved IPv4 against private ranges.
  - `apps/api/src/modules/webhooks/service.ts:245-253` uses `fetch(endpoint.url, …)` (Node fetch follows redirects by default and re-resolves at request time).
- What is happening: A workspace admin can register an https URL that passes validation but redirects to an internal address (or rebinds DNS) at delivery time, when the API/worker performs the fetch.
- Why it matters: SSRF from the API/worker network into internal services/metadata endpoints.
- Recommendation: Use `redirect: "manual"` (reject 3xx), pin the validated IP for the connection, and re-validate on every attempt.
- deterministic_ref: null. Confidence: medium.

### chat-SEC-004 — P2 — `WEBHOOK_ENCRYPTION_KEY` not passed by the production compose file

- Evidence:
  - `docs/environments/env-vars.md:88-94` states the root `.env.example` omits `WEBHOOK_ENCRYPTION_KEY`, `docker-compose.prod.yml` does not pass it to the API, and `apps/api/src/modules/webhooks/service.ts:22` throws when it is unset.
  - `infra/docker/docker-compose.prod.yml:117-124` API env has no `WEBHOOK_ENCRYPTION_KEY`.
- What is happening: Documented config gap. If operators do not add the key out of band, webhook create/update/delivery throws.
- Why it matters: Broken feature in production, or a temptation to use a weak/rotating-unaware key. Also unlisted in `.env.example`.
- Recommendation: Add `WEBHOOK_ENCRYPTION_KEY` to `docker-compose.prod.yml`, root `.env.example`, and the rotation guide.
- deterministic_ref: null. Confidence: high.

### chat-SUPPLY-002 — P3 — Container images pinned only by mutable tag

- Evidence: `infra/docker/docker-compose.prod.yml:11,27,47,68,84,113` (`caddy:2-alpine`, `…/web:latest`, `livekit/livekit-server:latest`, `redis:7-alpine`, `…/api:latest`); `infra/docker/docker-compose.dev.yml`/`devremote.yml` same pattern; `apps/*/Dockerfile:4,17,27,46` `node:*-alpine` tags.
- What is happening: No `@sha256:` digests anywhere.
- Why it matters: Non-reproducible, mutable deploys; tag retagging is a supply-chain vector.
- Recommendation: Pin base and infra images by digest; let Dependabot bump digests.
- deterministic_ref: DET-P3-008. Confidence: high.

### chat-DEP-002 — P3 — 24 medium/low advisories are non-gating

- Evidence: `validate.yml:255-265` only scans `HIGH,CRITICAL`; DET-P2-003/DET-P3-004 IDs are not in `.trivyignore`.
- What is happening: Medium/low CVEs accumulate without a gate.
- Why it matters: Unknown/medium issues can become exploitable; no prioritization signal.
- Recommendation: Add a non-blocking medium report/SARIF and a monthly triage.
- deterministic_ref: DET-P2-003, DET-P3-004. Confidence: medium.

### chat-SUPPLY-003 — P3 — Dockerfile lint (unpinned apk, shell-form HEALTHCHECK)

- Evidence: `apps/web/Dockerfile:53,59`; `apps/api/Dockerfile:46,50`; `apps/worker/Dockerfile:30,37`. Also `apps/worker/Dockerfile:35` `EXPOSE 4001` while health checks use port 4100 (`.github/…`/compose `docker-compose.prod.yml:56` and `apps/worker/src/health.ts`), a stale EXPOSE.
- What is happening: `apk add wget` unpinned; HEALTHCHECK written in shell form.
- Why it matters: Lower reproducibility; minor lint debt.
- Recommendation: Pin apk versions, use exec-form HEALTHCHECK, fix worker `EXPOSE 4100`.
- deterministic_ref: DET-P3-009. Confidence: high.

### chat-CI-005 — P3 — No actionlint/shellcheck gate despite known lint findings

- Evidence: DET-P2-001 lines; grep of `.github/workflows/**` for `actionlint` returns no matches. CI runs prettier/eslint/typecheck/test/build (`validate.yml`) but not workflow lint.
- What is happening: Workflow YAML/shell lint is not enforced.
- Why it matters: Workflow quality regressions ship silently (as the SC2086 findings show).
- Recommendation: Add an `actionlint` job (pinned action) to `validate.yml`.
- deterministic_ref: DET-P2-001. Confidence: high.

### chat-PORT-001 — P3 — Shell scripts lack the exec bit

- Evidence: `git ls-files -s` shows `100644` for `scripts/setup-dev.sh`, `scripts/test-db-rls.sh`, `scripts/check-sensitive-data.sh`, `scripts/hardening/run_all.sh`, `scripts/accessibility-audit.sh`, `scripts/audits/run_audit_cycle.sh`, `scripts/automation/run_full_pipeline.sh`, `scripts/teardown-dev.sh`, `tests/chaos/scenarios/api-crash.sh`, `tests/chaos/scenarios/redis-down.sh`. `.gitattributes` normalizes `*.sh text` but does not set mode.
- What is happening: `./script.sh` fails on Linux; callers use `bash script.sh` or `chmod +x` (mitigation).
- Why it matters: Portability/portability-drift (Windows checkouts); surprises in CI/runbooks.
- Recommendation: `git update-index --chmod=+x` the intended executables.
- deterministic_ref: DET-P2-005. Confidence: high.

### chat-CONF-001 — P3 — Deployment policy contradicts the development deploy workflow (DB changes)

- Evidence:
  - `docs/operations/deployment-policy.md:35-37` "Deploys ship application images only. Schema, RLS policies, functions, and seed data are applied through versioned, reviewed channels — never from a deploy workflow."
  - `.github/workflows/deploy-development.yml:87-93` runs `supabase link … && supabase db push --include-all` inside the deploy workflow.
  - `.github/workflows/supabase-migrations.yml:3-8` auto-applies migrations on push to `main`/`develop`.
- What is happening: Documented control contradicts code.
- Why it matters: Reviewers/auditors trust the doc; schema changes can reach environments without the documented gate.
- Recommendation: Reconcile doc and workflow (either remove migrations from deploy or update policy explicitly).
- deterministic_ref: null. Confidence: high.

### chat-CONF-002 — P3 — Admin `/stats` returns global cross-tenant counts

- Evidence: `apps/api/src/modules/admin/routes.ts:59-69` counts `users` and `messages` globally (only `workspaces`/`channels` are scoped to `workspaceIds`).
- What is happening: A workspace admin sees platform-wide user/message totals.
- Why it matters: Minor cross-tenant information disclosure.
- Recommendation: Scope all four counts to `workspaceIds`.
- deterministic_ref: null. Confidence: high.

### chat-CI-006 — P3 — Many workflows omit `permissions:` (default token scope)

- Evidence: No `permissions:` in `supabase-migrations.yml`, `audit-ci.yml`, `audit-release-certification.yml`, `hardening-automation-runner.yml`, `governance.yml`, `platform.yml`, `load-test.yml`, `infra-development.yml`, `environment-promotion-audit.yml`, `feature-rollout-checkpoint.yml`, `executive-stakeholder-pack.yml`.
- What is happening: These rely on the repository default `GITHUB_TOKEN` permissions (often read/write for older repos).
- Why it matters: Broader token than needed increases impact of any script-injection/compromise.
- Recommendation: Set a repo default of read-only and add explicit least-privilege `permissions:` per workflow.
- deterministic_ref: null. Confidence: medium.

### chat-SUPPLY-004 — P3 — SBOMs generated but not signed/attested; no license/dependency-review gate

- Evidence: `build-push.yml:99-133` and `deploy-production.yml:205-234` generate SPDX SBOMs via `anchore/sbom-action` and upload artifacts; no `actions/attest-build-provenance`, `cosign`, `dependency-review-action`, or license allowlist appears in any workflow (grep found none).
- What is happening: SBOMs exist and are retained, but provenance/signing and an enforced license policy are absent.
- Why it matters: Cannot verify artifact provenance or block disallowed licenses; SBOMs can be mutated post-generation.
- Recommendation: Add build provenance attestation, sign images/SBOMs, and a `dependency-review-action`/license allowlist gate.
- deterministic_ref: null. Confidence: high.

### chat-SUPPLY-005 — P3 — Containers lack runtime hardening beyond non-root

- Evidence: `infra/docker/docker-compose.prod.yml` services define no `read_only`, `cap_drop`, `security_opt: [no-new-privileges:true]`, or `tmpfs`; `livekit` publishes `7882-7892/udp` and `7880` (`:88-91`).
- What is happening: Images run non-root (good: `Dockerfile USER`), but no runtime restrictions are declared.
- Why it matters: A container escape/post-compromise has an easier path; larger attack surface.
- Recommendation: Add `read_only: true`, `cap_drop: [ALL]`, `security_opt: ["no-new-privileges:true"]` where compatible (with tmpfs for writable paths).
- deterministic_ref: null. Confidence: medium.

---

## Top findings

| ID | Sev | One line |
|---|---|---|
| chat-SEC-001 | P1 | Seed workflow can `USING (true)` the user RLS in production and seed shared-password accounts |
| chat-CI-001 | P1 | Production `provision` runs `terraform apply -auto-approve` + deletes infra with no environment approval |
| chat-AUTH-001 | P2 | Admin dead-letter retry is a cross-tenant IDOR |
| chat-SEC-002 | P2 | Auth service searches/fetches users globally via service role |
| chat-CI-002 | P2 | `infra-development` destroys infra on push to `develop`, no permissions/env, host-key checking off |

No P0 findings were identified in the reviewed scope.

## Open questions / evidence gaps

- GitHub server-side branch protection/ruleset configuration, environment required-reviewers, and secret values are not visible from the working tree → `Unknown`; verify in repo settings.
- trivy/audit fixed-version availability could not be independently reproduced offline (`Unknown`).
- Whether `develop` pushes actually deploy without approval depends on server-side environment config.
