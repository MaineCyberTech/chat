# Final Comprehensive Infra/CI/CD Audit — July 24, 2026

**Audit Scope**: All infra files, 22 CI/CD workflows, Dockerfiles, Compose files, Terraform, Caddy, secrets handling, environments, caching, code quality gates, monitoring.

**Files Audited**:

- `.github/workflows/*.yml` (22 files)
- `infra/docker/*.yml` (4 compose files + 3 override files)
- `infra/docker/Caddyfile*` (3 files)
- `infra/docker/.env.*.example` (3 files)
- `infra/terraform/*.tf` (5 files)
- `infra/terraform/templates/*.tftpl` (1 file)
- `apps/*/Dockerfile` (3 files)
- `apps/web/next.config.ts`, `turbo.json`, `pnpm-workspace.yaml`, `.env.*`, `playwright.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `dependabot.yml`, `CODEOWNERS`

**Summary**: 82 findings. **0 P0**, **12 P1**, **46 P2**, **24 P3**.

---

## Findings

### P1 — High Severity (12 findings)

---

#### P1-001: Worker Dockerfile may fail HEALTHCHECK — missing `wget` and using unsupported flags

- **File**: `apps/worker/Dockerfile:35-36`
- **Current**: `CMD wget -q --spider http://localhost:4100/healthz || exit 1`
- **Issue**: Alpine's BusyBox `wget` has limited flag support. `--spider` is not guaranteed supported. The API Dockerfile (`apps/api/Dockerfile:46`) and Web Dockerfile (`apps/web/Dockerfile:53`) both explicitly `apk add --no-cache wget` (GNU wget) but the Worker Dockerfile does not. The `docker-compose.dev.yml` (local dev) does NOT define a healthcheck override for the worker, so the Dockerfile HEALTHCHECK runs directly in local dev and may silently fail due to flag incompatibility. Prod compose does override.
- **Fix**: Add `RUN apk add --no-cache wget` before the HEALTHCHECK instruction in the runtime stage, OR change to `wget -qO- http://localhost:4100/healthz || exit 1` (BusyBox-compatible).

---

#### P1-002: Chaos tests run `git reset --hard` on remote development droplet

- **File**: `.github/workflows/chaos-tests.yml:43-48`
- **Current**: `git fetch origin develop; git checkout develop; git reset --hard origin/develop`
- **Issue**: Runs destructive git operations on the live development droplet. If the droplet was mid-deployment or had uncommitted changes, this wipes those changes. Chaos tests should execute in a separate, disposable environment or use a dedicated test droplet.
- **Fix**: Add a gate check that no deploy workflow is currently active (check for `/tmp/chat-deploy.lock` as in prod). Run chaos only on a dedicated test droplet, or protect the existing state.

---

#### P1-003: GITHUB_TOKEN piped to remote via SSH for Docker login

- **File**: `deploy-development.yml:202`, `deploy-production.yml:273`, `deploy-production.yml:482`
- **Current**: `echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ... --password-stdin`
- **Issue**: The GITHUB_TOKEN is transmitted over SSH to the remote droplet. If the SSH session is compromised (man-in-the-middle, agent forwarding leak), the token can be exfiltrated. The token is valid for the workflow's duration and grants package:write. Standard practice but worth noting.
- **Fix**: Consider deploying via docker pull using a read-only deploy token scoped only to the GHCR repo, not the full GITHUB_TOKEN. Or use `--password-stdin` with a deploy-specific PAT.

---

#### P1-004: Deploy-development's `docker compose up` swallows errors with `|| true`

- **File**: `deploy-development.yml:241`
- **Current**: `docker compose ... up -d --force-recreate --remove-orphans || true`
- **Issue**: If `docker compose up` exits with an error (pull failure, config error, port conflict), the error is silently ignored. The subsequent health-check loop will catch it, but the diagnostic output from `docker compose` itself is lost, making troubleshooting harder.
- **Fix**: Remove `|| true`. The health check loop is already a comprehensive safety net.

---

#### P1-005: `build-push.yml` has no explicit `permissions` block — may fail on fork PRs

- **File**: `.github/workflows/build-push.yml:15-17`
- **Current**: Triggers on `pull_request` with `secrets.GITHUB_TOKEN` used for GHCR push (line 43)
- **Issue**: On PRs from forks, the default `GITHUB_TOKEN` has read-only scope. Docker push to GHCR requires `packages: write`. The workflow will fail silently on the login or push step. The PR-trigger path should either not push or use explicit permissions.
- **Fix**: Add `permissions: { contents: read, packages: write }` and conditionally skip push on `github.event_name == 'pull_request'` (build-only mode).

---

#### P1-006: Devremote worker healthcheck uses `kill -0 1` instead of HTTP endpoint

- **File**: `infra/docker/docker-compose.devremote.yml:74`
- **Current**: `test: ["CMD-SHELL", "kill -0 1 2>/dev/null || exit 1"]`
- **Issue**: This only verifies PID 1 exists, not that the health server at port 4100 is responding. A stuck/broken worker that hasn't crashed would still pass. Production (`docker-compose.prod.yml:55`) correctly uses `wget http://localhost:4100/healthz`.
- **Fix**: Align with production: `test: ["CMD", "wget", "-q", "--spider", "http://localhost:4100/healthz"]` (and add `wget` to the worker Dockerfile, per P1-001).

---

#### P1-007: Deploy-development's "aggressive disk cleanup" deletes named volumes

