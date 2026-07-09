# Phase 1: Deep Inventory — Comparative Audit

## Pre-Flight Validation

| Repo       | Path                        | Exists |
| ---------- | --------------------------- | ------ |
| Mattermost | `C:\temp\mattermost-master` | ✅ Yes |
| Chat       | `C:\temp\chat`              | ✅ Yes |

---

## Mattermost Master — Full Inventory

### Top-Level Structure (24 entries)

| Entry        | Type | Description                                         |
| ------------ | ---- | --------------------------------------------------- |
| `api/`       | dir  | OpenAPI v4 spec, server (Go), playbooks             |
| `server/`    | dir  | Go backend (channels, platform, enterprise, cmd)    |
| `webapp/`    | dir  | React frontend (channels, platform packages)        |
| `e2e-tests/` | dir  | Cypress + Playwright tests                          |
| `docs/`      | dir  | API docs, development docs, site                    |
| `.github/`   | dir  | 41 CI/CD workflows                                  |
| `tools/`     | dir  | Custom Go tools (govet, mmgotool)                   |
| `build/`     | dir  | (part of server/build) Docker, release              |
| `config/`    | dir  | (part of server/config) Config store                |
| `scripts/`   | dir  | (part of server/scripts) DB, deploy scripts         |
| Root files   |      | `go.mod`, `Makefile`, `.nvmrc`, `SECURITY.md`, etc. |

### Server (`server/`) — Go Backend

```
server/
├── channels/         # Main application layer
│   ├── api4/         # 167 files — REST handlers (REST API v4)
│   ├── app/          # 293 files — Business logic layer
│   ├── store/        # Data access (sqlstore, cachelayer, etc.)
│   ├── db/           # DB migrations (postgres)
│   ├── web/          # HTTP handlers (OAuth, SAML, webhooks)
│   ├── wsapi/        # WebSocket API (5 files)
│   ├── jobs/         # Background job infrastructure (47 job dirs)
│   ├── audit/        # Audit logging
│   ├── utils/        # Shared utilities
│   └── manualtesting/ # Manual test helpers
├── platform/         # Shared platform services
│   ├── services/     # 11 service dirs (cache, search, imageproxy, telemetry, etc.)
│   └── shared/       # 5 shared libs (filestore, mail, mfa, templates, web)
├── enterprise/       # Enterprise features
│   ├── elasticsearch/
│   ├── message_export/
│   └── metrics/
├── cmd/              # CLI entry points
│   ├── mattermost/   # Server binary
│   └── mmctl/        # Management CLI
├── config/           # Config management (file, DB, env, memory stores)
├── build/            # Dockerfiles, compose files, release scripts
├── public/           # Public Go modules
│   ├── model/        # 291 files — Data model types
│   ├── plugin/       # Plugin SDK (36 files)
│   └── shared/       # Shared model utilities
├── i18n/             # 55 locale files
├── templates/        # 49 email/notification templates (HTML + MJML)
├── scripts/          # DB, CI, test scripts
├── fips/             # FIPS compliance
├── einterfaces/      # Enterprise interfaces (24 files)
├── fonts/            # Font files
└── tests/            # Integration tests
```

### Webapp (`webapp/`) — React Frontend

```
webapp/
├── channels/         # Main channel UI
│   └── src/
│       ├── components/    # 358 component directories
│       ├── actions/       # 47 action files (Redux thunks)
│       ├── reducers/      # Redux reducers
│       ├── selectors/     # 36 selector files
│       ├── store/         # Redux store config
│       ├── utils/         # 130 utility files
│       ├── hooks/         # 17 custom hooks
│       ├── i18n/          # 68 locale files
│       ├── sounds/        # 10 notification sounds
│       ├── plugins/       # Plugin infrastructure
│       ├── sass/          # Stylesheets
│       ├── fonts/         # Fonts
│       └── images/        # Images
├── platform/         # Shared platform packages
│   ├── components/   # Shared UI components
│   ├── client/       # API client
│   ├── mattermost-redux/ # Redux state management
│   ├── shared/       # Shared utilities
│   └── types/        # TypeScript types
```

### API Spec (`api/`)

```
api/
├── v4/              # OpenAPI v4 specs (html, source)
├── server/          # Go API server (main.go)
└── playbooks/       # Playbook API specs
```

### E2E Tests (`e2e-tests/`)

