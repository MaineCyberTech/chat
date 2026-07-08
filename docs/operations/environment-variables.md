# Environment Variables

## Overview

All environment variables are organized by domain. Required variables are noted; optional variables have defaults shown.

## Supabase

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | `http://localhost:54321` | URL of the Supabase instance |
| `SUPABASE_ANON_KEY` | Yes | — | Public anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Admin key (server-side only) |
| `SUPABASE_PROJECT_REF` | CI | — | Supabase project ref for migrations |
| `SUPABASE_DB_PASSWORD` | CI | — | DB password for migrations |
| `SUPABASE_ACCESS_TOKEN` | CI | — | Supabase API access token |

## Next.js (Client-side, prefixed with `NEXT_PUBLIC_`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` | API server URL |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Frontend URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `http://localhost:54321` | Supabase URL for browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Supabase anon key for browser client |
| `NEXT_PUBLIC_APP_VERSION` | No | — | Injected at build time |
| `NEXT_PUBLIC_GIT_SHA` | No | — | Current commit SHA |
| `NEXT_PUBLIC_BUILD_TIME` | No | — | Build timestamp |
| `NEXT_PUBLIC_SENTRY_DSN` | No | — | Sentry DSN for browser errors |

## API Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `4000` | Express listen port |
| `API_BASE_URL` | No | `http://localhost:4000` | Public-facing API URL |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend origin for CORS |
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `LOG_LEVEL` | No | `debug` (dev) / `info` (prod) | `trace` / `debug` / `info` / `warn` / `error` / `fatal` |

## Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `REDIS_TLS` | No | `false` | Enable TLS for Redis |

## Sentry (Error Tracking)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENTRY_DSN` | No | — | Sentry DSN for API errors |
| `SENTRY_ENVIRONMENT` | No | `development` | Environment tag |

## SMTP / Email

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMTP_HOST` | No | — | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | `noreply@example.com` | Sender email address |

## Web Push (VAPID)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VAPID_PUBLIC_KEY` | Push | — | VAPID public key |
| `VAPID_PRIVATE_KEY` | Push | — | VAPID private key |
| `VAPID_SUBJECT` | Push | — | VAPID subject (mailto:) |

## LiveKit (WebRTC)

| Variable | Required | Default | Description |
|---|---|---|---|
| `LIVEKIT_API_KEY` | Calls | — | LiveKit API key |
| `LIVEKIT_API_SECRET` | Calls | — | LiveKit API secret |
| `LIVEKIT_HOST` | Calls | `http://localhost:7880` | LiveKit server URL |

## JWT

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | No | — | Custom JWT secret (min 32 chars) |

## Rate Limiting

| Variable | Required | Default | Description |
|---|---|---|---|
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Window in ms |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

## File Uploads

| Variable | Required | Default | Description |
|---|---|---|---|
| `MAX_FILE_SIZE_MB` | No | `50` | Max upload size in MB |
| `UPLOAD_TTL_SECONDS` | No | `3600` | Signed URL TTL |

## Infrastructure (Terraform / Cloudflare / DigitalOcean)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DO_API_TOKEN` | Infra | — | DigitalOcean API token |
| `CF_API_TOKEN` | Infra | — | Cloudflare API token |
| `CF_ZONE_ID` | Infra | — | Cloudflare zone ID |
| `CF_ORIGIN_CERT` | Infra | — | Cloudflare origin certificate (PEM) |
| `CF_ORIGIN_KEY` | Infra | — | Cloudflare origin key (PEM) |
| `SSH_ALLOWED_IPS` | Infra | — | Comma-separated allowed SSH IPs |
| `ALERT_EMAIL` | Infra | — | Email for infra alerts |
| `AWS_ACCESS_KEY_ID` | Infra | — | AWS access key (Terraform state) |
| `AWS_SECRET_ACCESS_KEY` | Infra | — | AWS secret key (Terraform state) |

## CI/CD — SSH Deploy Keys

| Variable | Required | Default | Description |
|---|---|---|---|
| `CI_SSH_PUBLIC_KEY` | CI | — | Public key for CI SSH |
| `CI_SSH_PRIVATE_KEY` | CI | — | Private key for CI SSH |
| `CI_SSH_FINGERPRINT` | CI | — | SSH key fingerprint |
| `DO_SSH_PRIVATE_KEY` | CI | — | DO droplet SSH private key |
| `DO_SSH_PASSPHRASE` | CI | — | SSH passphrase |

## Docker Compose

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_ORIGIN` | No | `http://api:4000` | Internal Docker network API URL |