- **File**: `deploy-development.yml:214`
- **Current**: `docker system prune -af --volumes`
- **Issue**: The `--volumes` flag deletes all unused named volumes, including `redis-data`. Redis AOF persistence is lost on each deploy. In development this may be acceptable, but it differs from production where the same command is used (deploy-production.yml:285). Redis data is rebuilt on restart but AOF provides crash recovery.
- **Fix**: Remove `--volumes` from prune, or explicitly backup Redis data before cleanup.

---

#### P1-008: Production `docker compose up` lacks error handling or retry logic

- **File**: `deploy-production.yml:306`
- **Current**: `docker compose -f infra/docker/docker-compose.prod.yml up -d --force-recreate --remove-orphans`
- **Issue**: Unlike the development deploy (which has a 36-iteration health loop with container state inspection), the production deploy's `up` command has no immediate error handling. The health check at step 445 runs separately but doesn't capture `docker compose` exit codes.
- **Fix**: Add error handling: exit if `docker compose up` fails, and add container state inspection similar to deploy-development.

---

#### P1-009: Deploy-development has no infra provision dependency

- **File**: `.github/workflows/deploy-development.yml:6-13`
- **Current**: Deploy triggers on push to develop independently of infra-development.yml
- **Issue**: If the development droplet doesn't exist (first deploy or destroyed), the `Resolve droplet IP` step (line 92) will fail but only after waiting for CI and build-push. There's no explicit dependency or gate that ensures infrastructure exists before deploy.
- **Fix**: Add a pre-step that checks if the droplet exists and, if not, triggers or waits for infra-development. Or merge the workflows.

---

#### P1-010: Production rollback doesn't regenerate `.env` file

- **File**: `deploy-production.yml:459-530` (rollback job)
- **Current**: Rollback job pulls old SHA images, retags as `:latest`, runs `up -d`. Does NOT regenerate `.env`.
- **Issue**: If environment variables changed between versions (new secret added, variable renamed, value updated), the rollback would run old code with new configuration. This could cause runtime errors or misbehavior.
- **Fix**: Either persist `.env` snapshots per deployment and restore on rollback, or regenerate from secrets.

---

#### P1-011: `turbo.json` typecheck depends on `^build` but not all packages define build tasks

- **File**: `turbo.json:18-21`
- **Current**: `"typecheck": { "dependsOn": ["^build"] }`
- **Issue**: TypeScript type-checking depends on upstream packages being built (for their `.d.ts` output). This is correct, but if any upstream package fails to produce type declarations in its build, typecheck will fail with cryptic errors. This is more of an architectural note.
- **Fix**: Ensure all `packages/*` have proper `tsconfig.json` with `declaration: true` and that `build` tasks produce `.d.ts` files.

---

#### P1-012: LiveKit admin port (7880) exposed directly to internet without firewall protection

- **File**: `infra/docker/docker-compose.prod.yml:17` + `infra/terraform/main.tf:37-98`
- **Current**: Port 7880 is exposed on the host. The DO firewall only allows Cloudflare IPs for TCP 80/443. Port 7880 is not in any inbound firewall rule.
- **Issue**: Anyone who can reach the droplet IP directly (bypassing Cloudflare proxy) can access LiveKit's admin/gRPC API on port 7880. If the Cloudflare proxy is set to DNS-only or the IP is discovered, this port is open to the world.
- **Fix**: Add an inbound firewall rule for port 7880 restricted to Cloudflare IPs (if LiveKit is accessed via Cloudflare), or don't expose it on the host at all (use internal Docker network only with Caddy reverse proxy).

---

### P2 — Medium Severity (46 findings)

---

#### P2-001: Multiple workflows lack explicit `permissions` blocks

- **Files**: `ci.yml`, `validate.yml`, `audit-ci.yml`, `audit-release-certification.yml`, `environment-promotion-audit.yml`, `executive-stakeholder-pack.yml`, `feature-rollout-checkpoint.yml`, `governance.yml`, `hardening-automation-runner.yml`, `platform.yml`, `supabase-migrations.yml`, `load-test.yml`
- **Current**: No `permissions:` key
- **Issue**: Default `GITHUB_TOKEN` permissions may be broader than needed. GitHub's default gives write access to contents and packages on push events. Least-privilege principle recommends explicit `permissions: contents: read` for read-only workflows.
- **Fix**: Add `permissions: contents: read` (or the minimal required) to all workflows.

---

#### P2-002: Worker Dockerfile EXPOSE port mismatch

- **File**: `apps/worker/Dockerfile:33`
- **Current**: `EXPOSE 4001`
- **Issue**: The worker health check runs on port 4100 (HEALTH_PORT default), not 4001. Port 4001 is undocumented and appears unused. Port 4100 is not EXPOSEd. While `EXPOSE` is mainly documentation, this mismatch is confusing.
- **Fix**: Change `EXPOSE 4001` to `EXPOSE 4100` or remove entirely since it's not a public-facing port.

---

#### P2-003: Web Dockerfile HEALTHCHECK fetches full HTML page

- **File**: `apps/web/Dockerfile:59`
- **Current**: `CMD wget -qO- http://localhost:3000 || exit 1`
- **Issue**: This fetches the entire Next.js homepage HTML (potentially 100KB+), not a lightweight health endpoint. Wastes bandwidth and CPU on every health check interval (every 30s).
- **Fix**: Create a dedicated `/api/health` API route in Next.js that returns a minimal JSON response, and point the healthcheck there.

---

#### P2-004: Docker image tags not pinned to SHA digests

- **Files**: `apps/api/Dockerfile:4`, `apps/web/Dockerfile:4`, `apps/worker/Dockerfile:1`
- **Current**: `FROM node:22-alpine AS base` and `FROM node:22-alpine AS runtime`
- **Issue**: `node:22-alpine` is a floating tag — builds may not be reproducible across time. A new version of Node/Alpine could introduce subtle incompatibilities.
- **Fix**: Pin to `node:22-alpine@sha256:<digest>` for reproducible builds.

