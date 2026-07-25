# Infra/Deployment/Resilience Re-Audit — July 24, 2026

**Auditor**: Principal Auditor (Re-Verification)
**Status**: GO WITH RISKS (worsened — 1 new P1, 5 new P2)
**Previous Score**: 6.8/10
**Revised Score**: 5.9/10

---

## Executive Summary

Re-audit of all findings from `audit_infra_deployment_20260716.md`. The user claimed 7 items were fixed. **5 of 7 verified fixed; 2 claim-to-fix mismatches found.** Additionally, **5 new findings** identified that were not in the original audit.

| Category  | Old    | New    | Delta              |
| --------- | ------ | ------ | ------------------ |
| P0        | 0      | 0      | —                  |
| P1        | 5      | 5      | 0 (1 fixed, 1 new) |
| P2        | 9      | 14     | +5 (new)           |
| P3        | 4      | 4      | 0                  |
| **Total** | **18** | **23** | **+5**             |

### Decision: **GO WITH RISKS**

The same 4 P1 findings remain open (IDR-004, plus 3 unfixed from the original audit). One new P1 (IDR-019) added. Still no P0 findings.

---

## Verification of Claimed Fixes

| Finding         | Claim                                    | Verified?    | Evidence                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IDR-001**     | Caddyfile.prod nested `{ }` block fixed  | ✅ FIXED     | `infra/docker/Caddyfile.prod:1-5` — global options are direct children, no nested braces                                                                                                                                                                                                                                                                  |
| **IDR-004**     | Terraform DO Spaces endpoint added       | ❌ NOT FIXED | `deploy-production.yml:67-68` still runs bare `terraform init -input=false`. No `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` env vars, no `-backend-config` overrides. Compare with `infra-development.yml:46-48` which correctly passes both. Though the `endpoint` is hardcoded in `versions.tf:7`, the production init step has no credential env vars. |
| **IDR-008**     | Deploy concurrency lock (flock) added    | ✅ FIXED     | `deploy-production.yml:265-266` — `exec 200>/tmp/chat-deploy.lock; flock -n 200`. Released at line 304 with `flock -u 200`                                                                                                                                                                                                                                |
| **IDR-009**     | SHA tags instead of `:latest`            | ✅ FIXED     | `deploy-production.yml:290-300` — SHA-priority pulling with 3 retry attempts, tags as `:latest` after successful pull                                                                                                                                                                                                                                     |
| **Worker user** | Non-root user added to Worker Dockerfile | ✅ FIXED     | `apps/worker/Dockerfile:30-31` — `addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser` + `USER appuser`                                                                                                                                                                                                                           |
| **Secrets**     | `set +x` masking in deploy scripts       | ✅ FIXED     | Both deploy scripts: `deploy-production.yml:227` has `set +x` before `.env` creation, `:252` has `set -x` after. Same pattern in `deploy-development.yml:114` / `:158`                                                                                                                                                                                    |
| **OPS-001**     | `alerting.md` created                    | ✅ FIXED     | `docs/runbooks/alerting.md` — 78 lines, covering 8 alert types, 3 monitoring systems (Prometheus, Sentry, DO), configuration instructions                                                                                                                                                                                                                 |

---

## Unresolved Findings (Carried Forward)

### Phase 1: Environment Model

#### IDR-002 — LiveKit uses `:latest` tag in all environments (P2)

**Status**: ❌ UNRESOLVED
**Locations**: `docker-compose.dev.yml:135`, `docker-compose.prod.yml:83`, `docker-compose.devremote.yml:44`
**Description**: All three compose files still pin LiveKit to `livekit/livekit-server:latest`. No semver tag used.
**Recommendation**: Pin to a specific semver tag (e.g., `livekit/livekit-server:1.8.0`).

#### IDR-003 — Caddyfile HSTS + Cloudflare HSTS coordination (P3)

**Status**: ❌ UNRESOLVED
**Location**: `Caddyfile.prod:11`
**Description**: HSTS is configured at both Caddy and Cloudflare edge. No documentation of how these interact. Not a functional issue but a coordination gap.
**Recommendation**: Document the split: Cloudflare enforces HSTS at edge, Caddy HSTS is defense-in-depth.

---

### Phase 2: IaC Review

#### IDR-004 — Production Terraform init missing backend credentials (P1)

**Status**: ❌ UNRESOLVED — **Not fixed per verification above**
**Location**: `.github/workflows/deploy-production.yml:66-68`
**Current state**:

