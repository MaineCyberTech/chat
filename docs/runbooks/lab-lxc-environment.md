# Lab LXC environment — self-hosted chat stack

A Proxmox LXC that hosts the self-hosted data plane, replacing both the dead
hosted Supabase project and (for dev) the undersized DigitalOcean droplet.

Created as part of the self-hosted migration — see
[ADR 0002](../adr/0002-postgres-postgrest-custom-auth.md) and the
[migration plan](../architecture/db-migration-supabase-to-selfhosted.md).

## Why

|                                          | DigitalOcean droplet (previous dev)    | Proxmox LXC (this)        |
| ---------------------------------------- | -------------------------------------- | ------------------------- |
| CPU                                      | 1 vCPU                                 | 2 cores                   |
| RAM                                      | ~458 MB usable                         | 4 GB (2.6 GB free in use) |
| Disk                                     | 8.7 GB, hit 100 % and caused an outage | 20 GB (2.2 GB used)       |
| Fits Postgres + PostgREST + MinIO + app? | no                                     | yes                       |

The droplet's 512 MB could not host the self-hosted stack; the compose files
alone requested ~1.25 GB of limits.

## Host

| Property     | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| Proxmox node | `testnuc` (`https://192.168.222.222:8006`)                        |
| Container    | vmID **200**, hostname `chat-dev`                                 |
| Address      | `192.168.222.240/24`, gateway `192.168.222.1`                     |
| Template     | `local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst`        |
| Resources    | 2 cores, 4096 MB RAM, 1024 MB swap, 20 GB on `local-lvm`          |
| Features     | `nesting=1,keyctl=1` (required for Docker in an unprivileged LXC) |
| Unprivileged | yes                                                               |
| Autostart    | no (`onboot=0`) — deliberately manual                             |

Existing lab guests to avoid colliding with: `ci-runner` 201, `edge-builder` 202,
`lab-runner-2` 203, `iso-builder` 210, `vault-1/2/3` 9300–9302.

## Access

```bash
ssh root@192.168.222.240          # key: C:\temp\.ssh\chat-ci
```

Proxmox API (create/start/stop) uses `root@pam` with the credential stored as
`sudo=` in `C:\temp\falcon\.env`. Pass it via a temp `--data` file, never argv.

## What runs there

Stack source of truth: `/opt/chat`, driven by
`infra/docker/docker-compose.devremote.yml`.

| Container             | Purpose                                       | Published |
| --------------------- | --------------------------------------------- | --------- |
| `chat-postgres-dev`   | PostgreSQL 17 (RLS, `auth` schema shim)       | internal  |
| `chat-postgrest-dev`  | Data API at `/rest/v1` (supabase-js protocol) | internal  |
| `chat-minio-dev`      | S3 object storage                             | internal  |
| `chat-minio-init-dev` | one-shot: bucket + anonymous-download policy  | exits 0   |
| `chat-caddy-dev`      | routes `/rest/v1`, `/storage/v1`, `/v1`       | `:80`     |

`api`, `web` and `worker` are **not** running yet — they need images built from
this branch (the GHCR `:dev` images are from July and predate the fixes).

Secrets live in `/opt/chat/infra/docker/.env` (mode 600, generated, not in git).

### Caddyfile difference from the repo

The lab container uses a plain-HTTP Caddyfile (no TLS, no public hostnames) rather
than `infra/docker/Caddyfile`, which references Cloudflare origin certificates.

## Setup, if it has to be rebuilt

1. `pct create` on `testnuc` with the properties above, injecting an SSH key.
2. `apt-get install -y docker.io docker-compose-v2 nodejs curl`
3. Copy `infra/docker/docker-compose.devremote.yml`, `supabase/` and
   `scripts/db/` to `/opt/chat`.
4. Generate `infra/docker/.env` (Postgres password, `JWT_SECRET` ≥ 32 chars,
   `S3_ACCESS_KEY`/`S3_SECRET_KEY`).
5. Write the plain-HTTP Caddyfile.
6. `docker compose up -d postgres postgrest minio minio-init caddy`
7. `node scripts/db/apply-migrations.mjs --docker chat-postgres-dev --seed`
8. `node scripts/db/mint-keys.mjs` → the anon/service JWTs for clients.

## Verification performed