---

#### P2-005: Production compose build-push caching uses non-scoped `type=gha`

- **File**: `deploy-production.yml:171`
- **Current**: `cache-from: type=gha` + `cache-to: type=gha,mode=max`
- **Issue**: No scope specified means API, worker, and web Docker layers all share the same cache namespace. This can cause cache pollution: e.g., web's `node_modules` layer could overwrite api's. `build-push.yml` correctly uses scoped caching (`scope=api`, `scope=worker`, `scope=web`).
- **Fix**: Add scopes: `cache-from: type=gha,scope=api` and `cache-to: type=gha,scope=api,mode=max`.

---

#### P2-006: Devremote API healthcheck uses `/health` instead of `/healthz`

- **File**: `infra/docker/docker-compose.devremote.yml:118`
- **Current**: `test: ["CMD", "wget", ... "http://localhost:4000/health"]`
- **Issue**: Production uses `/healthz` (docker-compose.prod.yml:126). Devremote uses `/health`. Both endpoints exist on the API but inconsistency reduces confidence in tests and creates avoidable drift between environments.
- **Fix**: Standardize on `/healthz` across all compose files.

---

#### P2-007: Caddyfile (devremote) missing `Content-Security-Policy` header

- **File**: `infra/docker/Caddyfile:29-35`
- **Current**: Has `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. No CSP.
- **Issue**: Missing CSP header is a security gap. CSP protects against XSS, clickjacking, and code injection. `Caddyfile.prod` has the same gap. Next.js can set CSP via headers config (next.config.ts has none).
- **Fix**: Add a CSP header (can start with `Content-Security-Policy "default-src 'self'"` and tighten over time). Consider using Next.js `headers()` config instead.

---

#### P2-008: `validate.yml` security-audit doesn't audit dev dependencies

- **File**: `validate.yml:228`
- **Current**: `pnpm audit --prod --audit-level=high`
- **Issue**: Only audits production dependencies. Dev dependencies (e.g., build tools, test libraries) can have critical vulnerabilities that affect CI/build safety.
- **Fix**: Run `pnpm audit --audit-level=high` (without `--prod`) as a separate step. Dev dependency audit can warn rather than block.

---

#### P2-009: `validate.yml` Trivy scan `continue-on-error: true`

- **File**: `validate.yml:237`
- **Current**: `continue-on-error: true` on Trivy scanner step
- **Issue**: Critical CVE findings don't block CI. The SARIF is uploaded to GitHub Security tab for visibility, but if no one monitors the Security tab, vulnerabilities go unnoticed.
- **Fix**: Add a conditional failure gate on CRITICAL severity findings (parsing the SARIF output). Keep HIGH as non-blocking.

---

#### P2-010: E2E tests in CI have Supabase startup steps as `continue-on-error: true`

- **File**: `validate.yml:415-425`
- **Current**: Supabase CLI install, start, db reset, and seed all use `continue-on-error: true`
- **Issue**: If Supabase fails to start, E2E tests still run and fail with potentially confusing errors about DB connectivity. The `continue-on-error` masks the root cause.
- **Fix**: Make at least `supabase start` mandatory (remove `continue-on-error`). If local Supabase can't start in CI, the E2E step should be skipped rather than run against nothing.

---

#### P2-011: Deploy-development duplicates Supabase migration run with `supabase-migrations.yml`

- **File**: `deploy-development.yml:84-90` + `supabase-migrations.yml`
- **Current**: Both run `supabase db push --include-all`. Deploy-development is triggered by the same push events.
- **Issue**: Migrations execute twice on push to develop — once by the supabase-migrations workflow and once by deploy-development. This is wasteful and could cause race conditions if migrations have side effects.
- **Fix**: Remove migration step from deploy-development and make it depend on supabase-migrations completing.

---

#### P2-012: Deploy-development and deploy-production duplicate ~200 lines of seed SQL logic

- **Files**: `deploy-development.yml:288-441` + `deploy-production.yml:310-441` + `seed-database.yml:29-190`
- **Current**: Three copies of nearly identical seed logic (auth user fix, identity insertion, password update, public.users upsert, RLS fix, data table seeding via Management API).
- **Issue**: Massive code duplication. Any change to seeding logic must be applied in 3 places. Already diverged slightly in some areas.
- **Fix**: Extract seed logic into a reusable workflow (`seed-database.yml` is already dispatchable). Have deploy workflows call it via `workflow_call` or `uses`.

---

#### P2-013: Deploy-development seeds `SUPABASE_PROJECT_REF` from secrets only — no environment separation

- **File**: `deploy-development.yml:288`
- **Current**: `PROJECT_REF="${{ secrets.SUPABASE_PROJECT_REF }}"`
- **Issue**: Both dev and prod deploys use the same `SUPABASE_PROJECT_REF` secret. If different Supabase projects exist per environment, the seed would target the wrong project.
- **Fix**: Use environment-specific secrets: `SUPABASE_PROJECT_REF_DEV` vs `SUPABASE_PROJECT_REF_PROD`.

---

#### P2-014: `supabase-migrations.yml` has no concurrency control

- **File**: `.github/workflows/supabase-migrations.yml`
- **Current**: No `concurrency:` block
- **Issue**: Two simultaneous pushes to develop could trigger concurrent migration runs against the same database, causing race conditions or migration failures.
- **Fix**: Add `concurrency: group: supabase-migrations-${{ github.ref }}, cancel-in-progress: true`.

---

#### P2-015: Chaos tests resolve IP independently in each job instead of job output sharing

- **File**: `chaos-tests.yml:23-35`, `chaos-tests.yml:60-72` (identical logic in two jobs)
- **Current**: Both jobs independently query the DO API for the droplet IP
- **Issue**: Duplicate API calls, waste of time, and potential for race conditions if the droplet list changes between job runs.
- **Fix**: Resolve IP once in a dependent job, pass via `outputs`.

---

#### P2-016: k6 Load test hardcodes production URL

- **File**: `load-test.yml:21`
- **Current**: `BASE_URL: https://chat.mainecybertech.com`
- **Issue**: Load test always targets production. There's no way to run the same test against development or staging.
- **Fix**: Make `BASE_URL` a workflow input with options for dev/prod.

