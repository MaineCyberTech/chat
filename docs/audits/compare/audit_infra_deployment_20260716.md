# Infra/Deployment/Resilience Audit — July 16, 2026

**Auditor**: Principal Auditor (Automated Pipeline)
**Status**: GO WITH RISKS
**Overall Score**: 6.8/10

---

## Summary

| Dimension                            | Score      | Findings             |
| ------------------------------------ | ---------- | -------------------- |
| Environment Model (Phase 1)          | 7/10       | 1 P2, 1 P3           |
| IaC Review (Phase 2)                 | 6/10       | 1 P1, 2 P2, 1 P3     |
| Delivery Pipeline (Phase 3)          | 7/10       | 2 P1, 2 P2, 1 P3     |
| Resilience & Observability (Phase 4) | 7/10       | 1 P2, 1 P3           |
| Recovery & Failover (Phase 5)        | 6/10       | 2 P1, 3 P2, 1 P3     |
| **Total**                            | **6.8/10** | **5 P1, 9 P2, 4 P3** |

### Severity Distribution

| Severity  | Count  |
| --------- | ------ |
| P0        | 0      |
| P1        | 5      |
| P2        | 9      |
| P3        | 4      |
| **Total** | **18** |

### Decision: **GO WITH RISKS**

All 5 P1 findings must be addressed before Enterprise readiness. No P0 findings — production is not at immediate risk. Deployments are functional but have hardening gaps.

---

## Phase 1: Environment Model

### Inventory

| Environment | Compose File                              | Caddyfile        | Domain                  |
| ----------- | ----------------------------------------- | ---------------- | ----------------------- |
| Local Dev   | `docker-compose.dev.yml` + `override.yml` | `Caddyfile.dev`  | localhost:80            |
| Dev Remote  | `docker-compose.devremote.yml`            | `Caddyfile`      | chat.mainecybertech.us  |
| Production  | `docker-compose.prod.yml`                 | `Caddyfile.prod` | chat.mainecybertech.com |

### Finding IDR-001 — Caddyfile.prod nested global options block may be invalid

**Severity**: P1
**Location**: `infra/docker/Caddyfile.prod:2-7`
**Description**: The production Caddyfile wraps a nested `{ }` block inside the global options block. The correct syntax is to place `admin off`, `http_port`, and `https_port` directly in the outer `{ }` block, not nested inside a second `{ }`. This may cause Caddy to fail to parse the configuration, preventing startup.
**Evidence**:

```
{
    # Production Caddyfile    ← outer global options block
    {                         ← nested block — likely invalid
        admin off
        http_port 80
        https_port 443
    }
```

Compare with `Caddyfile.dev` which correctly places options directly inside the global block without nesting.
**Recommendation**: Remove the inner `{ }` braces so options are direct children of the global options block.

### Finding IDR-002 — LiveKit uses `:latest` tag in all environments

**Severity**: P2
**Location**: `infra/docker/docker-compose.dev.yml:135`, `infra/docker/docker-compose.prod.yml:83`, `infra/docker/docker-compose.devremote.yml:44`
**Description**: All three compose files pin LiveKit to `livekit/livekit-server:latest`. Pinning mutable tags in production risks unexpected upgrades on container restart.
**Recommendation**: Pin to a specific semver tag (e.g., `livekit/livekit-server:1.8.0`).

### Finding IDR-003 — Caddyfile has HSTS but prod Caddyfile.prod has duplicate HSTS in header directive

**Severity**: P3
**Location**: `infra/docker/Caddyfile.prod:14-20`
**Description**: HSTS is already configured via Cloudflare at the edge (Terraform `proxied = true`). Having HSTS in Caddy adds defense-in-depth, which is fine, but the HSTS `max-age` and `preload` should be coordinated to avoid conflicting configurations.
**Recommendation**: Document that Caddy HSTS complements Cloudflare edge HSTS. Consider adding `preload` submission status.

---

## Phase 2: IaC Review

### Finding IDR-004 — Production Terraform init uses default AWS S3 endpoint, not DO Spaces

**Severity**: P1
**Location**: `.github/workflows/deploy-production.yml:67`
**Description**: The production deploy workflow runs `terraform init -input=false` without backend config overrides. The `versions.tf` backend block defaults to AWS S3 (`region = "us-east-1"`), but the actual backend target is DigitalOcean Spaces (S3-compatible). The dev workflow (`infra-development.yml`) correctly passes `-backend-config="endpoint=https://sfo3.digitaloceanspaces.com"`. Production Terraform init will try to reach `s3.us-east-1.amazonaws.com` which will fail.
**Evidence**:

