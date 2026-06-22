# Terraform — DigitalOcean Droplet Provisioning

## Overview

Provisions a single Ubuntu 24.04 droplet with Docker pre-installed via cloud-init,
registers an SSH key, creates DNS A records, and configures a firewall.

In CI, this runs automatically before deploy. Locally, it can also be run manually.

## Variables

| Variable               | Description                   | Example             |
| ---------------------- | ----------------------------- | ------------------- |
| `do_token`             | DigitalOcean API token        | `dop_v1_...`        |
| `environment`          | `development` or `production` | `development`       |
| `region`               | DO region                     | `nyc3`              |
| `droplet_size`         | Droplet size                  | `s-2vcpu-2gb`       |
| `domain`               | Base domain                   | `mainecybertech.us` |
| `cloudflare_zone_id`   | Cloudflare Zone ID            | `abc123...`         |
| `cloudflare_api_token` | Cloudflare API token          | `abc...`            |

## Usage (Local)

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values
terraform init
terraform plan
terraform apply
```

## Usage (CI)

Set these GitHub repository secrets:

| Secret         | Maps to variable            |
| -------------- | --------------------------- |
| `DO_API_TOKEN` | `TF_VAR_do_token`           |
| `CF_API_TOKEN` | `CLOUDFLARE_API_TOKEN`      |
| `CF_ZONE_ID`   | `TF_VAR_cloudflare_zone_id` |

The workflow passes `TF_VAR_environment` and `TF_VAR_domain` from the workflow env.

Push to `develop` (`.us`) or `main` (`.com`) — the provision job runs `terraform apply -auto-approve`.

## Resources Created

- `digitalocean_droplet` — Ubuntu 24.04 with Docker via cloud-init (uses existing account SSH keys)
- `digitalocean_firewall` — opens ports 22, 80, 443
- `cloudflare_dns_record` (×2) — A records for `chat` and `chat-api`

## Environments

- **development**: `chat.mainecybertech.us` / `chat-api.mainecybertech.us`
- **production**: `chat.mainecybertech.com` / `chat-api.mainecybertech.com`

## Outputs

| Output         | Description            |
| -------------- | ---------------------- |
| `droplet_id`   | Droplet ID             |
| `droplet_ip`   | Public IPv4 address    |
| `frontend_url` | Frontend HTTPS URL     |
| `api_url`      | API HTTPS URL          |
| `domain`       | Registered domain name |