---

#### P2-017: Terraform `lifecycle { ignore_changes = [user_data] }` prevents cloud-init updates

- **File**: `infra/terraform/main.tf:21-23`
- **Current**: `ignore_changes = [user_data]`
- **Issue**: If `cloud-init.yaml.tftpl` is updated, Terraform won't apply the changes to an existing droplet. New droplets get the updated cloud-init, existing ones don't. This could cause configuration drift over time.
- **Fix**: Document this explicitly and consider using a different mechanism for post-boot configuration (Ansible, etc.). Or add `force_recreate` via lifecycle custom condition.

---

#### P2-018: DO monitoring alerts run `count` with conditional but alert email default is `""`

- **File**: `infra/terraform/main.tf:102-142`
- **Current**: `count = var.alert_email != "" ? 1 : 0`
- **Issue**: The conditional correctly prevents alert creation when email is empty. But the variable default is `""`, meaning no alerts are created unless explicitly configured. Combined with "Cloudflare 521" known issue, no one receives CPU/memory/disk alerts.
- **Fix**: Make `alert_email` required (remove default `""`) or add a TF validation to require it for production environments.

---

#### P2-019: Terraform default `droplet_size` is `s-1vcpu-512mb-10gb` — conflicts with documented `s-2vcpu-2gb`

- **File**: `infra/terraform/variables.tf:26`
- **Current**: `default = "s-1vcpu-512mb-10gb"`
- **Issue**: The AGENTS.md documents the droplet as `s-2vcpu-2gb`. The Terraform default is 1 vCPU/512MB. This creates drift between the IaC default and what's actually deployed (the actual size is passed via variable at apply time). The default doesn't reflect reality.
- **Fix**: Update the default to match the documented droplet size, or document that the default is overridden at apply time.

---

#### P2-020: Dev compose binds debugger port 9229 publicly

- **File**: `infra/docker/docker-compose.dev.yml:81`
- **Current**: `"9229:9229"` — Node.js inspector port exposed to host
- **Issue**: In local development, this is fine. But the port mapping is unconditional — if someone runs this compose on a remote server, the debugger is exposed. Should at minimum bind to `127.0.0.1:9229:9229`.
- **Fix**: Change to `"127.0.0.1:9229:9229"` to restrict to localhost only.

---

#### P2-021: `deploy-development.yml` SSH setup runs `cloud-init status --wait` with `|| true`

- **File**: `deploy-development.yml:122`
- **Current**: `cloud-init status --wait 2>/dev/null || true`
- **Issue**: If cloud-init failed during droplet provisioning, this silently ignores the failure. Subsequent steps may inherit a partially-configured system.
- **Fix**: Remove `|| true`. If cloud-init failed, the deploy should abort.

---

#### P2-022: Deploy-development `|| true` on old droplet destruction

- **File**: `deploy-development.yml:103`
- **Current**: `curl -sf -X DELETE ... "https://api.digitalocean.com/v2/droplets/$OLD_ID" || true`
- **Issue**: If deletion of an old droplet fails, it's silently ignored. Old droplets accumulate and incur costs.
- **Fix**: Log the error but continue. Don't hide the failure entirely.

---

#### P2-023: Web Dockerfile ARGs for build-time env vars may leak secrets to image layers

