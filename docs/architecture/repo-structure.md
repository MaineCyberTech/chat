# Repository Structure

```
chat/
├── apps/
│   ├── api/                          # Express.js API server
│   │   ├── src/
│   │   │   ├── config/env.ts         # Zod-validated env config
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts         # Structured logger
│   │   │   │   └── supabase.ts       # Supabase client init
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.ts  # Centralized error handler
│   │   │   │   ├── rate-limit.ts     # Rate limiter (5 tiers)
│   │   │   │   ├── request-id.ts     # Request ID injection
│   │   │   │   └── require-permission.ts  # RBAC permission check
│   │   │   ├── modules/              # 27 API modules
│   │   │   │   ├── admin/            # System stats, user/channel management
│   │   │   │   ├── ai/               # AI rewrite actions
│   │   │   │   ├── announcements/    # Global announcement banners
│   │   │   │   ├── audit/            # Audit log API
│   │   │   │   ├── auth/             # Session, profile, status, OAuth
│   │   │   │   ├── channels/         # Channel CRUD, DMs, bookmarks, categories
│   │   │   │   ├── consent/          # GDPR consent logging
│   │   │   │   ├── emoji/            # Emoji data
│   │   │   │   ├── export/           # GDPR/data export endpoints
│   │   │   │   ├── feature-flags/    # Feature flag toggles
│   │   │   │   ├── groups/           # Sidebar user groups
│   │   │   │   ├── health/           # Health check module
│   │   │   │   ├── import/           # Bulk CSV/JSON import
│   │   │   │   ├── livekit/          # LiveKit WebRTC tokens
│   │   │   │   ├── messages/         # Messages with pin, flag, forward, edit history
│   │   │   │   ├── notifications/    # Push subscriptions, preferences, sounds
│   │   │   │   ├── openapi/          # OpenAPI spec serving endpoint
│   │   │   │   ├── preferences/      # Per-channel notification prefs
│   │   │   │   ├── reactions/        # Message reactions
│   │   │   │   ├── read-receipts/    # Message read tracking
│   │   │   │   ├── scheduled-posts/  # Send scheduling
│   │   │   │   ├── sidebar/          # Sidebar categories + assignments
│   │   │   │   ├── status/           # User status + auto-responder
│   │   │   │   ├── threads/          # Thread replies
│   │   │   │   ├── user-groups/      # User group CRUD
│   │   │   │   ├── webhooks/         # Webhook delivery pipeline
│   │   │   │   └── workspaces/       # Workspace CRUD + members
│   │   │   ├── route-registry.ts     # Centralized route registry
│   │   │   ├── app.ts                # Express app factory
│   │   │   └── server.ts             # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                          # Next.js App Router
│   │   ├── app/
│   │   │   ├── (auth)/               # Auth routes (login, register, verify)
│   │   │   ├── (workspace)/          # Workspace routes (chat, admin, settings, search)
│   │   │   ├── api/v1/               # BFF proxy layer
│   │   │   ├── globals.css           # Tailwind + base styles + CSS variables
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── page.tsx              # Home page
│   │   ├── components/
│   │   │   ├── auth/                 # Login form, auth hooks
│   │   │   ├── channel/              # Channel-specific components
│   │   │   ├── chat/                 # Message list, input, thread, emoji picker, search
│   │   │   ├── groups/               # User group management
│   │   │   ├── home/                 # Home page components
│   │   │   ├── media/                # File preview, image viewer
│   │   │   ├── notifications/        # Notification bell, preferences modal
│   │   │   ├── pwa/                  # PWA install prompt, service worker
│   │   │   ├── shared/               # Shared components (profile popover, status modal)
│   │   │   └── workspace/            # App sidebar, team sidebar, onboarding
│   │   ├── lib/
│   │   │   ├── api.ts                # API client with auth
│   │   │   ├── auth-context.tsx      # React auth context
│   │   │   ├── env.ts                # Client env validation
│   │   │   ├── i18n/                 # i18n with 250+ keys, 16 categories
│   │   │   └── slash-commands.ts     # Slash command definitions
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   └── tsconfig.json
│   │
│   └── worker/                       # BullMQ worker service
│       ├── src/
│       │   ├── processors/           # 6 job processors
│       │   │   ├── cleanup.ts        # Old deliveries, dead letters, consent logs
│       │   │   ├── data-retention.ts # Messages, audit logs, channels, workspaces
│       │   │   ├── notification.ts   # In-app, push (VAPID), email (Nodemailer)
│       │   │   ├── reminder.ts       # Due reminders polling
│       │   │   ├── search-indexer.ts # Async tsvector indexing
│       │   │   └── webhook-delivery.ts  # HMAC, SSRF, circuit breaker, DLQ
│       │   ├── scheduler.ts          # BullMQ scheduler setup
│       │   └── server.ts             # Worker entry point
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── config/                       # Shared config (ESLint, TypeScript)
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── db/                           # Database package
│   │   ├── src/
│   │   │   ├── config.ts             # Supabase client factory
│   │   │   ├── types.ts              # Database types
│   │   │   ├── permissions.ts        # RBAC (18 permissions x 3 roles)
│   │   │   ├── stores/               # Store abstraction layer
│   │   │   │   ├── channel-store.ts
│   │   │   │   ├── message-store.ts
│   │   │   │   ├── workspace-store.ts
│   │   │   │   ├── reaction-store.ts
│   │   │   │   └── notification-store.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sdk/                          # Client SDK
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── channels.ts
│   │   │   ├── messages.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                           # Shared UI components (11 components)
│       ├── src/
│       │   ├── components/
│       │   │   ├── avatar.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── button.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── empty-state.tsx
│       │   │   ├── input.tsx
│       │   │   ├── screen-reader-only.tsx
│       │   │   ├── sidebar-group.tsx
│       │   │   ├── skeleton.tsx
│       │   │   ├── status-badge.tsx
│       │   │   ├── theme-toggle.tsx
│       │   │   ├── toast.tsx
│       │   │   └── toggle-row.tsx
│       │   ├── tokens/
│       │   │   ├── semantic-colors.ts
│       │   │   └── spacing.ts
│       │   ├── index.ts
│       │   └── styles.css
│       ├── package.json
│       └── tsconfig.json
│
├── infra/
│   ├── docker/                       # Docker + Caddy
│   │   ├── Caddyfile
│   │   ├── Caddyfile.prod
│   │   ├── docker-compose.devremote.yml
│   │   ├── docker-compose.prod.yml
│   │   └── .env.*.example
│   │
│   └── terraform/                    # Terraform provisioning
│       ├── templates/
│       │   └── cloud-init.yaml.tftpl
│       ├── main.tf / variables.tf / outputs.tf
│       └── terraform.tfvars.example
│
├── tests/
│   ├── e2e/                          # Playwright tests
│   ├── integration/                  # Integration tests
│   └── setup/                        # Vitest setup
│
├── supabase/
│   ├── config.toml                   # Local Supabase config
│   ├── migrations/                   # SQL migrations (49 + rollbacks)
│   ├── rollback/                     # Down migration scripts
│   ├── policies/                     # RLS policies
│   └── seeds/                        # Seed data
│
├── .github/
│   ├── workflows/                    # 22 CI/CD workflows
│   │   ├── audit-*.yml               # 7 audit workflows
│   │   ├── ci.yml / validate.yml     # Core CI
│   │   ├── build-push.yml            # Docker image build
│   │   ├── deploy-development.yml    # Development deploy
│   │   ├── deploy-production.yml     # Production deploy
│   │   ├── seed-database.yml         # Database seeding
│   │   ├── supabase-migrations.yml   # Migration push
│   │   ├── load-test.yml             # k6 load testing
│   │   ├── infra-development.yml     # Terraform provisioning
│   │   ├── hardening*.yml            # 2 hardening workflows
│   │   ├── governance.yml            # Policy enforcement
│   │   ├── platform.yml              # Platform orchestration
│   │   ├── stale.yml                 # Stale issue management
│   │   └── chaos-tests.yml           # Chaos engineering
│   ├── CODEOWNERS
│   ├── pull_request_template.md
│   └── dependabot.yml
│
├── docs/                             # Documentation
│   ├── api/                          # API docs + OpenAPI spec
│   ├── architecture/                 # Architecture docs
│   ├── audits/                       # All audit reports
│   ├── compliance/                   # Compliance docs
│   ├── operations/                   # Operations docs
│   ├── runbooks/                     # Incident runbooks
│   └── contributing/
│
├── scripts/                          # Dev tooling + audit pipeline
│   ├── setup-dev.ps1
│   ├── setup-dev.sh
│   ├── teardown-dev.ps1
│   ├── audits/                       # Audit execution scripts
│   ├── hardening/                    # Hardening analysis pipeline
│   └── prompts/                      # Audit prompt templates
│
├── hardening/                        # Hardening analysis artifacts
│   ├── baselines/
│   ├── exceptions/
│   ├── history/
│   ├── policies/
│   └── rules/
│
├── root config files
│   ├── AGENTS.md                     # Architecture & implementation status
│   ├── CHANGELOG.md
│   ├── README.md
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── tsconfig.base.json
│   ├── eslint.config.mjs
│   ├── .prettierrc.json
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   └── .gitignore / .editorconfig / .npmrc / .nvmrc / .gitattributes
│
└── .husky/                           # Git hooks
    └── pre-commit
```