| Check                                                              | Result                |
| ------------------------------------------------------------------ | --------------------- |
| 76 migrations + 6 seed files applied                               | all `ok`              |
| Seed counts (21 users / 3 workspaces / 24 channels / 320 messages) | match                 |
| `supabase/tests/rls_tenant_isolation.sql`                          | **PASS**              |
| `anon` JWT via PostgREST                                           | `200 []` (RLS denies) |
| user JWT (Elena) via PostgREST                                     | only `Acme Corp`      |
| `service_role` JWT via PostgREST                                   | all 3 workspaces      |
| MinIO bucket + anonymous-download policy                           | created, `download`   |
| `/rest/v1/` and `/storage/v1/chat-uploads/` over HTTP              | `200`                 |
| `scripts/db/verify-selfhosted.mjs` from outside the LXC            | **3/3**               |

## Follow-ups

- Put TLS in front before any non-lab use; the Caddyfile here is plain HTTP.
- The lab `.env` is managed out of band and is deliberately **not** written by
  CI, so a rebuild of this container needs the secrets re-generated (see below).

## Deployment pipeline

| Workflow                  | Target              | What it does                                                                                                                                         |
| ------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deploy-development.yml`  | this LXC            | Waits for CI + build-push, syncs the compose file, pulls the `:sha`/`:dev` images from GHCR, `compose up -d`, health-checks `http://192.168.222.240` |
| `seed-database.yml`       | this LXC's Postgres | Syncs `supabase/` + `scripts/db/`, applies bootstrap + pending migrations, optionally seeds (`include_seeds`), verifies data and runs the RLS test   |
| `supabase-migrations.yml` | this LXC's Postgres | Calls `seed-database.yml` with `include_seeds: false` on pushes touching `supabase/migrations/**`                                                    |

Both repointed workflows run on `[self-hosted, linux, x64, lab-docker]`. The host
defaults to `192.168.222.240` and can be overridden with the repository variables
`LAB_LXC_HOST` / `LAB_LXC_URL`.

**Deploys ship images only — never schema.** That matches
`docs/operations/database-change-governance.md`: migrations go through
`seed-database.yml` or the CLI, not the deploy path.

### Migration tracking

`scripts/db/apply-migrations.mjs` records applied files in
`public.schema_migrations`, so it is safe to run on every deploy:

```bash
node scripts/db/apply-migrations.mjs --docker chat-postgres-dev --status
node scripts/db/apply-migrations.mjs --docker chat-postgres-dev --seed
node scripts/db/apply-migrations.mjs --docker chat-postgres-dev --baseline   # existing DB, pre-tracking
node scripts/db/apply-migrations.mjs --docker chat-postgres-dev --force      # re-apply everything
```

Bootstrap files are re-applied every run (they are idempotent by design);
migrations are skipped once recorded. Seeds are fixtures, re-applied on request
in order — the users seed cascades into dependent tables, so the whole set must
run together.

### Seeding on a fresh system — verified

Wiping the database and rebuilding it from `bootstrap + migrations + seeds`
produces a working, login-capable dataset:

| Check                                      | Result                              |
| ------------------------------------------ | ----------------------------------- |
| Migration files applied from scratch       | 76, all `ok`                        |
| Seed files applied                         | 6, all `ok`                         |
| auth users / identities / profiles         | 21 / 21 / 21                        |
| workspaces / members / channels            | 3 / 28 / 24                         |
| messages / thread replies / reactions      | 320 / 49 / 153                      |
| RLS-enabled tables                         | 41                                  |
| `marcus@seed.test` + `password123`         | authenticates (bcrypt via pgcrypto) |
| Profiles auto-created by `handle_new_user` | yes                                 |
| `rls_tenant_isolation.sql`                 | **PASS**                            |
| Tenant isolation via PostgREST (Elena)     | sees only `Acme Corp`               |

## CI runners

Every job in `.github/workflows/*.yml` runs on the org's self-hosted lab
runners, which live on this same Proxmox node. GitHub-hosted minutes are
billing-blocked for this org, so `ubuntu-latest` is not a usable target.