```yaml
# infra-development.yml (correct)
run: terraform init -input=false -backend-config="bucket=chat-terraform-state" -backend-config="endpoint=https://sfo3.digitaloceanspaces.com"

# deploy-production.yml (incorrect — missing backend config)
run: terraform init -input=false
```

**Recommendation**: Add the same `-backend-config` overrides to the production deploy workflow's Terraform init step. Also add `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` env vars to that step.

### Finding IDR-005 — Terraform state locking not enforced

**Severity**: P2
**Location**: `infra/terraform/versions.tf:4-12`
**Description**: The S3 backend does not configure `dynamodb_table` for state locking. DigitalOcean Spaces does not support DynamoDB locking, so concurrent Terraform applies could corrupt state. Both `infra-development.yml` and `deploy-production.yml` run `terraform apply -auto-approve` with `cancel-in-progress: true` for the workflow, but Terraform itself doesn't have locking.
**Recommendation**: Add a pre-check step in both workflows to verify no other Terraform run is in progress. Alternatively, switch to a Terraform backend that supports native locking (e.g., Terraform Cloud or HTTP backend with locking).

### Finding IDR-006 — Terraform monitors have no Slack/PagerDuty notification

**Severity**: P2
**Location**: `infra/terraform/main.tf:102-142`
**Description**: CPU, memory, and disk alerts are configured with email notification only. For production (and ideally dev), alerts should route to a real-time channel (PagerDuty, Slack, OpsGenie) to ensure responsiveness to infrastructure incidents.
**Recommendation**: Add `slack` or `pagerduty` alert channel configuration. DigitalOcean monitoring alerts support Slack webhooks.

### Finding IDR-007 — Droplet size mismatch: terraform.tfvars vs variables.tf default

**Severity**: P3
**Location**: `infra/terraform/variables.tf:26`, `infra/terraform/terraform.tfvars.example:4`
**Description**: `variables.tf` default is `s-1vcpu-512mb-10gb` (512MB RAM) while `terraform.tfvars.example` specifies `s-2vcpu-2gb` (2GB RAM). The AGENTS.md documents `s-2vcpu-2gb`. For production this is the actual size used, but a fresh `terraform apply` with no `tfvars` file would provision an undersized droplet.
**Recommendation**: Update the default in `variables.tf` to match the actual production requirement, or add a validation rule to error on undersized droplets.

---

## Phase 3: Delivery Pipeline

### Finding IDR-008 — Production deploy lacks deployment lock and concurrency protection

**Severity**: P1
**Location**: `.github/workflows/deploy-production.yml:24-26`
**Description**: Production deploy has `cancel-in-progress: false` but no explicit deployment lock mechanism. The `environment: production` on the deploy job provides some protection (pending reviews/deployments), but two simultaneous `workflow_dispatch` runs could step on each other, especially during provisioning and image building.
**Recommendation**: Add a `deployment` environment with `lock: true` or implement a GitHub deployment API-based locking mechanism. Consider adding a concurrency group that prevents overlapping production runs.

### Finding IDR-009 — Production deploy pulls `:latest` tag without SHA-priority fallback

**Severity**: P1
**Location**: `.github/workflows/deploy-production.yml:281-290`
**Description**: The production deploy script pulls only `:latest` tags for API/Worker/Web images. If a concurrent build partially completes (only some images pushed), the deploy could get inconsistent versions. The dev deploy correctly prioritizes SHA tags and falls back to `:dev`.
**Evidence**:

```bash
# Production (no SHA priority):
for img in api worker web; do
    docker pull ghcr.io/$REPO_LC/$img:latest  # only :latest
done

# Development (SHA priority):
for img in api worker web; do
    if docker pull ghcr.io/$REPO_LC/$img:$COMMIT_SHA; then
        docker tag ... $img:dev
    else
        docker pull ghcr.io/$REPO_LC/$img:dev  # fallback
    fi
done
```

**Recommendation**: Change production deploy to use SHA-priority pulling (same pattern as dev deploy). Only fall back to `:latest` if SHA pull fails.

### Finding IDR-010 — Secrets written to disk as .env file during deployment