```
e2e-tests/
├── playwright/      # Playwright test suite (21 entries)
├── cypress/         # Cypress test suite (15 entries)
└── .ci/             # CI helpers
```

### CI/CD (`.github/`)

- **41 workflow files** including:
  - `server-ci.yml`, `webapp-ci.yml` — main CI
  - `e2e-tests-ci.yml`, `e2e-tests-playwright.yml`, `e2e-tests-cypress.yml`
  - `codeql-analysis.yml`, `scorecards-analysis.yml`
  - `i18n-ci-pr.yml`, `sentry.yaml`
  - `build-server-image.yml`, `docker-push-mirrored.yml`
  - `mmctl-test-template.yml`, `tools-ci.yml`
  - `pr-test-analysis.yml`, `pr-test-analysis-override.yml`
  - `docs-impact-review.yml`, `docs-needed.yml`
  - `migration-automation.yml`, `tag-public-module.yaml`
- `dependabot.yml`, `codecov.yml`, `holopin.yml`

### Key Files

- `go.mod` / `go.sum` — Go module deps
- `Makefile` — Build system (root + server + webapp)
- `package.json` — JS deps (webapp)
- `.nvmrc`, `.editorconfig`, `.gitpod.yml`, `.yamllint`

---

## Chat Repo — Full Inventory

### Top-Level Structure (50 entries)

| Entry         | Type | Description                                                     |
| ------------- | ---- | --------------------------------------------------------------- |
| `apps/`       | dir  | Application packages (api, web, worker)                         |
| `packages/`   | dir  | Shared packages (db, ui, sdk, config)                           |
| `infra/`      | dir  | Docker + Terraform infrastructure                               |
| `scripts/`    | dir  | 39 dev/tooling scripts                                          |
| `supabase/`   | dir  | Supabase config, migrations, policies, seeds                    |
| `tests/`      | dir  | E2E, integration, k6, chaos tests                               |
| `hardening/`  | dir  | Hardening analysis artifacts                                    |
| `docs/`       | dir  | Architecture, audits, runbooks, security docs                   |
| `.github/`    | dir  | 20 CI/CD workflows                                              |
| `.storybook/` | dir  | Storybook config                                                |
| Root files    |      | `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, etc. |

### Apps (`apps/`) — Turborepo Applications

```
apps/
├── api/                  # Express API server
│   └── src/
│       ├── modules/      # 24 domain modules
│       │   ├── admin/        # Admin routes
│       │   ├── audit/        # Audit log API
│       │   ├── auth/         # Magic link auth
│       │   ├── channels/     # Channel CRUD
│       │   ├── consent/      # Consent logging
│       │   ├── emoji/        # Emoji management
│       │   ├── export/       # Data export
│       │   ├── feature-flags/# Feature flags
│       │   ├── groups/       # User groups
│       │   ├── health/       # Health check
│       │   ├── import/       # Data import
│       │   ├── livekit/      # WebRTC
│       │   ├── messages/     # Message CRUD + pin/flag/edit
│       │   ├── notifications/# Push notifications
│       │   ├── openapi/      # OpenAPI docs
│       │   ├── preferences/  # User preferences
│       │   ├── reactions/    # Emoji reactions
│       │   ├── scheduled-posts/ # Scheduled messages
│       │   ├── sidebar/      # Sidebar categories
│       │   ├── status/       # User status
│       │   ├── threads/      # Threaded conversations
│       │   ├── user-groups/  # User group management
│       │   ├── webhooks/     # Webhooks
│       │   └── workspaces/   # Workspace CRUD
│       ├── middleware/    # 16 middleware files
│       ├── lib/           # 17 shared lib files
│       ├── services/      # Service layer
│       ├── validators/    # 8 validator files
│       ├── config/        # API config
│       ├── app.ts         # Express app setup
│       ├── server.ts      # Server startup
│       └── route-registry.ts # Centralized route registry
├── web/                  # Next.js 15 frontend
│   ├── app/              # App Router pages
│   │   ├── (auth)/       # Auth layout + login
│   │   ├── (workspace)/  # Workspace layout + [workspaceSlug] routes
│   │   ├── auth/         # Auth callbacks + verify
│   │   ├── install/      # Installation page
│   │   └── pl/           # Polish locale
│   ├── components/       # 12 component dirs
│   │   ├── chat/         # 19 chat components
│   │   ├── channel/      # Channel list, create dialog
│   │   ├── shared/       # Shared components (error-boundary, shortcuts, etc.)
│   │   ├── workspace/    # Sidebar, team sidebar, onboarding
│   │   ├── home/         # Landing shell
│   │   ├── media/        # Media room
│   │   ├── auth/         # Auth components
│   │   ├── notifications/# Notification UI
│   │   └── pwa/          # PWA components
│   ├── lib/              # 15 shared libs
│   │   ├── supabase/     # Supabase client
│   │   ├── i18n/         # i18n (en.json)
│   │   ├── emoji/        # Emoji data
│   │   ├── optimistic/   # Optimistic UI
│   │   └── pwa/          # PWA utilities
│   └── e2e/              # 3 E2E test files
└── worker/               # BullMQ worker
    └── src/
        ├── processors/   # 6 processors
        ├── queues/       # Queue definitions
        └── lib/          # Worker utilities
