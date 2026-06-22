# Production Deploy Overview

## Target

- Droplet: Chat Platform Production
- Domains: `chat.mainecybertech.com` / `chat-api.mainecybertech.com`
- Environment: `production`

## Prerequisites

Same as development, plus:

1. Domain `mainecybertech.com` managed in DigitalOcean DNS
2. GitHub Environment `production` with required reviewers (recommended)

## Provisioning (One-Time)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit: do_token, environment="production", domain="mainecybertech.com", ci_public_key

terraform init
terraform plan
terraform apply
```

## Post-Provision Setup (One-Time)

```bash
ssh root@<droplet-ip>
git clone <repo-url> /opt/chat
cd /opt/chat

cp infra/docker/.env.prod.example infra/docker/.env.prod
# Edit with production Supabase credentials

docker compose -f infra/docker/docker-compose.prod.yml up -d
```

## Automated Deploy

Push to `main` branch. GitHub Actions will:

1. Validate
2. Build and push images tagged `:latest`
3. Deploy to production droplet
4. Health check against `https://chat-api.mainecybertech.com/healthz`

## Rollback

```bash
# SSH into droplet
ssh root@<droplet-ip>
cd /opt/chat

# Pull previous image tag
docker pull ghcr.io/<owner>/chat-api:<previous-sha>
docker pull ghcr.io/<owner>/chat-web:<previous-sha>

# Tag and restart
export API_IMAGE=ghcr.io/<owner>/chat/api:<previous-sha>
export WEB_IMAGE=ghcr.io/<owner>/chat/web:<previous-sha>
docker compose -f infra/docker/docker-compose.prod.yml up -d
```

## Monitoring

Check container health:

```bash
docker compose -f infra/docker/docker-compose.prod.yml ps
docker stats chat-api-prod chat-web-prod
```

View logs:

```bash
docker compose -f infra/docker/docker-compose.prod.yml logs -f --tail=100
```