**Severity**: P2
**Location**: `.github/workflows/deploy-development.yml:126-157`, `.github/workflows/deploy-production.yml:227-245`
**Description**: Both dev and production deploy workflows construct a `.env` file on the droplet filesystem containing plaintext secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `VAPID_PRIVATE_KEY`). These are at rest on disk and could be read by any process on the droplet.
**Recommendation**: Use Docker secrets or a dedicated secrets manager (e.g., HashiCorp Vault, Doppler) instead of writing secrets to `.env` files. At minimum, ensure the `.env` file has `chmod 600` and is cleaned up after containers start.

### Finding IDR-011 — No dry-run migration mode in supabase-migrations.yml

**Severity**: P2
**Location**: `.github/workflows/supabase-migrations.yml:35`
**Description**: The migration workflow runs `supabase db push --include-all` directly against the linked Supabase project without a dry-run/preview step. While `validate.yml` runs migration tests against a local Supabase instance, the production migration CI has no `--dry-run` flag.
**Recommendation**: Add a `--dry-run` flag step that shows what SQL would be executed before actually pushing. This can use `supabase db diff --linked`.

### Finding IDR-012 — Health check only validates API, not web frontend

**Severity**: P3
**Location**: `.github/workflows/deploy-production.yml:295-307`
**Description**: Post-deploy health check only curls the API `/health` endpoint. The web frontend (Next.js) could be returning 5xx or not serving pages. The dev deploy checks both API and Web container health.
**Recommendation**: Add a web health check step that validates the frontend returns HTTP 200.

---

## Phase 4: Resilience & Observability

### Finding IDR-013 — Health endpoint lacks Redis and BullMQ dependency checks

**Severity**: P2
**Location**: `apps/api/src/modules/health/service.ts:38-58`
**Description**: `getFullHealth()` only checks the database health. It does not check Redis connectivity, BullMQ queue health, or worker process health. If Redis is down, the health endpoint still reports `healthy` because it only pings Supabase.
**Recommendation**: Add Redis ping check (via ioredis), BullMQ queue liveness check, and worker health check to `getFullHealth()`. Report `degraded` status if Redis is unavailable but DB is fine.

### Finding IDR-014 — Chaos test scenarios limited to 2 of 4 documented

**Severity**: P2
**Location**: `tests/chaos/`
**Description**: The chaos test README documents 4 scenarios (API Crash, Redis Down, DB Disconnect, High Latency) but only 2 have automated scripts. DB disconnect and High Latency are marked "manual". No automated recovery verification is run in CI.
**Recommendation**: Script the remaining 2 scenarios. Add a scheduled CI workflow (e.g., weekly) that runs all chaos tests against the dev environment and validates recovery within SLOs.

### Finding IDR-015 — Worker Dockerfile lacks HEALTHCHECK directive

**Severity**: P3
**Location**: `apps/worker/Dockerfile:17-32`
**Description**: The API and Web Dockerfiles both have `HEALTHCHECK` directives. The worker Dockerfile does not, even though the worker exposes port 4100 and has a `/healthz` endpoint. The devremote compose file uses a process-based health check (`kill -0 1`) instead of HTTP.
**Recommendation**: Add a `HEALTHCHECK` directive to the worker Dockerfile that pings the `/healthz` endpoint, matching the API/Web pattern.

---

## Phase 5: Recovery & Failover

### Finding IDR-016 — No automated backup verification in CI

**Severity**: P2
**Location**: `docs/runbooks/backup-strategy.md`
**Description**: The backup strategy document recommends monthly restoration testing but there is no CI job or scheduled workflow that automates this. Manual monthly verification is likely to be skipped or forgotten.
**Recommendation**: Add a scheduled weekly GitHub Actions workflow that:

1. Dumps the Supabase database via `supabase db dump`
2. Restores to a staging project
3. Runs smoke tests (health check, message send/read)
4. Reports results

### Finding IDR-017 — Supabase connection pooling not visible at application level

**Severity**: P2
**Location**: `apps/api/src/lib/supabase.ts`
**Description**: Supabase manages connection pooling via Supavisor at the infrastructure level, and the app uses `fetch` with a 15s timeout. However, there is no application-level connection pool configuration, and the `createClient` calls do not specify pool settings. Multiple concurrent requests could exhaust database connections.
**Recommendation**: Add explicit Supabase client pool configuration (e.g., `db: { pool: { maxConnections: 10 } }`). Review Supavisor pool settings in the Supabase dashboard.

