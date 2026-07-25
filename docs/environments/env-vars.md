# Environment Variables

All services validate environment variables via Zod schemas in `packages/config/env-schema.ts`. The root `.env.example` file at the repo root documents all variables; service-specific `.env.example` files in `apps/<service>/` show only what each service needs.

## Validation Schema

Base schema (`packages/config/env-schema.ts`) is shared by API and Worker. Each app may extend it. Variables are validated at startup; malformed or missing required variables cause the process to exit with an error.

## By Service

### API (`apps/api/.env.example`)

| Variable                    | Required | Default                 | Purpose                                  |
| --------------------------- | -------- | ----------------------- | ---------------------------------------- |
| `NODE_ENV`                  | No       | `development`           | Environment mode                         |
| `LOG_LEVEL`                 | No       | `info`                  | Logging verbosity                        |
| `PORT`                      | No       | `4000`                  | Express listen port                      |
| `SUPABASE_URL`              | **Yes**  | —                       | Supabase project URL                     |
| `SUPABASE_ANON_KEY`         | **Yes**  | —                       | Supabase anon/public key                 |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes**  | —                       | Supabase service role key (server-only)  |
| `REDIS_URL`                 | No       | —                       | Redis connection string                  |
| `REDIS_TLS`                 | No       | `false`                 | Use TLS for Redis                        |
| `API_BASE_URL`              | No       | `http://localhost:4000` | Public-facing API URL (links, CORS)      |
| `FRONTEND_URL`              | No       | `http://localhost:3000` | Frontend origin (CORS)                   |
| `SENTRY_DSN`                | No       | —                       | Sentry error tracking DSN                |
| `SENTRY_ENVIRONMENT`        | No       | —                       | Sentry environment tag                   |
| `SMTP_HOST`                 | No       | —                       | SMTP server for email                    |
| `SMTP_PORT`                 | No       | —                       | SMTP port                                |
| `SMTP_USER`                 | No       | —                       | SMTP username                            |
| `SMTP_PASS`                 | No       | —                       | SMTP password                            |
| `SMTP_FROM`                 | No       | —                       | Sender email address                     |
| `VAPID_PUBLIC_KEY`          | No       | —                       | Web push VAPID public key                |
| `VAPID_PRIVATE_KEY`         | No       | —                       | Web push VAPID private key               |
| `VAPID_SUBJECT`             | No       | —                       | VAPID subject (mailto URI)               |
| `LIVEKIT_API_KEY`           | No       | —                       | LiveKit WebRTC API key                   |
| `LIVEKIT_API_SECRET`        | No       | —                       | LiveKit WebRTC API secret                |
| `LIVEKIT_HOST`              | No       | `http://localhost:7880` | LiveKit server URL                       |
| `JWT_SECRET`                | No       | —                       | JWT signing secret (min 32 chars if set) |
| `RATE_LIMIT_WINDOW_MS`      | No       | `60000`                 | Rate limit window in ms                  |
| `RATE_LIMIT_MAX_REQUESTS`   | No       | `100`                   | Max requests per window                  |
| `MAX_FILE_SIZE_MB`          | No       | `50`                    | Max upload file size in MB               |
| `UPLOAD_TTL_SECONDS`        | No       | `3600`                  | Signed upload URL TTL                    |

### Web (`apps/web/.env.example`)

| Variable                        | Required | Default                  | Purpose                             |
| ------------------------------- | -------- | ------------------------ | ----------------------------------- |
| `NEXT_PUBLIC_API_URL`           | **Yes**  | `http://localhost:4000`  | API URL for client-side requests    |
| `NEXT_PUBLIC_APP_URL`           | **Yes**  | `http://localhost:3000`  | App URL for links and redirects     |
| `NEXT_PUBLIC_SUPABASE_URL`      | **Yes**  | `http://localhost:54321` | Supabase URL for client-side SDK    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes**  | —                        | Supabase anon key for client-side   |
| `NEXT_PUBLIC_SENTRY_DSN`        | No       | —                        | Sentry error tracking (client-side) |
| `NEXT_PUBLIC_APP_VERSION`       | No       | —                        | App version (injected at build)     |
| `NEXT_PUBLIC_GIT_SHA`           | No       | —                        | Git SHA (injected at build)         |
| `NEXT_PUBLIC_BUILD_TIME`        | No       | —                        | Build timestamp (injected at build) |

### Worker (`apps/worker/.env.example`)

| Variable                    | Required | Default | Purpose                             |
| --------------------------- | -------- | ------- | ----------------------------------- |
| `SUPABASE_URL`              | **Yes**  | —       | Supabase project URL                |
| `SUPABASE_ANON_KEY`         | **Yes**  | —       | Supabase anon key                   |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes**  | —       | Supabase service role key           |
| `REDIS_URL`                 | **Yes**  | —       | Redis connection for BullMQ         |
| `LOG_LEVEL`                 | No       | `debug` | Logging verbosity                   |
| `PORT`                      | No       | `4100`  | Health check HTTP port              |
| `SENTRY_DSN`                | No       | —       | Sentry error tracking               |
| `VAPID_PUBLIC_KEY`          | No       | —       | Web push VAPID public key           |
| `VAPID_PRIVATE_KEY`         | No       | —       | Web push VAPID private key          |
| `SMTP_HOST`                 | No       | —       | SMTP server for email notifications |
| `SMTP_PORT`                 | No       | `587`   | SMTP port                           |
| `SMTP_USER`                 | No       | —       | SMTP username                       |
| `SMTP_PASS`                 | No       | —       | SMTP password                       |
| `SMTP_FROM`                 | No       | —       | Sender email                        |

## Infrastructure Variables

These are only needed for CI/CD and Terraform, not for local development:

| Variable                | Purpose                                |
| ----------------------- | -------------------------------------- |
| `DO_API_TOKEN`          | DigitalOcean API token                 |
| `CF_API_TOKEN`          | Cloudflare API token                   |
| `CF_ZONE_ID`            | Cloudflare DNS zone ID                 |
| `CF_ORIGIN_CERT`        | Cloudflare origin cert (PEM)           |
| `CF_ORIGIN_KEY`         | Cloudflare origin key (PEM)            |
| `SSH_ALLOWED_IPS`       | Comma-separated allowed SSH IPs        |
| `ALERT_EMAIL`           | Email for infrastructure alerts        |
| `AWS_ACCESS_KEY_ID`     | AWS key for Terraform state backend    |
| `AWS_SECRET_ACCESS_KEY` | AWS secret for Terraform state backend |
| `SUPABASE_PROJECT_REF`  | Supabase project ref ID (CI)           |
| `SUPABASE_DB_PASSWORD`  | DB password for migrations (CI)        |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token (CI)             |
| `CI_SSH_PUBLIC_KEY`     | Public key for CI SSH                  |
| `CI_SSH_PRIVATE_KEY`    | Private key for CI SSH                 |
| `CI_SSH_FINGERPRINT`    | SSH key fingerprint                    |
| `DO_SSH_PRIVATE_KEY`    | Droplet SSH private key                |
| `DO_SSH_PASSPHRASE`     | SSH key passphrase                     |