```yaml
- name: Terraform Init
  working-directory: infra/terraform
  run: terraform init -input=false
```

Compare `infra-development.yml:43-48`:

```yaml
- name: Terraform Init
  working-directory: infra/terraform
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: terraform init -input=false -backend-config="bucket=chat-terraform-state" -backend-config="endpoint=https://sfo3.digitaloceanspaces.com"
```

**Risk**: If production Terraform needs to re-initialize (e.g., new runner, state corruption), it will fail to authenticate to DO Spaces. The endpoint IS hardcoded in `versions.tf:7`, so `-backend-config` is redundant. However, **no AWS/DO credentials are passed to the init step**, which is the critical gap.
**Recommendation**: Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` env vars to the production Terraform Init step (minimum). Optionally add the `-backend-config` overrides for consistency with the dev workflow.

#### IDR-005 — Terraform state locking not enforced (P2)

**Status**: ❌ UNRESOLVED
**Location**: `infra/terraform/versions.tf:4-12`
**Description**: No `dynamodb_table` or equivalent locking. DO Spaces does not support DynamoDB. Concurrent Terraform applies could corrupt state. No pre-check step exists in either workflow.
**Recommendation**: Add a pre-check step (query GitHub API for in-progress workflow runs with the same concurrency group), or migrate to a locking-capable backend.

#### IDR-006 — No Slack/PagerDuty notification for DO alerts (P2)

**Status**: ❌ UNRESOLVED
**Location**: `infra/terraform/main.tf:102-142`
**Description**: CPU, memory, and disk alerts configured via DO monitoring with **email only** (no Slack webhook, PagerDuty, or OpsGenie integration).
**Recommendation**: Add DO alert channel `slack` with webhook URL to `digitalocean_monitor_alert` resources.

#### IDR-007 — Droplet size mismatch: default vs actual (P3)

**Status**: ❌ UNRESOLVED
**Location**: `infra/terraform/variables.tf:26` vs `terraform.tfvars.example:4`
**Description**: `variables.tf` default: `s-1vcpu-512mb-10gb`. `terraform.tfvars.example`: `s-2vcpu-2gb`. A fresh `terraform apply` without explicit `tfvars` would provision an undersized 512MB droplet.
**Recommendation**: Update default to `s-2vcpu-2gb` to match production usage.

---

### Phase 3: Delivery Pipeline

#### IDR-010 — Secrets written to .env file on disk (P2) — ELEVATED from P2

**Status**: ❌ UNRESOLVED
**Location**: `deploy-production.yml:228-246`, `deploy-development.yml:126-157`
**Description**: Both deploy workflows construct `.env` files on the droplet containing plaintext secrets (`SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_SECRET`, `VAPID_PRIVATE_KEY`). These files persist on disk after container startup. No `chmod 600` is applied to the prod `.env` file (dev does set `chmod 600` on certs but not on the `.env` file). The file at `infra/docker/.env` (prod) and `/opt/chat/.env` (dev) is readable by any process on the droplet with filesystem access.
**Recommendation**: At minimum, add `chmod 600` to both `.env` files. Ideally, use Docker secrets (`echo "$SECRET" | docker secret create ...`) or a vault-based approach.

#### IDR-011 — No dry-run migration mode (P2)

**Status**: ❌ UNRESOLVED
**Location**: `.github/workflows/supabase-migrations.yml:34-35`
**Description**: Migration CI runs `supabase db push --include-all` directly with no preview/dry-run step.
**Recommendation**: Add a `supabase db diff --linked` step before `db push` that shows pending changes in the workflow log.

#### IDR-012 — Health check only validates API, not web frontend (P3)

**Status**: ❌ UNRESOLVED
**Location**: `deploy-production.yml:441-453`
**Description**: Post-deploy health check curls only `$api_url/health`. The web frontend (Next.js) health is not validated. The dev deploy checks both containers. Production only checks API.
**Recommendation**: Add a web health check: `curl -s -o /dev/null -w "%{http_code}" https://chat.$DOMAIN`.

---

### Phase 4: Resilience & Observability

#### IDR-013 — Health endpoint lacks Redis and BullMQ checks (P2)

**Status**: ❌ UNRESOLVED
**Location**: `apps/api/src/modules/health/service.ts:38-58`
**Description**: `getFullHealth()` only checks database health. No Redis connectivity check (ioredis ping), no BullMQ queue liveness check. If Redis is down, the health endpoint still reports `healthy`.
**Recommendation**: Add `checks.redis` (ioredis ping) and `checks.bullmq` (queue getActiveCount) to `getFullHealth()`. Report `degraded` if Redis is down but DB is fine.