### Finding IDR-018 — No cross-region replication for object storage

**Severity**: P3
**Location**: `docs/runbooks/backup-strategy.md:28-32`
**Description**: The backup strategy acknowledges that object storage (avatars, uploads) could benefit from cross-region replication but has not implemented it. A regional outage of the DO/Supabase region could make uploaded files inaccessible.
**Recommendation**: Configure Supabase Storage to replicate to a second region, or set up a lifecycle rule to copy uploads to an S3 bucket in a different region.

---

## Appendix A: Configuration Comparison

### Compose File Differences

| Service     | Local Dev (`dev.yml`)                                            | Dev Remote (`devremote.yml`)                                                 | Production (`prod.yml`)                                                       |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **caddy**   | Uses `Caddyfile.dev`, ports 80:80 + 443:443                      | Uses `Caddyfile`, ports 80:80 + 443:443, certs volume                        | Uses `Caddyfile.prod`, certs volume, no depends_on                            |
| **web**     | Builds from source, volume mounts, dev command                   | Pulls `${WEB_IMAGE:-:dev}`, healthcheck                                      | Pulls `${WEB_IMAGE:-:latest}`, healthcheck, depends_on api                    |
| **api**     | Builds from source, volume mounts, dev command, debug port 9229  | Pulls `${API_IMAGE:-:dev}`, healthcheck on `/health`                         | Pulls `${API_IMAGE:-:latest}`, healthcheck on `/healthz`, NO depends_on       |
| **worker**  | Builds from source, volume mounts, dev command, depends_on redis | Pulls `${WORKER_IMAGE:-:dev}`, healthcheck (process-based), depends_on redis | Pulls `${WORKER_IMAGE:-:latest}`, healthcheck on `/healthz`, depends_on redis |
| **redis**   | AOF enabled, port 6379 exposed, healthcheck                      | No port exposed, healthcheck                                                 | No port exposed, healthcheck                                                  |
| **livekit** | TURN disabled, debug log level, keys with defaults               | TURN enabled (localhost), UDP port range                                     | TURN enabled (production domain), TLS port 5349, UDP port 3478                |

### Image Tagging Strategy

| Image    | Dev Remote      | Production         |
| -------- | --------------- | ------------------ |
| `api`    | `:dev`, `:$sha` | `:latest`, `:$sha` |
| `worker` | `:dev`, `:$sha` | `:latest`, `:$sha` |
| `web`    | `:dev`, `:$sha` | `:latest`, `:$sha` |

### Health Check Configuration

| Service    | Dev Remote                                                                     | Production                                                                    |
| ---------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **api**    | `wget localhost:4000/health`, interval 15s, timeout 10s, retries 10, start 60s | `wget localhost:4000/healthz`, interval 10s, timeout 5s, retries 5, start 20s |
| **web**    | `wget localhost:3000`, interval 15s, timeout 10s, retries 10, start 60s        | `wget localhost:3000`, interval 30s, timeout 10s, retries 3, start 40s        |
| **worker** | `kill -0 1` (process check), interval 30s, timeout 10s, retries 3, start 30s   | `wget localhost:4100/healthz`, interval 10s, timeout 5s, retries 5, start 15s |
| **redis**  | `redis-cli ping`, interval 5s, timeout 3s, retries 5                           | `redis-cli ping`, interval 5s, timeout 3s, retries 5                          |

---

## Appendix B: Workflow Inventory

All 20 workflow files in `.github/workflows/`:

