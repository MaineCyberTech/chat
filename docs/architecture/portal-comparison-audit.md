# Portal Repo Comparison Audit — June 20, 2026

## Executive Summary

Compared `chat` repo against `mainecybertech-portal` (proven production deployment). The portal has superior patterns in 13 areas. 11 have been adopted, 2 deferred.

## Adopted Improvements

### 1. Base64 Environment File Transfer (CRITICAL)

- **Before**: SSH `echo` commands for each env var line, with fragile `\"` escaping
- **After**: Write `.env.devremote` locally as heredoc → base64 encode → pipe via SSH → decode on droplet
- **Benefit**: Binary-safe for special chars in secrets (`$`, `!`, backticks, newlines)

### 2. SSH Pre-Flight + Per-Step Exit Tracking (HIGH)

- **Before**: Single `$SSH` variable, no exit code tracking, silent failures
- **After**: Explicit steps with `SSH_TEST_EXIT`, `ENV_EXIT`, `SETUP_EXIT`, `COMPOSE_EXIT`, `PIPE_API_EXIT`, `PIPE_WEB_EXIT`
- **Benefit**: Instantly identify which substep failed in CI logs

### 3. YAML Anchors in Docker Compose (MEDIUM)

- **Before**: Environment repeated per service or loaded from env_file
- **After**: `x-common-env: &common-env` with `<<: *common-env` deduplication
- **Benefit**: Single source of truth for shared vars, less duplication

### 4. UFW Host Firewall in Cloud-Init (MEDIUM)

- **Before**: Relied solely on DO cloud firewall
- **After**: UFW installed and configured (ports 22, 80, 443) alongside DO firewall
- **Benefit**: Defense in depth — DO firewall + host firewall

### 5. Package Upgrades + App Dirs in Cloud-Init (MEDIUM)

- **Before**: `package_upgrade: false`, no pre-created directories
- **After**: `package_upgrade: true`, `mkdir -p /opt/chat` during provisioning
- **Benefit**: Latest security patches on boot, ready directory structure

### 6. Non-Root User in Dockerfiles (MEDIUM)

- **Before**: All containers ran as root
- **After**: `addgroup/adduser` with gid 1001, `USER appuser` / `USER nextjs`
- **Benefit**: Security best practice, compliance-ready

### 7. ServerAliveInterval in SSH (LOW)

- **Before**: Default SSH timeout
- **After**: `ServerAliveInterval=60 ServerAliveCountMax=10` on all SSH opts
- **Benefit**: Prevents timeout during large image transfers

### 8. `depends_on` in Compose (LOW)

- **Before**: Services started in any order
- **After**: `depends_on: api: condition: service_started` on web service
- **Benefit**: Explicit startup ordering

### 9. Per-Image Piping with Exit Codes (HIGH)

- **Before**: Single loop without per-image status
- **After**: Each image piped with `PIPE_{API,WEB}_EXIT` echo
- **Benefit**: Identify which image transfer failed

### 10. Docker Log Rotation (KEPT)

- **Before (chat)**: Docker daemon.json with `max-size: 10m, max-file: 3`
- **After (chat)**: Kept this — portal doesn't have it
- **Benefit**: Prevents 10GB disk fill from container logs

### 11. SSH Key Auto-Detection at Runtime (KEPT)

- **Before (chat)**: Computes fingerprint from public key, checks DO API, uploads if missing
- **After (chat)**: Kept this — portal hardcodes fingerprint in tfvars
- **Benefit**: Key rotation doesn't break provisioning

## Deferred Improvements

### 1. Remote Terraform State Backend

- **Status**: Documented in AGENTS.md as MEDIUM priority
- **Why deferred**: Requires S3 bucket/DigitalOcean Space setup
- **Impact**: Eliminates fragile `terraform import` step in CI

### 2. SSH Key Passphrase Protection

- **Status**: Documented for future consideration
- **Why deferred**: Requires re-key on droplet, new GitHub secrets
- **Impact**: Defense-in-depth for leaked private key

## Not Adopted (Portal Patterns We Chose to Skip)

### 1. Multi-Zone DNS in Single Config

- **Portal**: Manages `.com` and `.us` zones in one Terraform config with `count` conditionals
- **Chat**: Uses `locals.tf` for DRY domain names, separate `cloudflare_zone_id` per env
- **Decision**: Chat's approach is simpler and more explicit

### 2. All-in-One Build+Deploy Workflow

- **Portal**: Single `deploy-do.yml` builds AND deploys
- **Chat**: Separate `build-push.yml` + `deploy-development.yml`
- **Decision**: Separate workflows allow rebuild without redeploy, deploy without rebuild

### 3. Hardcoded SSH Fingerprint in tfvars

- **Portal**: Fingerprint baked into `dev.tfvars`
- **Chat**: Computes fingerprint at runtime from public key
- **Decision**: Chat's approach is more maintainable

## Verification Checklist

- [x] Base64 env file transfer (deploy-development.yml)
- [x] Per-step exit code tracking (deploy-development.yml)
- [x] SSH pre-flight test (deploy-development.yml)
- [x] YAML anchors in compose (both compose files)
- [x] UFW in cloud-init (cloud-init.yaml.tftpl)
- [x] Package upgrades in cloud-init (cloud-init.yaml.tftpl)
- [x] App dirs in cloud-init (cloud-init.yaml.tftpl)
- [x] Non-root user in Dockerfiles (both Dockerfiles)
- [x] ServerAliveInterval SSH opts (deploy-development.yml)
- [x] depends_on in compose (both compose files)
- [ ] Remote Terraform state (deferred)
- [ ] SSH key passphrase (deferred)

## Notes

- Caddy `auto_https off` is temporary — remove when Let's Encrypt rate limit clears (June 21, 2026)
- Cloudflare Flexible SSL is temporary — switch to Full when Caddy certs work
- Docker log rotation in daemon.json is a chat-specific improvement the portal lacks
- SSH key fingerprint auto-detection is a chat-specific improvement the portal lacks