| Runner         | Labels                                        | RAM    | Used for                  |
| -------------- | --------------------------------------------- | ------ | ------------------------- |
| `ci-runner`    | `lab`, `lab-debian`, `lab-docker`             | 16 GiB | docker jobs               |
| `edge-builder` | `lab`, `lab-ubuntu`, `lab-python`, `lab-sudo` | 24 GiB | Python jobs, large builds |
| `lab-runner-2` | `lab`, `lab-debian`, `lab-docker`             | 12 GiB | docker jobs               |

Job selection, applied across all 35 jobs:

| `runs-on`                               | Count | Used by                                                                                                                                                          |
| --------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[self-hosted, linux, x64, lab]`        | 15    | default — test, lint, typecheck, build, terraform, shell jobs                                                                                                    |
| `[self-hosted, linux, x64, lab-docker]` | 11    | jobs needing Docker **on the runner**: `appleboy/ssh-action`, `aquasecurity/trivy-action`, `docker/build-push-action`, `grafana/k6-action`, and `supabase start` |
| `[self-hosted, linux, x64, lab-python]` | 9     | Python-centric jobs (`pip install`)                                                                                                                              |

The policy and the label list are recorded in `.github/actionlint.yaml`.

### Caveats to check before trusting CI

1. **Runner-group access.** The runners are org-level (the repo-level runner list
   is empty). The chat repository must be granted access to the runner group in
   org settings, otherwise jobs queue indefinitely with no obvious error.
2. **Tool availability on the runners.** Most jobs install their own toolchain
   (`actions/setup-node`, `pnpm/action-setup`, `hashicorp/setup-terraform`).
   These are assumed present on the runner itself: `jq`, `curl` (used by
   `deploy-development.yml`) and `pwsh` (used only by the manual
   `governance.yml` / `platform.yml` orchestration). A Debian-based runner may
   lack `pwsh`.
3. **Runner capacity.** Three runners are shared with the falcon/monitoring
   programs. `validate.yml` fans out to 10 jobs at once, so a busy lab will
   serialise them.
4. **Fork PRs.** Self-hosted runners executing untrusted PR code can reach the
   lab network. This repo is private and contributor-restricted, but the
   `pull_request` triggers should be reviewed before opening it up.

## Bugs this bring-up surfaced

Running the full stack on a clean host found defects that the existing CI and
audits had not, because none of them exercise the worker or the deployed routing.

| Defect                                                                        | Impact                                                                                                                                                                    | Fix                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `apps/web/Dockerfile` never copied `middleware.ts`                            | Every production web image shipped **without** CSP/HSTS/nosniff/referrer/permissions headers                                                                              | Added the `COPY`                                                                                                 |
| Web client bootstrapped CSRF from `GET /`                                     | In every deployed topology `/` is served by Next.js, not the API, so no cookie was ever set and **every mutating request would 403**                                      | New `GET /v1/csrf-token` endpoint; client targets it                                                             |
| Worker wrapped **every** method of the Supabase client in the circuit breaker | `supabase.from()` returned a Promise, so the builder chain broke — `TypeError: supabase.from(...).select is not a function`. **Every worker DB operation failed forever** | Guard the builder and intercept only `then`                                                                      |
| Worker cleaned `auth.refresh_tokens` via `.schema("auth")`                    | The `auth` schema is deliberately not exposed to PostgREST, so this could never work                                                                                      | Call the `auth_purge_expired_tokens` RPC                                                                         |
| `.neq("deleted_at", null)` in three retention queries                         | PostgREST renders `<> 'null'`, which Postgres rejects: `invalid input syntax for type timestamp with time zone: "null"`. Data retention never deleted anything            | `.not("deleted_at", "is", null)`                                                                                 |
| PostgREST schema cache not reloaded after migrations                          | New tables/FKs invisible to the API (`Could not find a relationship between ... in the schema cache`)                                                                     | `apply-migrations.mjs` emits `notify pgrst, 'reload schema'` at the end of the run                               |
| Redis `maxmemory-policy`                                                      | `noeviction` is what BullMQ requires; eviction mid-job can corrupt queue state                                                                                            | `maxmemory 160mb` + `noeviction`, below the 192m container limit so Redis fails soft instead of being OOM-killed |

Also fixed while moving CI: `appleboy/scp-action` was referenced with an invented
SHA, and a PowerShell `` `r `` escape had silently corrupted every `runs-on:` key
into `<CR>uns-on:`.