#### IDR-014 — Chaos test scenarios limited (P2)

**Status**: ❌ UNRESOLVED
**Location**: `tests/chaos/`
**Description**: 4 scenarios documented (API Crash, Redis Down, DB Disconnect, High Latency) but only 2 have automated scripts. No CI integration for chaos tests.
**Recommendation**: Script remaining 2 scenarios. Add a scheduled weekly CI workflow for chaos testing against the dev environment.

#### IDR-015 — Worker Dockerfile lacks HEALTHCHECK directive (P3)

**Status**: ❌ UNRESOLVED
**Location**: `apps/worker/Dockerfile:17-35`
**Description**: API and Web Dockerfiles both have `HEALTHCHECK` directives. Worker does not, relying solely on the compose-level health check. Worker exposes port 4100 with a `/healthz` endpoint, but the Dockerfile doesn't declare a HEALTHCHECK.
**Recommendation**: Add `HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD wget ... http://localhost:4100/healthz || exit 1` matching the API/Web pattern.

---

### Phase 5: Recovery & Failover

#### IDR-016 — No automated backup verification in CI (P2)

**Status**: ❌ UNRESOLVED
**Location**: `docs/runbooks/backup-strategy.md:65-72`
**Description**: Backup strategy recommends monthly restoration testing but no CI workflow automates this. Manual verification is likely to be skipped.
**Recommendation**: Add a scheduled weekly workflow that dumps → restores → smoke tests against a staging project.

#### IDR-017 — Supabase connection pooling not visible at application level (P2)

**Status**: ❌ UNRESOLVED
**Location**: `apps/api/src/lib/supabase.ts`
**Description**: Supabase manages pooling via Supavisor. No explicit application-level pool configuration in the Supabase client. The `createClient` calls do not specify `db.pool` settings.
**Recommendation**: Add explicit pool config (e.g., `db: { pool: { max: 10 } }`). Review Supavisor pool settings in Supabase dashboard.

#### IDR-018 — No cross-region replication for object storage (P3)

**Status**: ❌ UNRESOLVED
**Location**: `docs/runbooks/backup-strategy.md:28-32`
**Description**: Object storage (avatars, uploads) is not replicated to a second region. A regional DO/Supabase outage could make files inaccessible.
**Recommendation**: Configure Supabase Storage replication or lifecycle rule to copy uploads to a secondary bucket.

---

## New Findings (July 24, 2026)

### IDR-019 — Production `api` service lacks REDIS_URL env var (P1)

**Location**: `infra/docker/docker-compose.prod.yml:111-129`
**Description**: The production `api` service does not set `REDIS_URL` in its environment. The worker service correctly sets `REDIS_URL: redis://redis:6379` (line 53), but the api service only has:

```yaml
environment:
  <<: *common-env
  PORT: 4000
  LIVEKIT_API_KEY: ${LIVEKIT_API_KEY}
  LIVEKIT_API_SECRET: ${LIVEKIT_API_SECRET}
  LIVEKIT_HOST: http://livekit:7880
```

Neither `*common-env` nor the explicit env includes `REDIS_URL`. Compare with `docker-compose.devremote.yml:110-115` where api also lacks REDIS_URL but loads it from `env_file: .env` (dev deploy creates a .env with broader vars). Production compose does NOT use `env_file` on any service. If the API connects to Redis for Socket.io adapter (the architecture uses Redis adapter in production per AGENTS.md), this connection will fail silently or the API will fall back to in-memory mode. This could cause Socket.io to not scale across multiple instances and may cause silent presence/state mismatch.

**Evidence**: `docker-compose.prod.yml` api service environment block (lines 116-122) — no REDIS_URL.

**Recommendation**: Add `REDIS_URL: redis://redis:6379` to the API service environment in `docker-compose.prod.yml`. Also add it to the prod `.env` generator script for future-proofing.

---

### IDR-020 — `docker compose down -v` destroys Redis AOF persistence on every deploy (P2)

**Location**: `deploy-production.yml:278`, `deploy-development.yml:189`
**Description**: Both deploy workflows run:

```bash
docker compose -f infra/docker/docker-compose.prod.yml down -v --remove-orphans
```