```

### Packages (`packages/`) — Shared Libraries

```
packages/
├── config/         # Shared config (env-schema, errors, logger, date utils)
├── db/             # Supabase client + types + stores
│   └── src/
│       ├── stores/       # 6 store interfaces
│       ├── permissions.ts # RBAC permissions (18 perms × 3 roles)
│       └── types.ts
├── sdk/            # Client SDK
│   └── src/        # 10 modules (channels, messages, reactions, etc.)
└── ui/             # Shared UI components
    └── src/
        ├── components/  # 8 components (avatar, badge, button, dialog, etc.)
        ├── tokens/      # Design tokens
        └── hooks/       # Shared hooks
```

### Infrastructure (`infra/`)

```
infra/
├── docker/         # Docker compose (dev, devremote, prod) + Caddyfiles
└── terraform/      # Terraform IaC (DO droplet, DNS, firewall)
```

### Database (`supabase/`)

```
supabase/
├── migrations/     # 53 migration files (sequential)
├── rollback/       # 52 down-migration scripts
├── policies/       # 11 RLS policy files
└── seeds/          # 9 seed data files
```

### CI/CD (`.github/workflows/`)

20 workflow files:

- `ci.yml`, `validate.yml` — Main CI + reusable
- `build-push.yml`, `deploy-development.yml`, `deploy-production.yml`
- `infra-development.yml`
- `supabase-migrations.yml`
- `load-test.yml` — Weekly k6
- `stale.yml`
- 7 audit workflows (`audit-ci`, `audit-pr-gate`, `audit-release-certification`, etc.)
- `hardening-automation-runner.yml`, `hardening.yml`
- `governance.yml`, `platform.yml`
- `environment-promotion-audit.yml`
- `executive-stakeholder-pack.yml`
- `feature-rollout-checkpoint.yml`

### Tests (`tests/`)

```
tests/
├── e2e/            # 6 Playwright spec files
├── integration/    # Integration tests (health)
├── chaos/          # Chaos testing
├── k6/             # Load testing
└── setup/          # Test setup
```

### Scripts (`scripts/`)

39 entries including:

- `setup-dev.ps1`, `teardown-dev.ps1`, `start-local-stack.ps1`
- `engine/` — Audit engine
- `hardening_runner/` — Hardening pipeline
- `hardening/` — Hardening utils
- `audits/` — Audit tooling
- `ai/`, `bot/` — AI/bot scripts
- `compliance/`, `governance/`
- `fix_p0.py`, `fix_p1s.py`, `list_p1.py`, etc.

### Docs (`docs/`)

```
docs/
├── architecture/   # Architecture docs
├── audits/         # Full audit suite (9+ reports)
├── runbooks/       # Operations runbooks
├── security/       # Security docs
├── hardening/      # Hardening docs
├── api-contracts.md
├── supply-chain.md
└── ... (prompts, compliance, legal, etc.)
```

### Key Architectural Patterns

| Aspect         | Pattern                                        |
| -------------- | ---------------------------------------------- |
| **Auth**       | Supabase Auth (magic link), per-request client |
| **Data**       | Supabase (PostgreSQL + RLS)                    |
| **Real-time**  | Socket.io + Redis adapter                      |
| **Background** | BullMQ (Redis)                                 |
| **State**      | React hooks/context (no Redux)                 |
| **Styling**    | Tailwind CSS + design tokens                   |
| **Build**      | Turborepo + pnpm                               |
| **API**        | Express + route-registry pattern               |
| **DB access**  | Store abstraction layer (IChannelStore, etc.)  |
| **Media**      | LiveKit WebRTC                                 |
| **PWA**        | Service worker + push notifications            |