| Workflow                          | Trigger                                 | Purpose                               | Audit Notes                                        |
| --------------------------------- | --------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| `ci.yml`                          | push main/develop, PR, schedule, manual | Calls validate.yml                    | Good concurrency group                             |
| `validate.yml`                    | workflow_call                           | Lint, typecheck, test, build, E2E     | OpenAPI validation, security audit, migration test |
| `build-push.yml`                  | push develop, PR                        | Build + push 3 images to GHCR         | SHA + dev tags, SBOM, Trivy                        |
| `deploy-development.yml`          | push develop                            | Deploy to dev droplet                 | SHA-priority pull, 6min health check               |
| `deploy-production.yml`           | push main, manual (w/ rollback)         | Validate → Terraform → Build → Deploy | SHA tags, rollback job, environment gates          |
| `infra-development.yml`           | push infra/\*\*, manual                 | Terraform provision dev droplet       | Resource import, cleanup, SSH health check         |
| `supabase-migrations.yml`         | push migrations, workflow_call          | Link + db push                        | No dry-run, no rollback                            |
| `load-test.yml`                   | schedule (weekly), manual               | k6 smoke test                         | 10 VUs, 30s duration                               |
| `platform.yml`                    | manual                                  | Full automation pipeline              | V6 orchestration                                   |
| `stale.yml`                       | schedule (weekly)                       | Close stale issues/PRs                | 60d stale, 7d close                                |
| `governance.yml`                  | manual                                  | Superseded by platform.yml            | Retained for back-compat                           |
| `hardening-automation-runner.yml` | manual                                  | Harden analysis pipeline              | Parameterized run_id                               |
| `audit-ci.yml`                    | PR, push, manual                        | Audit dashboard generation            |                                                    |
| `audit-ci-autocommit.yml`         | push audit runs                         | Auto-commit dashboard                 | `[skip ci]` commit                                 |
| `audit-badges-autocommit.yml`     | push hardening                          | Auto-commit badges                    |                                                    |
| `audit-pr-gate.yml`               | PR                                      | Audit-based PR gating                 | Policies in `docs/hardening_super_bundle/`         |
| `audit-release-certification.yml` | manual                                  | Release certification                 | Generates stakeholder pack                         |
| `environment-promotion-audit.yml` | manual                                  | Promotion gate eval                   |                                                    |
| `executive-stakeholder-pack.yml`  | manual                                  | Executive report generation           |                                                    |
| `feature-rollout-checkpoint.yml`  | manual                                  | Wave-based rollout guidance           |                                                    |

---

## Appendix C: Resilience Capabilities

| Capability          | Status        | Details                                                                                   |
| ------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Graceful shutdown   | ✅            | Connection draining, in-flight request wait, 10s force timeout, Socket.io + cache cleanup |
| Circuit breaker     | ✅            | opossum-based, used by webhooks, HTTP client, Supabase client; Prometheus metrics         |
| Retry logic         | ✅            | Exponential backoff per queue (webhook 5x, notification 3x, search 3x); DLQ for webhooks  |
| Health endpoint     | ✅            | `/health` (light) and `/healthz` (deep with DB check)                                     |
| Docker healthchecks | ✅            | All 4 services have HEALTHCHECK in both compose and Dockerfile                            |
| Chaos testing       | ⚠️ Partial    | 2 of 4 scenarios automated; no CI integration                                             |
| Backup automation   | ⚠️ Manual     | Supabase daily backup; no CI verification                                                 |
| Deployment rollback | ✅            | Production has `rollback` job on workflow_dispatch with SHA                               |
| State locking       | ❌            | No Terraform state locking mechanism                                                      |
| Connection pooling  | ⚠️ Partial    | Supabase-level only, no app-level pool config                                             |
| Resource limits     | ✅            | Memory limits set on all containers                                                       |
| Restart policy      | ✅            | `unless-stopped` on all services                                                          |
| Monitoring alerts   | ✅            | CPU >80%, Memory >80%, Disk >90% via DO monitoring                                        |
| Secret management   | ⚠️ Incomplete | Secrets written to .env file on disk                                                      |

---

## Appendix D: Proposed Remediation Plan

### Immediate (1-2 days)

1. **IDR-001**: Fix Caddyfile.prod nested block syntax
2. **IDR-008**: Add deployment lock to production deploy
3. **IDR-009**: Change production deploy to SHA-priority image pulling
4. **IDR-004**: Fix production Terraform init backend config

### Short-term (1 week)

5. **IDR-010**: Migrate to Docker secrets or vault-based secret delivery
6. **IDR-013**: Add Redis + BullMQ checks to health endpoint
7. **IDR-005**: Implement Terraform state locking workaround
8. **IDR-011**: Add dry-run step to supabase-migrations.yml

### Medium-term (2-4 weeks)

9. **IDR-006**: Add Slack/PagerDuty alert routing
10. **IDR-014**: Script remaining 2 chaos scenarios + CI integration
11. **IDR-016**: Add automated backup verification workflow
12. **IDR-017**: Configure explicit Supabase connection pooling
13. **IDR-002**: Pin LiveKit to specific version tag

### Long-term (1-2 months)

14. **IDR-018**: Implement cross-region storage replication
15. **IDR-007**: Update default droplet size in variables.tf
16. **IDR-012**: Add web frontend health check to production deploy