The `-v` flag removes **named volumes** including `redis-data`. Redis is configured with `--appendonly yes` for AOF persistence, and `docs/runbooks/backup-strategy.md:39` states AOF is "for crash recovery." However, **every deploy destroys the AOF file**, making it useless for crash recovery between deploys.

**Impact**: If any BullMQ jobs were queued (webhook deliveries, notifications, search indexing) and not yet processed when a deploy starts, they are permanently lost. The AOF file that could have recovered them post-deploy is destroyed.

**Contradiction**: The backup strategy says Redis data loss is acceptable ("No persistent backup needed — Redis is a cache layer"), but also says AOF is enabled "for crash recovery." The deploy process nullifies AOF's purpose.

**Recommendation**: Either:

1. Remove the `-v` flag (let volumes persist across deploys), OR
2. Disable AOF and remove it from the backup strategy (accept data loss as by-design), OR
3. Add a graceful drain step: disable new queue jobs → wait for active jobs to complete → then `down -v`

---

### IDR-021 — `docker compose down -v` destroys caddy-data/caddy-config volumes (P2)

**Location**: `deploy-production.yml:278`, `deploy-development.yml:189`
**Description**: The `-v` flag also removes `caddy-data` and `caddy-config` volumes. Caddy stores TLS certificate data (ACME account keys, obtained certificates) in `caddy-data`. Destroying this volume on every deploy means:

1. Caddy must re-obtain/renew certificates from scratch on each deploy
2. Increased load on Let's Encrypt / certificate issuer
3. Potential rate-limiting from ACME providers if deploys are frequent

**Note**: Production uses Cloudflare origin certificates (loaded from `/certs/` bind-mount), so `caddy-data` is less critical. However, the `Caddyfile.prod` still has `tls /certs/cf-origin.pem /certs/cf-origin-key.pem` which doesn't use ACME. The dev Caddyfile uses `tls /etc/caddy/certs/...` as well. So this is lower risk but still wasteful.

**Recommendation**: Remove `-v` flag or scope it to specific non-persistent volumes. At minimum, don't destroy `caddy-data` and `caddy-config`.

---

### IDR-022 — Secrets `.env` file persists on disk after deployment with no cleanup (P2)

**Location**: `deploy-production.yml:228-246`, `deploy-development.yml:126-157`
**Description**: Both deploy workflows create `.env` files containing plaintext secrets on the droplet filesystem. The files are written to:

- Production: `infra/docker/.env`
- Development: `/opt/chat/.env` (copied to `infra/docker/.env`)

These files persist after containers start and are never removed. Neither file has `chmod 600` applied (the dev deploy does `chmod 600` on the private key cert but not on the `.env` file). Any user with filesystem access (`root` or container escape) can read all secrets.

This is an extension of IDR-010 but specifically flags the post-deploy cleanup gap and missing `chmod 600`.

**Recommendation**: Add `chmod 600` to both `.env` files. Add a cleanup step after `docker compose up -d` succeeds:

```bash
shred -u infra/docker/.env 2>/dev/null || rm -f infra/docker/.env
```

Alternatively, use Docker secrets or `--env-file` with a temp file that is cleaned up.

---

### IDR-023 — `infra-development.yml` SSH health check uses `0.0.0.0/0` for allowed IPs (P2)

**Location**: `.github/workflows/infra-development.yml:121`
**Description**:

```yaml
TF_VAR_ssh_allowed_ips: "0.0.0.0/0"
```

The infra-development workflow hardcodes `ssh_allowed_ips` to `0.0.0.0/0`, opening SSH to the entire internet. The production workflow correctly uses `${{ secrets.SSH_ALLOWED_IPS }}`. The `variables.tf` default for `ssh_allowed_ips` is already empty string which the `main.tf:40` interprets as `["0.0.0.0/0"]` as a fallback. So the dev infra workflow explicitly sets this insecure value.

**Recommendation**: Use the `SSH_ALLOWED_IPS` secret for the dev infra workflow as well, or at minimum restrict to GitHub Actions IP ranges.

---

## Score Revision

| Dimension                            | Old Score  | New Score  | Change                               |
| ------------------------------------ | ---------- | ---------- | ------------------------------------ |
| Environment Model (Phase 1)          | 7/10       | 6/10       | -1 (IDR-002 still open)              |
| IaC Review (Phase 2)                 | 6/10       | 5/10       | -1 (IDR-004 not fixed, 1 new)        |
| Delivery Pipeline (Phase 3)          | 7/10       | 5/10       | -2 (2 new P2)                        |
| Resilience & Observability (Phase 4) | 7/10       | 6/10       | -1 (unchanged)                       |
| Recovery & Failover (Phase 5)        | 6/10       | 5/10       | -1 (IDR-020 new, IDR-016 still open) |
| **Total**                            | **6.8/10** | **5.9/10** | **-0.9**                             |

