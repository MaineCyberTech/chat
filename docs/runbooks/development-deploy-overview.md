# Development Deploy Overview

## Target

- Droplet: Chat Platform Development
- Domains: `chat.mainecybertech.us` / `chat-api.mainecybertech.us`
- Environment: `development`

## Prerequisites

1. DigitalOcean API token with droplet, firewall, and domain access
2. SSH key registered in DigitalOcean
3. Domain `mainecybertech.us` managed in DigitalOcean DNS

## Provisioning (One-Time)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit: do_token, environment="development", domain="mainecybertech.us", ci_public_key

terraform init
terraform plan
terraform apply
```

This creates:

- Ubuntu 24.04 droplet with Docker pre-installed
- Firewall (ports 22, 80, 443)
- DNS A records for `chat` and `chat-api` subdomains

## Post-Provision Setup (One-Time)

SSH into the droplet:

```bash
ssh root@<droplet-ip>

# Clone the repo
git clone <repo-url> /opt/chat
cd /opt/chat

# Copy env files
cp infra/docker/.env.devremote.example infra/docker/.env.devremote
# Edit .env.devremote with real Supabase credentials

# Start services
docker compose -f infra/docker/docker-compose.devremote.yml up -d
```

## Automated Deploy

Push to `develop` branch. GitHub Actions will:

1. Validate: lint, typecheck, test, build
2. Build multi-stage Docker images
3. Push to `ghcr.io/<owner>/chat/api:dev` and `ghcr.io/<owner>/chat/web:dev`
4. SSH into droplet, pull images, `docker compose up -d`
5. Health check: poll `https://chat-api.mainecybertech.us/healthz` for 60s

Required GitHub repository secrets:

- `CI_SSH_PRIVATE_KEY` — SSH private key for authentication
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase connection

## Manual Deploy

```bash
# Build images locally (optional)
docker compose -f infra/docker/docker-compose.devremote.yml build

# Pull latest from registry and restart
docker compose -f infra/docker/docker-compose.devremote.yml pull
docker compose -f infra/docker/docker-compose.devremote.yml up -d
```

## Post-Deploy Verification

```bash
# API health
curl https://chat-api.mainecybertech.us/health
# {"status":"ok","checks":{"server":{"status":"ok"}},...}

# Frontend
curl -sI https://chat.mainecybertech.us | head -1
# HTTP/2 200
```

## Troubleshooting

- **Container won't start**: `docker compose -f infra/docker/docker-compose.devremote.yml logs`
- **SSL certificate errors**: Check Caddy logs (`docker compose logs caddy`)
- **Supabase connection fails**: Verify `SUPABASE_URL` and keys in `.env.devremote`