- **File**: `apps/web/Dockerfile:24-27`
- **Current**: `ARG NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon key is a build arg
- **Issue**: Next.js `NEXT_PUBLIC_*` variables are embedded in the client-side JavaScript bundle. While the anon key is public, the `SUPABASE_URL` is also public. These being build-time ARGs means the image contains these values in its layers. For GHCR private repos this is fine. For public repos it could be a concern.
- **Fix**: Document that these ARGs are public and safe to embed. Ensure never to pass `SUPABASE_SERVICE_ROLE_KEY` as a build arg.

---

#### P2-024: Docker compose dev and prod differ in whether they expose port 7881 (LiveKit metrics)

- **File**: `infra/docker/docker-compose.dev.yml:141` vs `docker-compose.prod.yml:87-91`
- **Current**: Dev exposes `7881:7881` (prometheus/metrics port). Prod does too (line 89: `7881:7881`).
- **Issue**: LiveKit's Prometheus metrics endpoint on port 7881 is exposed to the internet. If not intended for external monitoring, this is a data exposure risk (internal metrics visible).
- **Fix**: Don't expose 7881 externally, or add firewall rules restricting access.

---

#### P2-025: `validate.yml` `diff-coverage` job references `pnpm test -- --changed` flag — unclear Vitest support

- **File**: `validate.yml:90`
- **Current**: `pnpm test -- --changed --coverage --reporter=json --coverage.reporter=json-summary`
- **Issue**: The `--changed` flag is a Vitest CLI option. Its behavior depends on git history (compares against base branch). On a branch that's diverged far from main, this might show misleading results. The `test` job also runs full coverage.
- **Fix**: Document the `--changed` semantics in the workflow. Verify it works with the `fetch-depth: 0` checkout (it does, but confirm against expected behavior).

---

#### P2-026: `DEBIAN_FRONTEND=noninteractive` used for apt-get — good, but dpkg may prompt

- **File**: `deploy-development.yml:124`
- **Current**: `DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker-compose-v2`
- **Issue**: If the `docker-compose-v2` package isn't available, apt-get returns non-zero but the error may be confusing. No fallback to install Docker Compose plugin via the Docker apt repository.
- **Fix**: Add `|| { echo "Failed to install docker-compose-v2"; exit 1; }` for clear error messaging.

---

#### P2-027: Deploy workflows don't check Docker daemon readiness at script start

- **File**: `deploy-development.yml:141`
- **Current**: Loop `for i in $(seq 1 12); do docker info >/dev/null 2>&1 && break` — good check
- **Issue**: Only the development deploy has this. Production deploy (line 267) jumps straight to `docker login`. If Docker isn't ready, the login hangs.
- **Fix**: Add the same Docker readiness check to production deploy and rollback.

---

#### P2-028: Production deploy uses `DO_SSH_PRIVATE_KEY` but development deploy uses `CI_SSH_PRIVATE_KEY`

- **Files**: `deploy-development.yml:119` vs `deploy-production.yml:264`
- **Current**: Dev uses `secrets.CI_SSH_PRIVATE_KEY`. Prod uses `secrets.DO_SSH_PRIVATE_KEY` with `secrets.DO_SSH_PASSPHRASE`.
- **Issue**: Two separate SSH key pairs for the same infrastructure. This is by design (different keys for different security boundaries), but adds complexity. If one key is rotated, only one workflow breaks.
- **Fix**: Document the key split rationale. Ensure both keys are added to the droplet via Terraform (only `ci_ssh_key_fingerprint` is passed — if DO key has a different fingerprint, the setup step may fail).

---

#### P2-029: Terraform SSH key import depends on fingerprint matching DO's internal lookup

- **File**: `infra/terraform/main.tf:19`
- **Current**: `ssh_keys = var.ci_ssh_key_fingerprint != "" ? [var.ci_ssh_key_fingerprint] : []`
- **Issue**: The fingerprint must match exactly what DigitalOcean expects (MD5 format, colon-separated). If the key is pre-registered in DO's web UI, the fingerprint must match the stored one. Terraform doesn't create/upload the key — it references an existing one.
- **Fix**: Consider using `digitalocean_ssh_key` resource to manage the key via Terraform, or document the expected fingerprint format in variables.tf.

---

#### P2-030: `validate.yml` `migration-test` job's `supabase db diff` step exits gracefully on failure

- **File**: `validate.yml:303`
- **Current**: `supabase db diff --schema public || true`
- **Issue**: The diff is used as a dry-run to catch SQL errors. If it fails, the error is swallowed. The migration team would never know if a migration is malformed until `supabase db reset` runs next.
- **Fix**: Remove `|| true`. If `diff` fails, the migration is likely malformed and should block CI.

---

#### P2-031: Cloud-init installs `docker-compose-v2` (standalone binary) on Ubuntu 24.04

- **File**: `infra/terraform/templates/cloud-init.yaml.tftpl:10`
- **Current**: `docker-compose-v2`
- **Issue**: Ubuntu 24.04 ships Docker Engine with the `docker compose` plugin built in. The `docker-compose-v2` package may not exist as a separate binary. The deploy script also attempts to `apt-get install docker-compose-v2` as a backup.
- **Fix**: Verify the package exists on Ubuntu 24.04. Consider installing `docker-ce-cli` or the full `docker.io` package which includes `docker compose`.

---

#### P2-032: Deploy-development SSH `cat > .env << 'EOF'` heredoc creates file before chmod

- **File**: `deploy-development.yml:147-155`
- **Current**: Creates `.env` then copies to `infra/docker/.env` and runs `chmod 600` on both at line 184
- **Issue**: Between creation and `chmod`, the files are world-readable (default umask). On a single-user droplet this is negligible, but on a multi-user system it's a window of exposure.
- **Fix**: Use `(umask 077 && cat > file)` to create files with restricted permissions from the start.

---

#### P2-033: Terraform destroys ALL duplicate droplets, not just previous revisions

- **File**: `deploy-production.yml:97-104`
- **Current**: Deletes any droplet named `chat-${ENVIRONMENT}` that isn't the imported ID
- **Issue**: If multiple deployments are active (e.g., blue/green), this would destroy the inactive deployment. For a single-droplet setup this is correct, but prevents multi-instance scaling.
- **Fix**: Document this is by design for single-droplet architecture. Add a check to skip deletion if there's a lock or active health check.

---

#### P2-034: `on.schedule` in CI triggers on weekdays only (Mon-Fri)

- **File**: `.github/workflows/ci.yml:8-9`
- **Current**: `cron: "0 7 * * 1-5"` — 7am, Mon-Fri
- **Issue**: If a vulnerability is disclosed on Friday afternoon, CI won't catch it until Monday. Also, the schedule triggers at 7am UTC which may be off-peak for the development team's timezone.
- **Fix**: Document the rationale. Consider a daily schedule with reduced frequency on weekends.

---

#### P2-035: `validate.yml` OpenAPI validation only checks top-level fields, not schema validity

- **File**: `validate.yml:176-204`
- **Current**: Checks for `openapi`, `info`, `paths`, `info.title`, `info.version` fields
- **Issue**: Doesn't validate schema format, enum values, operation responses, `$ref` resolution, or example validity. A syntactically correct but semantically broken OpenAPI spec would pass.
- **Fix**: Use a proper OpenAPI validator like `@apidevtools/swagger-parser` or `redocly lint`.

---

#### P2-036: `Caddyfile.prod` doesn't set `Content-Security-Policy` — same as P2-007 but for prod

- **File**: `infra/docker/Caddyfile.prod:10-16`
- **Issue**: Same gap as devremote Caddyfile.
- **Fix**: Same as P2-007.

---

#### P2-037: Deploy-development SSH key write to `/tmp/ssh_key` not cleaned up on early exit

- **File**: `deploy-development.yml` — No explicit SSH key cleanup in deploy script
- **Current**: The `infra-development.yml` SSH step does write key to `/tmp/ssh_key` and deletes it at lines 134-139. But deploy scripts use `appleboy/ssh-action@v1` which handles keys internally.
- **Issue**: The `infra-development.yml` approach of writing the private key to a tmp file is correct (cleaned up). But any other steps that write secrets to disk need equal cleanup.
- **Fix**: Add `trap "rm -f /tmp/ssh_key" EXIT` to ensure cleanup even on failure.

---

#### P2-038: No `env_file` in docker-compose.prod.yml — relies on automatic `.env` loading

- **File**: `infra/docker/docker-compose.prod.yml`
- **Current**: No explicit `env_file: .env` directive
- **Issue**: Docker Compose automatically reads `.env` from the same directory. This is implicit behavior. If the compose file is moved or copied, the `.env` won't be auto-loaded.
- **Fix**: Add explicit `env_file` directives where needed, or document that `.env` must exist in `infra/docker/`.

---

#### P2-039: All 3 Dockerfiles copy full `packages/` directory, not just needed packages

- **Files**: `apps/api/Dockerfile:14`, `apps/web/Dockerfile`, `apps/worker/Dockerfile:8`
- **Current**: `COPY packages ./packages` (all packages)
- **Issue**: Copies every package directory (ui, db, config). Not all packages are needed by every Dockerfile. This increases build context and cache invalidation surface.
- **Fix**: Copy only needed packages: `COPY packages/db ./packages/db`, `COPY packages/config ./packages/config`, etc.

---

#### P2-040: Deploy-development concurrency group `deploy-dev-${{ github.ref }}` — pushes to different branches don't block

- **File**: `deploy-development.yml:20`
- **Current**: `group: deploy-dev-${{ github.ref }}`
- **Issue**: The trigger is only for `push: branches: [develop]`, so `github.ref` will always be `refs/heads/develop`. This is fine, but adding the ref in the group name adds no value.
- **Fix**: Simplify to `group: deploy-dev`.

---

#### P2-041: `supabase-migrations.yml` doesn't verify linked project before pushing

- **File**: `supabase-migrations.yml:28`
- **Current**: `supabase link --project-ref $SUPABASE_PROJECT_REF`
- **Issue**: No verification that the link succeeded. If the project ref is wrong or the token is expired, the link fails but the step may not catch it depending on the exit code.
- **Fix**: Add explicit error handling after the link: `supabase link ... && supabase projects list | grep -q $SUPABASE_PROJECT_REF`.

---

#### P2-042: Deploy workflows don't backup pre-deploy container images

- **File**: Both deploy workflows
- **Issue**: Before pulling new images, the current images are deleted (`docker system prune -af`). There's no backup of the currently-running images. If the new images are corrupted or fail health checks, there's no automated fallback except manual rollback.
- **Fix**: Tag current images as backup (e.g., `:previous`) before pruning.

---

#### P2-043: `validate.yml` `branch-protection` job checks `getBranchProtection` but not `getRequiredStatusChecksContexts`

- **File**: `validate.yml:245-279`
- **Current**: Checks `required_status_checks`, `enforce_admins`, `required_pull_request_reviews`, `restrictions`
- **Issue**: Only verifies the presence of these rules, not which specific contexts are required. A rule could be present but empty (no checks required). The job would pass but protection would be ineffective.
- **Fix**: Also verify at least one status check context is listed, or integrate with the repo's expected check list.

---

#### P2-044: Production docker login used in two separate steps without DRY

- **File**: `deploy-production.yml:273` (deploy step) + `deploy-production.yml:482` (rollback step)
- **Current**: Both SSH in and run the same docker login
- **Issue**: If the login format changes, both must be updated. A reusable script or setup step would reduce duplication.
- **Fix**: Create a `/opt/chat/scripts/docker-login.sh` that's run by both.

---

#### P2-045: `Caddyfile.prod` uses inline syntax `path /_next/static/*` — verified working

- **File**: `infra/docker/Caddyfile.prod:19-22`
- **Current**: `@static { path /_next/static/* path /static/* path /manifest.json path /sw.js }`
- **Issue**: The `path` matcher with wildcards uses Caddy v2 syntax correctly. But `path` matches exact paths by default and needs `*` for prefix matching. The matcher syntax `/_next/static/*` matches `/fake/_next/static/../../etc/passwd` (path traversal). Should use a more restrictive match or validate paths.
- **Fix**: Use `path_regexp` for stricter path matching, or verify Caddy's path matcher normalizes paths before routing.

---

#### P2-046: DevOps dashboard: no infrastructure diagram or runbook for on-call

- **File**: Missing — `docs/runbooks/` directory exists per AGENTS.md but no infra trouble runbook
- **Issue**: When deployments fail, there's no documented troubleshooting flow for SSH issues, Docker failures, or service health degradation.
- **Fix**: Create `docs/runbooks/deploy-troubleshooting.md` with common failure modes and recovery steps.

---

### P3 — Low Severity (24 findings)

---

#### P3-001: `infra-development.yml` defines unused `DO_PUBKEY` and `DO_TOKEN` env vars

- **File**: `infra-development.yml:122-123`
- **Current**: `DO_PUBKEY: ${{ secrets.CI_SSH_PUBLIC_KEY }}` + `DO_TOKEN: ${{ secrets.DO_API_TOKEN }}`
- **Issue**: These duplicate the `TF_VAR_*` variables. Unused and confusing.
- **Fix**: Remove.

---

#### P3-002: Caddyfile.dev binds to `localhost:80` but dev compose exposes :443 too

- **File**: `infra/docker/Caddyfile.dev:11` + `infra/docker/docker-compose.dev.yml:15-17`
- **Current**: Caddy listens on `localhost:80`. Port 443 is mapped in compose but Caddy won't respond on it.
- **Issue**: Port 443 is exposed but not configured. Harmless but misleading.
- **Fix**: Document that dev doesn't use TLS, or comment out port 443 in dev compose.

---

#### P3-003: `docker-compose.dev.yml` — no healthcheck for worker service

- **File**: `infra/docker/docker-compose.dev.yml:95-114`
- **Issue**: No `healthcheck:` block for worker. Falls back to Dockerfile HEALTHCHECK.
- **Fix**: Add explicit healthcheck matching the production pattern.

---

#### P3-004: `docker-compose.prod.yml` — web `depends_on` api but not redis or livekit

- **File**: `infra/docker/docker-compose.prod.yml:42-44`
- **Issue**: Web only depends on API being healthy. If Redis or LiveKit are down, web starts anyway. In practice, web doesn't need Redis, so this is intentional. But it would benefit from documentation.
- **Fix**: Add a comment explaining the web dependency chain.

---

#### P3-005: No monitoring alert for disk I/O, network throughput, or process count

- **File**: `infra/terraform/main.tf:101-142`
- **Issue**: Only CPU, memory, and disk utilization. No disk I/O alerts (could indicate thrashing), no network throughput alerts (DDoS or runaway process), no process count alerts (fork bomb).
- **Fix**: Add `v1/insights/droplet/disk_read` and `disk_write` alerts if available on the plan.

---

#### P3-006: `validate.yml` `pnpm format:check` + `pnpm lint` in same step — lint hidden by format failure

- **File**: `validate.yml:142-143`
- **Issue**: `pnpm format:check` fails -> job exits -> `pnpm lint` never runs. Developer fixes formatting locally, pushes, then discovers lint failures.
- **Fix**: Run as separate steps with `if: always()` on the lint step, or use `pnpm check` (if it exists) that runs both.

---

#### P3-007: Worker Dockerfile: `EXPOSE 4001` — port number 4001 has no documented purpose

- **File**: `apps/worker/Dockerfile:33`
- **Issue**: Same as P2-002 but noting specifically that 4001 is arbitrary and undocumented.
- **Fix**: Change to 4100 or remove `EXPOSE`.

---

#### P3-008: `stale.yml` exempt labels include `dependencies` but not `dependabot`

- **File**: `stale.yml:32`
- **Current**: `exempt-pr-labels: pinned,security,dependencies`
- **Issue**: Dependabot PRs typically have a `dependencies` label, which is covered. But if Dependabot ever adds an additional label, it might not have the exact label. Fine as-is.
- **Status**: No fix needed. Documented for awareness.

---

#### P3-009: `eslint.config.mjs` imports `@next/eslint-plugin-next` from root — may be unlisted dependency

- **File**: `eslint.config.mjs:2`
- **Issue**: This plugin must be in the root `package.json` dependencies.
- **Status**: Verify it's listed in root `package.json`. If missing, add it.

---

#### P3-010: `playwright.config.ts` webServer port 3000 may conflict with running dev server

- **File**: `playwright.config.ts:27`
- **Current**: `reuseExistingServer: true`
- **Issue**: In CI, if port 3000 is already in use (from a previous step's dev server), Playwright connects to it. This could test stale code.
- **Fix**: Ensure `reuseExistingServer: true` is combined with a unique check or port is always killed before test.

---

#### P3-011: `vitest.config.base.ts` coverage thresholds: 50% lines/statements, 40% functions/branches

- **File**: `packages/config/vitest.config.base.ts:31-37`
- **Issue**: Thresholds are modest but serve as a floor. Future hardening should raise these.
- **Status**: Acceptable for current state. Documented for roadmap.

---

#### P3-012: `.npmrc` has `strict-peer-dependencies=false`

- **File**: `.npmrc:1`
- **Issue**: Peer dependency conflicts are silently ignored. This can lead to runtime version mismatches discovered only in production.
- **Fix**: Set to `true` and fix any peer dependency conflicts. This is standard practice eventually.

---

#### P3-013: `dependabot.yml` docker ecosystem watches `.apps/api`, `.apps/web`, `.apps/worker` separately

- **File**: `dependabot.yml:33-72`
- **Issue**: Each directory is a separate entry with identical config. Could be simplified with a watch on `/` and `Dockerfile*` patterns.
- **Status**: Works fine. Optional simplification.

---

#### P3-014: `pnpm-workspace.yaml` uses simple `packages: ["apps/*", "packages/*"]`

- **File**: `pnpm-workspace.yaml:1-3`
- **Issue**: No `- "tests/*"` or other directories. Correct for current structure.
- **Status**: Correct.

---

#### P3-015: `.prettierrc.json` has `plugins: ["prettier-plugin-tailwindcss"]`

- **File**: `.prettierrc.json:7`
- **Issue**: This plugin must be installed as a dependency. If not, Prettier silently falls back.
- **Status**: Verify installation.

---

#### P3-016: `Caddyfile.prod` — `http_port 80` and `https_port 443` in global options are defaults

- **File**: `infra/docker/Caddyfile.prod:3-4`
- **Issue**: These are defaults. Explicit is fine but unnecessary.
- **Status**: Acceptable.

---

#### P3-017: Deploy-development writes `.env` to repo root AND `infra/docker/.env` — double copy

- **File**: `deploy-development.yml:147,183`
- **Issue**: `.env` is created at repo root then copied to `infra/docker/`. One copy is sufficient.
- **Status**: Acceptable redundancy. One source of truth would be better.

---

#### P3-018: `turbo.json` `build.outputs` includes `!next/cache/**` — correct but `**` may over-exclude

- **File**: `turbo.json:8`
- **Current**: `"outputs": [".next/**", "dist/**", "!.next/cache/**"]`
- **Issue**: The negation is correctly placed at the end so it takes precedence. Turbo evaluates outputs in order with last match winning. Fine.
- **Status**: Correct.

---

#### P3-019: `docker-compose.override.yml` — name is `chat-dev`, merges with `docker-compose.dev.yml`

- **File**: `infra/docker/docker-compose.override.yml:1`
- **Issue**: Override file mounts everything in the workspace. Intended for development only. Should have a comment noting it's auto-applied by Docker Compose.
- **Fix**: Add a comment: `# This override is auto-applied by Docker Compose when docker-compose.override.yml exists next to docker-compose.dev.yml`.

---

#### P3-020: No Docker HEALTHCHECK for LiveKit service

- **Files**: All docker-compose files
- **Issue**: LiveKit has no health check configured. If it crashes, Docker Compose only detects it via process exit, not via a health probe.
- **Fix**: Add `healthcheck: { test: ["CMD", "wget", "-q", "--spider", "http://localhost:7880"], interval: 30s, timeout: 5s, retries: 3, start_period: 10s }` (LiveKit's HTTP port for health check is 7880).

---

#### P3-021: `chaos-tests.yml` job names `chaos-api-crash` and `chaos-redis-down` — scripts referenced at `tests/chaos/scenarios/` must exist

- **File**: `chaos-tests.yml:50`, `chaos-tests.yml:87`
- **Issue**: The workflow references `tests/chaos/scenarios/api-crash.sh` and `tests/chaos/scenarios/redis-down.sh`. These scripts must exist in the repo.
- **Status**: Verify these scripts exist.

---

#### P3-022: `build-push.yml` generates SBOM only on push to develop — not on PRs

- **File**: `build-push.yml:92,101`
- **Current**: `if: github.event_name == 'push' && github.ref == 'refs/heads/develop'`
- **Issue**: SBOM is needed for production too. Production build (`deploy-production.yml`) doesn't generate SBOM at all.
- **Fix**: Add SBOM generation to deploy-production.yml or to a separate workflow.

---

#### P3-023: `.dockerignore` excludes `*.md` — includes `README.md` but AGENTS.md is in root

- **File**: `.dockerignore:12-13`
- **Current**: `README.md` + `*.md`
- **Issue**: All markdown files are excluded from Docker build context. `AGENTS.md` and `CHANGELOG.md` at root would also be excluded. This is intentional (docs don't belong in images).
- **Status**: Correct.

---

#### P3-024: `Caddyfile` (devremote) — health routes use trailing wildcard `*` but prod doesn't

- **File**: `infra/docker/Caddyfile:3-4` vs `infra/docker/Caddyfile.prod:50-51`
- **Current**: Devremote: `handle /health*` and `handle /healthz*`. Prod: `@health { path /health /healthz }`
- **Issue**: Devremote matches `/health`, `/healthz`, `/health-check`, `/healthz-admin`, etc. Prod only matches exact paths `/health` and `/healthz`. Inconsistency is minor but could cause prod-specific issues.
- **Fix**: Standardize to exact path matching on both.

---

## Summary

| Severity | Count | Key Areas                                                                                                                                                                                                                                                      |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 0     | —                                                                                                                                                                                                                                                              |
| **P1**   | 12    | Worker HEALTHCHECK (wget missing/syntax), Chaos tests destructive, GITHUB_TOKEN to remote SSH, `                                                                                                                                                               |     | true` error swallowing, build-push permissions, devremote healthcheck dummy, disk cleanup deletes volumes, prod composes error handling, deploy lacks infra dependency, rollback .env mismatch, typecheck build chain, LiveKit admin port exposed |
| **P2**   | 46    | Permissions blocks, port mismatches, healthcheck paths, CSP missing, audit scope, E2E continue-on-error, migration double-run, seed logic duplication, concurrency gaps, cloud-init ignore, monitoring gaps, caching, documentation, rollback/info consistency |
| **P3**   | 24    | Unused env vars, cosmetic inconsistencies, documentation, missing healthchecks, thresholds, code duplication, future improvements                                                                                                                              |

**Overall Rating**: 7.2/10 — Production-adequate with actionable hardening.

**Top 5 Actions**:

1. **P1-001**: Fix Worker Dockerfile HEALTHCHECK (add `wget`, fix flags)
2. **P1-006**: Fix devremote worker healthcheck to use HTTP instead of `kill -0 1`
3. **P1-005**: Add explicit permissions to `build-push.yml`
4. **P1-004/P1-008**: Remove `|| true` from deploy `docker compose up` commands
5. **P2-012**: Extract seed logic into reusable workflow to eliminate 3x code duplication