Score downgraded primarily due to: (1) IDR-004 not actually fixed despite being claimed, (2) 5 new findings (1 P1, 4 P2) not caught in the original audit, (3) IDR-020/IDR-021 volume destruction pattern that nullifies AOF persistence.

---

## Appendix A: Fixed vs Not Fixed Summary

| ID          | Severity | Description                             | Status       |
| ----------- | -------- | --------------------------------------- | ------------ |
| IDR-001     | P1       | Caddyfile.prod nested block             | ✅ FIXED     |
| IDR-008     | P1       | Deploy concurrency lock (flock)         | ✅ FIXED     |
| IDR-009     | P1       | SHA tags instead of :latest             | ✅ FIXED     |
| —           | P2       | Worker Dockerfile non-root user         | ✅ FIXED     |
| —           | P2       | set +x secrets masking                  | ✅ FIXED     |
| OPS-001     | —        | alerting.md created                     | ✅ FIXED     |
| IDR-004     | P1       | Production terraform init backend creds | ❌ NOT FIXED |
| IDR-002     | P2       | LiveKit :latest tag                     | ❌           |
| IDR-005     | P2       | Terraform state locking                 | ❌           |
| IDR-006     | P2       | No Slack/PagerDuty alerts               | ❌           |
| IDR-010     | P2       | Secrets on disk                         | ❌           |
| IDR-011     | P2       | No migration dry-run                    | ❌           |
| IDR-013     | P2       | Health lacks Redis/BullMQ               | ❌           |
| IDR-014     | P2       | Chaos tests limited                     | ❌           |
| IDR-016     | P2       | No backup verification CI               | ❌           |
| IDR-017     | P2       | Connection pooling                      | ❌           |
| IDR-003     | P3       | HSTS coordination                       | ❌           |
| IDR-007     | P3       | Droplet size mismatch                   | ❌           |
| IDR-012     | P3       | Health check API-only                   | ❌           |
| IDR-015     | P3       | Worker HEALTHCHECK missing              | ❌           |
| IDR-018     | P3       | Cross-region storage                    | ❌           |
| **IDR-019** | **P1**   | **Production api lacks REDIS_URL**      | **NEW**      |
| **IDR-020** | **P2**   | **down -v destroys Redis AOF**          | **NEW**      |
| **IDR-021** | **P2**   | **down -v destroys caddy volumes**      | **NEW**      |
| **IDR-022** | **P2**   | **.env file no chmod 600 / cleanup**    | **NEW**      |
| **IDR-023** | **P2**   | **Dev infra SSH 0.0.0.0/0**             | **NEW**      |

---

## Appendix B: Remediation Priority (Revised)

### Immediate (P1 — 1-2 days)

1. **IDR-019**: Add `REDIS_URL: redis://redis:6379` to `docker-compose.prod.yml` api service environment
2. **IDR-004**: Add `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` env vars to production terraform init step

### Short-term (P2 — 1 week)

3. **IDR-020/021**: Remove `-v` from `docker compose down` or scope to non-persistent volumes
4. **IDR-022**: Add `chmod 600` and post-deploy shred/rm of .env files
5. **IDR-023**: Replace `0.0.0.0/0` with `SSH_ALLOWED_IPS` secret in infra-development.yml
6. **IDR-002**: Pin LiveKit to semver tag in all 3 compose files
7. **IDR-013**: Add Redis + BullMQ checks to health endpoint

### Medium-term (2-4 weeks)

8. **IDR-005**: Implement Terraform state locking pre-check
9. **IDR-010**: Migrate to Docker secrets or vault
10. **IDR-011**: Add migration dry-run step
11. **IDR-006**: Add Slack webhook to DO alerts
12. **IDR-016**: Add automated backup verification workflow

### Long-term (1-2 months)

13. **IDR-014**: Script remaining chaos scenarios + CI integration
14. **IDR-017**: Explicit Supabase connection pool config
15. **IDR-018**: Cross-region storage replication
16. **IDR-007**: Update default droplet size
17. **IDR-012**: Add web health check to production deploy
18. **IDR-015**: Add HEALTHCHECK to Worker Dockerfile
