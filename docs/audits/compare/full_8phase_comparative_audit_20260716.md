# Full 8-Phase Comparative Repo Audit — July 16, 2026

**Reference Repo (A):** `C:\temp\mattermost-master` (Mattermost v11.9.0 — Go backend, React/Redux frontend)  
**Current Repo (B):** `C:\temp\chat` (chat — Next.js 15, Express, Supabase, Turborepo)

---

## Phase 1 — Repo Inventory + Structural Baseline

### 1.1 Repo A Inventory (Reference — Mattermost)

**Top-level structure:**

```
mattermost-master/
├── .github/          # CI/CD workflows, actions, issue/PR templates
├── api/              # Go API server (playbooks, server, v4)
├── docs/             # Documentation site (Docusaurus-based)
├── e2e-tests/        # Cypress + Playwright test suites
├── server/           # Go monolith backend (~2.3M LOC)
├── tools/            # Go tooling (govet, sharedchannel-test)
└── webapp/           # React/Redux frontend (~1.1M LOC)
```

**Server (`server/`) — Go Backend:**

```
server/
├── bin/              # Compiled binaries
├── build/            # Docker, docker-compose-generator, preview, notices
├── channels/         # Core application logic (monolith)
│   ├── api4/         # REST API v4 handlers (150+ files)
│   ├── app/          # Business logic (email, oauth, slashcommands, teams, users, platform, featureflag, etc.)
│   ├── audit/        # Audit logging
│   ├── db/           # Database migrations (embedded Go migrations)
│   ├── jobs/         # 27 job types (active_users, cleanup, export, import, notification, plugins, migration tasks, etc.)
│   ├── store/        # Layered store (sqlstore, localcachelayer, retrylayer, searchlayer, timerlayer)
│   ├── utils/        # File/image/mock utilities
│   ├── web/          # HTTP handlers
│   └── wsapi/        # WebSocket API
├── cmd/              # CLI entry points (mattermost server, mmctl CLI)
├── config/           # Config migrations
├── einterfaces/      # Enterprise interfaces + mocks
├── enterprise/       # Enterprise features: elasticsearch, message_export, metrics
├── fips/             # FIPS compliance
├── fonts/            # Bundled fonts
├── i18n/             # 67 locale files (server-side translations)
├── platform/         # Shared platform services (filestore, mail, mfa, templates, web)
│   ├── services/     # awsmeter, cache, docextractor, imageproxy, marketplace, remotecluster, searchengine, sharedchannel, slackimport, telemetry, upgrader
│   └── shared/       # filestore, mail, mfa, templates, web
├── public/           # Public API model, plugin API, shared utilities
└── tests/            # Test data/exif samples
```

**Webapp (`webapp/`) — React/Redux Frontend:**

```
webapp/
├── channels/         # Main web app
│   ├── src/
│   │   ├── actions/      # Redux actions
│   │   ├── client/       # API client library
│   │   ├── components/   # ~170 component directories (2500+ files, 3194 TSX/TS total)
│   │   ├── fonts/        # Custom fonts
│   │   ├── hooks/        # React hooks
│   │   ├── i18n/         # ~67 locale files (900KB+ each for en.json)
│   │   ├── images/       # SVG icons
│   │   ├── packages/     # Internal packages
│   │   ├── plugins/      # Plugin system
│   │   ├── reducers/     # Redux reducers
│   │   ├── sass/         # SASS stylesheets (Bootstrap 3 based)
│   │   ├── selectors/    # Redux selectors
│   │   ├── sounds/       # Notification sounds
│   │   ├── store/        # Redux store configuration
│   │   ├── stores/       # Zustand stores (newer state management)
│   │   ├── tests/        # Test utilities
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── build/            # Build tooling (emoji processing)
└── platform/         # Shared platform packages
    ├── client/           # API client
    ├── components/       # Shared UI components
    ├── eslint-plugin/    # Custom ESLint rules
    ├── mattermost-redux/ # Redux bindings (legacy)
    ├── shared/           # Shared utilities
    └── types/            # Shared TypeScript types
```

**API (`api/`) — Go API servers:**

```
api/
├── playbooks/        # Playbooks product
├── server/           # API server entry
└── v4/               # v4 API routes (html, source)
```

**E2E Tests (`e2e-tests/`):**

- Cypress tests (100+ integration test directories)
- Playwright tests (functional, visual, accessibility specs)
- Extensive fixture data (files, markdown, images)

**CI/CD (`.github/workflows/`):** ~55 workflow files including:

- `server-ci.yml`, `webapp-ci.yml`, `api.yml` (main CI)
- `e2e-fulltests-ci.yml`, `e2e-tests-ci.yml`, `e2e-tests-playwright.yml`, `e2e-tests-cypress.yml` (4 parallel e2e test matrices)
- `codeql-analysis.yml`, `scorecards-analysis.yml`, `sentry.yaml`
- `i18n-ci-pr.yml`, `docs-impact-review.yml`, `migration-automation.yml`
- `build-server-image.yml`, `docker-push-mirrored.yml`
- Custom composite actions: `calculate-cypress-results`, `calculate-playwright-results`, `runner-prep-openldap`, `save-junit-report-tms`

### 1.2 Repo B Inventory (Current — chat)

**Top-level structure:**

```
chat/
├── .github/              # CI/CD workflows
├── apps/
│   ├── api/              # Express TypeScript API server
│   ├── web/              # Next.js 15 frontend
│   └── worker/           # BullMQ background worker
├── docs/                 # Extensive documentation
├── hardening/            # Hardening analysis artifacts
├── infra/                # Docker compose + Terraform
├── packages/             # Shared monorepo packages
│   ├── config/           # Shared config (env-schema, errors, logger, eslint, tsconfig, vitest)
│   ├── db/               # Supabase client, types, stores
│   ├── sdk/              # API SDK
│   └── ui/               # Design system components (button, dialog, input, avatar, badge, toast, empty-state, etc.)
├── scripts/              # Dev tooling scripts
├── supabase/             # Database migrations, policies, seeds
└── tests/                # Test suites (e2e, integration, chaos, k6)
```

**API (`apps/api/`) — Express TypeScript:**

```
apps/api/src/
├── config/              # Server configuration
├── lib/                 # Server utilities
├── middleware/          # 15 middleware modules
│   ├── authenticate.ts, cache.ts, csrf.ts, deprecation.ts, error-handler.ts
│   ├── input-sanitizer.ts, rate-limit.ts, request-id.ts, request-timeout.ts
│   ├── require-admin.ts, require-membership.ts, require-permission.ts
│   ├── security-headers.ts, validate-string-key.ts, validate-uuid.ts
│   └── __tests__/
├── modules/             # 27 feature modules
│   ├── admin/, ai/, announcements/, audit/, auth/, channels/, consent/
│   ├── emoji/, export/, feature-flags/, groups/, health/, import/
│   ├── livekit/, messages/, notifications/, openapi/, preferences/
│   ├── reactions/, read-receipts/, scheduled-posts/, sidebar/, status/
│   ├── threads/, user-groups/, webhooks/, workspaces/
│   └── Each module: routes.ts, service.ts (where applicable), __tests__/*.test.ts
├── services/            # Shared services
└── validators/          # Zod schemas
```

**Web (`apps/web/`) — Next.js 15:**

```
apps/web/
├── app/                 # Next.js App Router pages
│   ├── (auth)/login/    # Login page
│   ├── (workspace)/[workspaceSlug]/
│   │   ├── admin/, groups/, saved/, scheduled/, search/, settings/, threads/, [channelId]/
│   ├── auth/callback/, auth/verify/
│   ├── install/
│   └── pl/[postId]/
├── components/          # React components (~69 TSX files)
│   ├── auth/            # auth-context, login-form, avatar-upload
│   ├── channel/         # channel-list, create-channel-dialog
│   ├── chat/            # 22 core chat components
│   ├── groups/          # group-modal, user-picker-modal
│   ├── home/            # landing-shell
│   ├── media/           # media-room
│   ├── notifications/   # notification-bell
│   ├── pwa/             # install-prompt, notification-prompt, pwa-provider, update-notification
│   ├── shared/          # error-boundary, keyboard-shortcuts, profile-popover, status-modal
│   └── workspace/       # app-sidebar, create-workspace-dialog, invite-members, onboarding-tour, team-sidebar, workspace-list
├── lib/                 # Client utilities
│   ├── emoji/           # emoji-data.json (3357 emojis)
│   ├── hooks/           # use-click-outside
│   ├── i18n/            # 7 locales (en, de, es, fr, ja, pt-BR)
│   ├── optimistic/      # use-optimistic hook
│   ├── pwa/             # install-state.ts, push-client.ts
│   └── supabase/        # client.ts
└── public/              # Static assets
```

**Worker (`apps/worker/`) — BullMQ:**

```
apps/worker/src/
├── main.ts              # Worker entry point
├── scheduler.ts         # BullMQ scheduler
├── lib/redis.ts         # Redis connection
├── processors/          # 6 processors
│   ├── cleanup.ts, compliance-export.ts, data-retention.ts
│   ├── notification.ts, reminder.ts, search-indexer.ts, webhook-delivery.ts
├── queues/index.ts      # Queue definitions
└── templates/email.ts   # Email templates
```

**Database (`supabase/`):**

```
supabase/
├── migrations/          # 60 forward migrations (timestamped, sequential)
├── rollback/            # 59 down migration scripts (paired with forward)
├── policies/            # 11 RLS policy files
├── seeds/               # 9 seed data files
└── config.toml          # Supabase configuration
```

**Infrastructure (`infra/`):**

```
infra/
├── docker/              # Docker compose files (dev, devremote, prod) + Caddyfiles
└── terraform/           # Terraform IaC (DO droplet, DNS, firewall)
```

**CI/CD (`.github/workflows/`):** 28 workflow files:

- `ci.yml`, `validate.yml` (core CI)
- `build-push.yml`, `deploy-development.yml`, `deploy-production.yml`
- `infra-development.yml`, `supabase-migrations.yml`
- 19 audit workflows: `audit-ci.yml`, `audit-ci-autocommit.yml`, `audit-badges-autocommit.yml`, `audit-pr-gate.yml`, `audit-release-certification.yml`, `environment-promotion-audit.yml`, `executive-stakeholder-pack.yml`, `feature-rollout-checkpoint.yml`, `governance.yml`, `hardening-automation-runner.yml`, `hardening.yml`, `platform.yml`
- `load-test.yml`, `stale.yml`

**Tests (`tests/`):**

```
tests/
├── e2e/                 # Playwright: auth, file-upload, home, messaging, navigation, search
├── integration/         # health.test.ts
├── chaos/scenarios/     # Chaos testing
├── k6/                  # Load testing
└── setup/               # vitest.setup.ts
```

### 1.3 Structural Similarities

| Aspect                         | Similarity                                                            |
| ------------------------------ | --------------------------------------------------------------------- |
| Monorepo structure             | Both organize into apps/services, shared packages                     |
| Separation of API and frontend | Both have distinct API server + web client                            |
| Background job processing      | Mattermost: 27 job types in channels/jobs/; chat: 6 BullMQ processors |
| E2E test frameworks            | Both use Playwright; Mattermost also uses Cypress                     |
| CI/CD via GitHub Actions       | Both heavily use GHA for testing, building, deploying                 |
| Migration strategy             | Both use sequential timestamped migrations                            |
| i18n/locale support            | Both have locale files (67 vs 7)                                      |
| Docker-based deployment        | Both use Docker Compose                                               |
| Middleware pipeline            | Both have auth, rate-limiting, security headers middleware            |

### 1.4 Structural Differences

| Dimension               | Mattermost (Reference)                   | chat (Current)                             |
| ----------------------- | ---------------------------------------- | ------------------------------------------ |
| **Backend language**    | Go (compiled, static)                    | TypeScript/Node.js (interpreted, dynamic)  |
| **Frontend framework**  | React + Redux (legacy patterns)          | Next.js 15 App Router (modern RSCs)        |
| **State management**    | Redux + Zustand                          | React hooks + optimistic updates           |
| **Styling**             | SASS + Bootstrap 3                       | Tailwind CSS + design tokens               |
| **Database**            | PostgreSQL (custom Go migrations)        | Supabase (managed PostgreSQL + RLS)        |
| **Auth**                | Custom JWT + MFA + SAML + OAuth + LDAP   | Supabase Auth (magic link + OAuth)         |
| **API architecture**    | Custom Go HTTP handlers                  | Express with modular route/service pattern |
| **Package manager**     | npm                                      | pnpm                                       |
| **Build system**        | Custom Makefiles/webpack                 | Turborepo                                  |
| **Real-time**           | Custom WebSocket                         | Socket.io + Redis                          |
| **Job system**          | Go goroutine-based workers               | BullMQ with Redis                          |
| **Component count**     | ~170 component directories (2500+ files) | ~69 component files                        |
| **i18n coverage**       | 67 locales                               | 7 locales                                  |
| **Test coverage**       | Extensive (unit + integration + e2e)     | Growing (e2e + integration + chaos)        |
| **Documentation**       | Docusaurus docs site                     | In-repo markdown + runbooks                |
| **IaC**                 | None (manual setup)                      | Terraform (DO droplet)                     |
| **Enterprise features** | Elasticsearch, MFA, SAML, LDAP, plugins  | Not yet implemented                        |
| **Plugin system**       | Full plugin API + marketplace            | None                                       |
| **Migration rollbacks** | Not present                              | 59 paired down migrations                  |
| **RLS policies**        | Application-level auth                   | Database-level RLS                         |
| **Audit pipeline**      | None                                     | 19 audit workflows + hardening tooling     |

### 1.5 Likely Core Systems

**Mattermost:**

- `server/channels/app/` — Core business logic (~30 sub-packages)
- `server/channels/api4/` — REST API v4 (150+ handlers)
- `server/channels/store/` — Data access layer (layered architecture)
- `webapp/channels/src/components/` — UI component library
- `server/channels/jobs/` — Background job system
- `server/enterprise/` — Enterprise features layer

**chat:**

- `apps/api/src/modules/` — API feature modules (27 modules)
- `apps/web/components/chat/` — Core messaging components
- `packages/ui/src/components/` — Design system components
- `packages/db/src/` — Database client and stores
- `apps/worker/src/processors/` — Background job processors
- `apps/api/src/middleware/` — Middleware pipeline (15 modules)
- `supabase/migrations/` — Database schema

### 1.6 Likely Fragile / High-Risk Areas

**Mattermost:**

- Monolithic server structure (tight coupling across channels/app/)
- Legacy Redux patterns (migration to Zustand in progress)
- Bootstrap 3 dependency (end of life)
- Custom WebSocket implementation
- Embedded Go migrations (no rollback)
- Plugin API surface (maintains backward compatibility)

**chat:**

- Supabase dependency (vendor lock-in risk for auth)
- Socket.io scaling (Redis adapter needed for multi-instance)
- Virtual scrolling message list (complex layout constraints documented in AGENTS.md)
- RLS policy performance at scale
- Worker processor reliability (BullMQ dependency on Redis)
- Relatively small test suite for production system

### 1.7 Unknowns / Areas Needing Deeper Inspection

- Mattermost's API client library structure vs chat's SDK package
- Exact Redux store shape in Mattermost vs React state in chat
- Mattermost's WebSocket protocol vs chat's Socket.io event schema
- Schema design differences (table structure, indexing strategy)
- Mattermost's plugin architecture internals
- chat's optimistic update implementation details
- Both repos' error handling strategies at depth
- Mattermost's email template system vs chat's worker email templates

---

## Phase 2 — Feature / Module / Folder Mapping

### 2.1 Mapping Summary

| chat Area                            | Mattermost Equivalent                                             | Mapping Quality                                      |
| ------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/api/src/modules/` (27 modules) | `server/channels/api4/` (150+ files)                              | Direct — both are REST API handlers                  |
| `apps/web/components/chat/`          | `webapp/channels/src/components/`                                 | Direct — both are chat UI components                 |
| `packages/ui/src/components/`        | `webapp/platform/components/`                                     | Direct — shared UI component libraries               |
| `packages/db/`                       | `server/channels/store/`                                          | Direct — data access layers                          |
| `apps/worker/src/processors/`        | `server/channels/jobs/`                                           | Direct — background job processors                   |
| `supabase/migrations/`               | `server/channels/db/migrations/`                                  | Direct — database schema migrations                  |
| `apps/api/src/middleware/`           | (scattered in api4 handlers)                                      | Partial — Mattermost has less middleware abstraction |
| `apps/web/lib/socket.ts`             | `server/channels/wsapi/`                                          | Direct — real-time connections                       |
| `apps/web/lib/i18n/`                 | `webapp/channels/src/i18n/`                                       | Direct — internationalization                        |
| `supabase/policies/`                 | `server/channels/app/platform/` auth                              | Conceptual — RLS vs app-level auth                   |
| `infra/terraform/`                   | (none)                                                            | Missing in Mattermost                                |
| `infra/docker/`                      | `server/build/docker/` + `server/build/docker-compose-generator/` | Partial — more automated in Mattermost               |

### 2.2 Folder-to-Folder Mapping

| Reference (Mattermost)                           | Current (chat)                                           | Notes                 |
| ------------------------------------------------ | -------------------------------------------------------- | --------------------- |
| `server/channels/api4/post.go`                   | `apps/api/src/modules/messages/routes.ts`                | Post/message API      |
| `server/channels/api4/channel.go`                | `apps/api/src/modules/channels/routes.ts`                | Channel API           |
| `server/channels/api4/user.go`                   | `apps/api/src/modules/auth/routes.ts`                    | User/auth API         |
| `server/channels/api4/team.go`                   | `apps/api/src/modules/workspaces/routes.ts`              | Workspace/team API    |
| `server/channels/api4/webhook.go`                | `apps/api/src/modules/webhooks/routes.ts`                | Webhook API           |
| `server/channels/api4/emoji.go`                  | `apps/api/src/modules/emoji/routes.ts`                   | Emoji API             |
| `server/channels/api4/status.go`                 | `apps/api/src/modules/status/routes.ts`                  | Status API            |
| `server/channels/app/`                           | `apps/api/src/modules/*/service.ts`                      | Business logic        |
| `server/channels/store/sqlstore/`                | `packages/db/src/stores/`                                | Database access layer |
| `webapp/channels/src/components/post/`           | `apps/web/components/chat/message-list/message-item.tsx` | Message display       |
| `webapp/channels/src/components/channel_layout/` | `apps/web/components/workspace/app-sidebar.tsx`          | Sidebar layout        |
| `webapp/channels/src/components/channel_header/` | `apps/web/components/chat/chat-view.tsx`                 | Channel header        |
| `webapp/channels/src/components/emoji_picker/`   | `apps/web/components/chat/emoji-picker.tsx`              | Emoji picker          |
| `webapp/channels/src/components/file_preview/`   | `apps/web/components/chat/file-preview.tsx`              | File preview          |
| `webapp/channels/src/components/search_bar/`     | `apps/web/components/chat/search-bar.tsx`                | Search bar            |
| `webapp/platform/components/src/`                | `packages/ui/src/components/`                            | Design system         |
| `server/channels/jobs/`                          | `apps/worker/src/processors/`                            | Background jobs       |
| `server/i18n/` + `webapp/channels/src/i18n/`     | `apps/web/lib/i18n/`                                     | Internationalization  |

### 2.3 Feature-to-Feature Mapping

| Feature               | Mattermost                                                                           | chat                                                          | Parity                            |
| --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------------------------- |
| **Messaging**         | Full (CRUD, edit history, pinning, flagging, reactions, threads, permalinks, search) | Full (same feature set)                                       | ✅ Equivalent                     |
| **Channels**          | Public, private, DM, GM, archived, read-only, bookmarks, member history              | Public, private, DM, GM, read-only, bookmarks, member history | ✅ Equivalent                     |
| **Auth**              | Email/password, OAuth (Google, GitHub, GitLab), SAML, LDAP, MFA                      | Magic link, OAuth (Google, GitHub)                            | Partial (missing SAML, LDAP, MFA) |
| **Real-time**         | Custom WebSocket                                                                     | Socket.io (with Redis adapter)                                | ✅ Equivalent                     |
| **File upload**       | Full (multi-file, preview, zoom, metadata)                                           | Full (same features)                                          | ✅ Equivalent                     |
| **Emoji**             | 3000+ emojis, skin tones, categories, custom emoji                                   | 3357 emojis, skin tones, categories                           | ✅ Equivalent                     |
| **Search**            | Full-text (tsvector), filters, operators                                             | Full-text (tsvector), filters, operators                      | ✅ Equivalent                     |
| **Background jobs**   | 27 job types                                                                         | 6 processor types                                             | Partial                           |
| **Sidebar**           | Categories, drag-drop, unreads, custom order                                         | Categories, drag-drop, unreads, custom order                  | ✅ Equivalent                     |
| **User groups**       | CRUD, permissions                                                                    | CRUD, permissions                                             | ✅ Equivalent                     |
| **Admin panel**       | Full system console                                                                  | Basic admin page                                              | Partial                           |
| **i18n**              | 67 locales                                                                           | 7 locales                                                     | Partial                           |
| **Plugin system**     | Full plugin API + marketplace                                                        | None                                                          | ❌ Missing                        |
| **MFA**               | TOTP + backup codes                                                                  | None                                                          | ❌ Missing                        |
| **Elasticsearch**     | Enterprise search engine integration                                                 | None                                                          | ❌ Missing                        |
| **Compliance export** | Message export, audit export                                                         | Basic compliance exports                                      | Partial                           |
| **Onboarding**        | Task list, tour tips                                                                 | Task list, tour tips                                          | ✅ Equivalent                     |
| **Slash commands**    | 20+ built-in commands                                                                | 7 commands                                                    | Partial                           |
| **Webhooks**          | Incoming + outgoing + re-usable                                                      | Incoming + outgoing                                           | ✅ Equivalent                     |
| **Rate limiting**     | Per-endpoint configurable                                                            | Per-endpoint middleware                                       | ✅ Equivalent                     |
| **Audit logging**     | Audit table + API                                                                    | Full audit log + API                                          | ✅ Equivalent                     |
| **Mobile**            | React Native app                                                                     | PWA with responsive design                                    | Conceptual                        |
| **Desktop app**       | Electron app                                                                         | PWA only                                                      | ❌ Missing                        |

### 2.4 Naming and Organizational Mismatches

| Difference                                                                                            | Impact                                               |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Mattermost uses "team" / chat uses "workspace"                                                        | Conceptual equivalent, different terminology         |
| Mattermost uses "post" / chat uses "message"                                                          | Same concept, different naming convention            |
| Mattermost scatters API handlers by resource / chat groups by module with routes+service+test pattern | chat's organization is cleaner                       |
| Mattermost DB migrations embedded in Go / chat uses standalone SQL files                              | chat's approach is more portable                     |
| Mattermost has `enterprise/` layer / chat has no equivalent                                           | chat's codebase is smaller and lacks enterprise tier |
| Mattermost's components are deeply nested (170 dirs) / chat's are flat per area                       | chat's flat structure is simpler                     |

### 2.5 Missing in Current Repo (chat)

1. **Plugin system** — No plugin API, plugin marketplace, or plugin hook system
2. **MFA/2FA** — No TOTP, backup codes, or enforcement
3. **SAML/OIDC SSO** — No enterprise SSO support
4. **LDAP directory sync** — No LDAP integration
5. **Elasticsearch** — No search engine plugin
6. **Desktop app** — No Electron/Tauri wrapper
7. **GIF picker** — No GIPHY integration
8. **Compliance export** — Basic implementation, less mature than Mattermost
9. **Boards/playbooks** — No kanban or project management
10. **Bot accounts** — No bot API or framework
11. **Advanced text editor** — TipTap present but Mattermost has more extensions (tables, etc.)

### 2.6 Missing in Reference Repo (Mattermost)

1. **Migration rollbacks** — No down migration scripts (risk in Mattermost)
2. **Terraform IaC** — No infrastructure-as-code
3. **Design tokens** — No centralized design token system
4. **PWA support** — No service worker or push notifications
5. **Optimistic UI** — Redux architecture makes this harder
6. **Audit pipeline** — 19 GHA audit workflows (none in Mattermost)
7. **RLS policies** — Application-level auth instead of database-level
8. **BFF layer** — No backend-for-frontend pattern
9. **Storybook** — No component documentation
10. **Hardening tooling** — No automated hardening/supply chain analysis

### 2.7 Areas Conceptually Similar but Architecturally Different

| Area                    | Mattermost                                           | chat                                                           | Key Difference                      |
| ----------------------- | ---------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| **State management**    | Redux (global store, actions, reducers, selectors)   | React hooks + optimistic updates (local state)                 | Fundamental paradigm difference     |
| **Styling system**      | SASS with Bootstrap 3 (CSS classes, theme variables) | Tailwind CSS + design tokens (utility-first, CSS-in-JS tokens) | Completely different approach       |
| **Authorization**       | Application-level middleware + permission checks     | Database RLS + middleware checks                               | chat is more secure by default      |
| **API structure**       | Flat Go handlers in api4/                            | Modular routes/service/test per feature                        | chat is more maintainable           |
| **Database migrations** | Embedded Go (mixed versions, no rollback)            | Standalone SQL with paired down migrations                     | chat has better migration hygiene   |
| **Job system**          | Go goroutines with custom scheduling                 | BullMQ with Redis (proven queue system)                        | chat uses industry-standard pattern |

### 2.8 Areas Cannot Yet Be Reliably Mapped

- Exact Redux store shape vs React hook state structure
- Mattermost's WebSocket message protocol vs chat's Socket.io event names
- Mattermost's email template rendering vs chat's worker email templates
- Specific Zod validation schemas in chat vs Mattermost's input validation approach

---

## Phase 3 — Best Implementations, Strengths, Weaknesses, and Efficiency Opportunities

### 3.1 Overall Comparative Judgment

**chat is architecturally superior; Mattermost has greater feature breadth and maturity.**

The current repo (chat) was built with modern best practices from the ground up: Turborepo, Next.js 15 App Router, Tailwind CSS, Supabase RLS, BullMQ, Socket.io, pnpm, and Terraform. Mattermost is a 10+ year old codebase that has accumulated significant technical debt (Bootstrap 3, Redux, custom WebSocket, no IaC, no migration rollbacks).

However, Mattermost has invested heavily in feature completeness: 67 locales, 27 job types, plugin system, enterprise auth (SAML/LDAP/MFA), Elasticsearch, desktop app, and deep test coverage across 55 CI workflows.

### 3.2 Best Implementations in Reference Repo Worth Considering

| Pattern                                                          | Classification     | Rationale                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Job system breadth** (27 job types)                            | Adapt conceptually | chat only has 6 processors; Mattermost's job patterns (export, import, cleanup, notification, migration) demonstrate desirable scope                   |
| **E2E test depth** (Cypress + Playwright, 100+ test directories) | Adapt conceptually | chat's e2e tests are thin (6 spec files); Mattermost's coverage of features like emoji, keyboard shortcuts, channels, file attachments is aspirational |
| **Plugin system architecture**                                   | Not worth porting  | Premature for chat's current stage; would introduce significant maintenance burden                                                                     |
| **Enterprise auth (SAML/LDAP/MFA)**                              | Adapt conceptually | Important for enterprise adoption, but requires careful implementation                                                                                 |
| **Desktop app**                                                  | Not worth porting  | PWA is sufficient for current needs; Electron introduces bundle size and maintenance cost                                                              |
| **i18n depth** (67 locales)                                      | Adapt conceptually | Phased expansion from 7 locales is appropriate; no need to match 67 immediately                                                                        |
| **Notification sound variety** (9 sounds)                        | Copy as-is         | Already implemented in chat ✅                                                                                                                         |
| **GIF picker integration**                                       | Adapt conceptually | Low-risk addition with GIPHY API                                                                                                                       |

### 3.3 Best Implementations in Current Repo That Should Stay

| Pattern                           | Rationale                                                                 |
| --------------------------------- | ------------------------------------------------------------------------- |
| **Turborepo + pnpm**              | Faster, more cacheable builds than Mattermost's webpack + npm             |
| **Tailwind CSS + design tokens**  | More maintainable than SASS + Bootstrap 3                                 |
| **Next.js App Router**            | Modern RSCs, better performance than React-Redux SPA                      |
| **Supabase RLS**                  | Declarative tenant isolation at DB level (more secure than app-level)     |
| **Socket.io + Redis**             | More reliable than custom WebSocket; handles reconnection, rooms, adapter |
| **BullMQ workers**                | Industry-standard job queue with retries, DLQ, scheduling                 |
| **Migration rollbacks**           | 59 down migration scripts — critical safety net Mattermost lacks          |
| **Terraform IaC**                 | Reproducible infrastructure provisioning                                  |
| **Design system (packages/ui)**   | Single source of truth for components with Storybook                      |
| **Optimistic UI hooks**           | Better user experience than Redux thunks                                  |
| **PWA support**                   | No native app needed for mobile/desktop use                               |
| **Audit pipeline (19 workflows)** | Automated security/supply chain/compliance verification                   |
| **BFF layer**                     | API gateway pattern protects backend from direct exposure                 |
| **Middleware pipeline**           | 15 focused middleware modules (mattermost has ad-hoc patterns)            |

### 3.4 Efficiency Opportunities

| Opportunity                     | Repo | Description                                                                                   | Classification        |
| ------------------------------- | ---- | --------------------------------------------------------------------------------------------- | --------------------- |
| **Consolidate emoji data**      | chat | emoji-data.json + emoji-data.ts may have duplication                                          | Keep current          |
| **Message input decomposition** | Both | chat's message-input.tsx is large; Mattermost splits into textbox, advanced_text_editor, etc. | Adapt conceptually    |
| **CSS variable consolidation**  | chat | Already done (264 replacements across 61 files) ✅                                            | Keep current          |
| **Test coverage expansion**     | chat | Unit tests exist per module but e2e coverage is thin                                          | Adapt from Mattermost |
| **Worker processor expansion**  | chat | Grow from 6 to 12+ processors following Mattermost job patterns                               | Adapt conceptually    |
| **Cache layer**                 | chat | No caching layer; Mattermost has localcachelayer + searchlayer                                | Adapt conceptually    |
| **Error standardization**       | chat | Already has structured error subclasses ✅                                                    | Keep current          |

### 3.5 Quality Gaps in Current Repo

| Gap                         | Severity | Details                                                                                                              |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| **E2E test coverage**       | Medium   | 6 spec files vs Mattermost's 100+; critical flows like auth, messaging, and search are tested but edge cases are not |
| **i18n breadth**            | Medium   | 7 locales vs 67; non-English UX is incomplete                                                                        |
| **Enterprise auth**         | Medium   | No MFA, SAML, or LDAP — blocks enterprise adoption                                                                   |
| **Plugin ecosystem**        | Low      | No plugin system — acceptable for current stage                                                                      |
| **Performance testing**     | Low      | k6 tests exist but haven't been run/verified recently                                                                |
| **Mobile-specific testing** | Medium   | PWA tests exist but no device farm testing                                                                           |
| **Documentation depth**     | Low      | Extensive docs exist but are audit-focused rather than user/contributor-focused                                      |

### 3.6 Quality Gaps in Reference Repo

| Gap                        | Severity | Details                                                       |
| -------------------------- | -------- | ------------------------------------------------------------- |
| **No migration rollbacks** | High     | Any failed migration requires manual DB surgery               |
| **Bootstrap 3**            | High     | End-of-life; security vulnerabilities, no modern CSS features |
| **Redux boilerplate**      | Medium   | Excessive ceremony for state management                       |
| **No IaC**                 | High     | Infrastructure is manually managed                            |
| **No design tokens**       | Medium   | Theme values scattered across SASS variables                  |
| **No PWA**                 | Medium   | Requires native app for mobile usage                          |
| **No audit pipeline**      | Medium   | No automated security/supply chain auditing                   |
| **Custom WebSocket**       | Medium   | More maintenance burden than Socket.io                        |
| **Embedded Go migrations** | Medium   | Harder to review, version, and debug                          |
| **SASS + Bootstrap**       | Medium   | Build step overhead, CSS specificity battles                  |

### 3.7 Quick-Win Similarity Opportunities

| #   | Opportunity                                                               | Risk | Effort              |
| --- | ------------------------------------------------------------------------- | ---- | ------------------- |
| 1   | Add more notification sounds (Mattermost has 9, chat already has them ✅) | None | Done                |
| 2   | Expand e2e tests for message editing, channel operations                  | Low  | 2-3 days            |
| 3   | Add "Mark all read" button (already done ✅)                              | None | Done                |
| 4   | Add channel members dropdown (already done ✅)                            | None | Done                |
| 5   | Add channel header action menu (already done ✅)                          | None | Done                |
| 6   | Expand i18n coverage from 7 to 15+ locales                                | Low  | 1-2 days per locale |

### 3.8 Areas Where Similarity Would Be Counterproductive

| Area                       | Reason                                                               |
| -------------------------- | -------------------------------------------------------------------- |
| **Redux state management** | chat's React hooks + optimistic updates are architecturally superior |
| **SASS/Bootstrap styling** | Tailwind + design tokens is more maintainable                        |
| **Custom WebSocket**       | Socket.io is more reliable and feature-rich                          |
| **Monolithic Go server**   | chat's modular Express API is easier to reason about                 |
| **Embedded DB migrations** | chat's standalone SQL with rollbacks is safer                        |
| **No IaC**                 | chat's Terraform setup is essential for production reliability       |
| **No PWA**                 | chat's PWA eliminates need for native app development                |

---

## Phase 4 — Risk, Stability, and "Do Not Break" Analysis

### 4.1 Security Posture Comparison

| Dimension                      | chat                                              | Mattermost                             | Verdict                                          |
| ------------------------------ | ------------------------------------------------- | -------------------------------------- | ------------------------------------------------ |
| **Auth flows**                 | Supabase Auth (PKCE, magic link, OAuth)           | Custom JWT (local verify)              | **Stronger** — Supabase manages session security |
| **Secrets management**         | Env schema validation, .env.example               | Environment variables, less validation | **Equivalent**                                   |
| **HTTP security headers**      | CSP, HSTS, X-Frame-Options via middleware         | CSP, HSTS                              | **Equivalent**                                   |
| **Input validation**           | Zod schemas per module                            | Manual Go validation                   | **Stronger** — Zod is declarative and type-safe  |
| **Rate limiting**              | Per-endpoint configurable middleware              | Global + per-endpoint                  | **Equivalent**                                   |
| **Dependency vulnerabilities** | pnpm audit in CI, Dependabot                      | Dependabot + CodeQL + Scorecards       | **Equivalent**                                   |
| **Database access**            | RLS policies (declarative tenant isolation)       | App-level permission checks            | **Stronger** — Defense in depth                  |
| **Audit logging**              | Full audit API + DB logging                       | Audit table + API                      | **Equivalent**                                   |
| **Error handling**             | Structured error classes, no stack traces in prod | Go error wrapping                      | **Equivalent**                                   |

### 4.2 High-Risk Areas

| Area                           | Risk                                               | Blast Radius            | Mitigation                                            |
| ------------------------------ | -------------------------------------------------- | ----------------------- | ----------------------------------------------------- |
| **RLS policy changes**         | Incorrect policies could leak data or block access | All users, all data     | Test policies in non-prod first; audit policy changes |
| **Auth provider changes**      | Breaking Supabase auth integration                 | All users cannot log in | Full auth flow e2e tests; staged rollout              |
| **Database migration errors**  | Schema conflicts or data loss                      | All data                | Paired rollbacks; CI migration verification           |
| **Socket.io protocol changes** | Breaking real-time messaging                       | All online users        | Versioned event contracts; e2e tests                  |

### 4.3 Medium-Risk Areas

| Area                         | Risk                                     | Blast Radius                   | Mitigation                               |
| ---------------------------- | ---------------------------------------- | ------------------------------ | ---------------------------------------- |
| **Worker processor changes** | Missed notifications or delayed delivery | Users relying on notifications | Queue monitoring; DLQ configuration      |
| **BFF layer changes**        | Breaking API contract for web client     | Web app users                  | SDK versioning; integration tests        |
| **UI layout changes**        | Breaking responsive behavior             | Mobile/tablet users            | Visual regression tests                  |
| **Search index changes**     | Stale or incorrect search results        | All searching users            | Re-index after changes; search e2e tests |

### 4.4 Low-Risk Areas

| Area                           | Risk | Rationale                                 |
| ------------------------------ | ---- | ----------------------------------------- |
| **CSS variable consolidation** | Low  | Visual changes only, easily revertible    |
| **UI component extraction**    | Low  | Components are scoped, don't affect data  |
| **Documentation updates**      | Low  | No runtime impact                         |
| **Test additions**             | Low  | Additional coverage, no production impact |
| **i18n additions**             | Low  | String-only changes, no logic impact      |

### 4.5 Changes That Need Tests First

| Change                   | Required Tests                                 |
| ------------------------ | ---------------------------------------------- |
| RLS policy changes       | Data access integration tests per policy       |
| Auth flow changes        | Full auth e2e (login, signup, session, logout) |
| Migration schema changes | Forward + rollback integration tests           |
| API route changes        | Integration tests for affected routes          |
| Socket event changes     | Real-time messaging e2e tests                  |

### 4.6 Changes That Need Manual QA / Visual QA

| Change                         | Why                                                |
| ------------------------------ | -------------------------------------------------- |
| Layout/component restructuring | Visual regression may not be caught by unit tests  |
| Mobile responsive changes      | Device-specific behavior needs real device testing |
| Theme/design token updates     | Color contrast, spacing, and visual consistency    |
| Animation/transition changes   | Timing and feel require human judgment             |

### 4.7 Changes That Could Affect Deployment or Environment Semantics

| Change                       | Impact                                 |
| ---------------------------- | -------------------------------------- |
| Compose file changes         | Container networking, volume mounts    |
| Caddyfile changes            | TLS, routing, header handling          |
| Environment variable changes | All services that consume the variable |
| Terraform changes            | Infrastructure provisioning, DNS       |
| Dockerfile changes           | Image build, layer caching             |

### 4.8 Do-Not-Break Guardrails

```
CRITICAL (NO REGRESSION ALLOWED):
  1. Authentication — all login/session/signup flows
  2. Message delivery — zero loss, zero duplication
  3. RLS policies — never less restrictive
  4. Real-time connections — no silent disconnects
  5. Database migrations — always reversible

HIGH (REGISTRATION REQUIRES EXCEPTION):
  6. API contracts — SDK consumers depend on stability
  7. UI layout — responsive design for all breakpoints
  8. Search results — tsvector query accuracy
  9. File upload/download — data integrity
  10. Notification delivery — timely and reliable
```

### 4.9 Safe Areas for Early Improvement

1. Test coverage expansion (no production risk)
2. Documentation updates (no production risk)
3. i18n additions (no logic impact)
4. CSS variable/token consolidation (visual only)
5. Internal refactors with 100% test coverage
6. Worker processor additions (new queues, not modifying existing)
7. API module additions (new endpoints, not modifying existing)

---

## Phase 5 — Safe Alignment Roadmap

### 5.1 Roadmap Summary

| Phase       | Focus                                              | Risk Level  | Duration  |
| ----------- | -------------------------------------------------- | ----------- | --------- |
| **Phase 0** | Observation only / no code changes                 | None        | 1 day     |
| **Phase 1** | No-risk wins (tests, docs, i18n)                   | Near-zero   | 1 week    |
| **Phase 2** | Low-risk alignment (components, middleware)        | Low         | 2 weeks   |
| **Phase 3** | Medium-risk convergence (workers, cache)           | Medium      | 3-4 weeks |
| **Phase 4** | Strategic modernization (enterprise auth, plugins) | Medium-High | 6-8 weeks |
| **Phase 5** | Future-state cleanup                               | Low         | Ongoing   |

### 5.2 Immediate Low-Risk Wins (Phase 1)

| #   | Item                                                              | Inspiration                  | Effort              |
| --- | ----------------------------------------------------------------- | ---------------------------- | ------------------- |
| 1   | Expand e2e test coverage (message edit, channel ops, file upload) | Mattermost test depth        | 2-3 days            |
| 2   | Add integration tests for remaining API modules                   | Mattermost API test coverage | 3-5 days            |
| 3   | Expand i18n from 7 to 15 locales                                  | Mattermost's 67 locales      | 2-3 days per locale |
| 4   | Add GIF picker component                                          | Mattermost's GIF picker      | 1-2 days            |
| 5   | Add compliance export detail enhancements                         | Mattermost compliance module | 2-3 days            |

### 5.3 Low-Risk Similarity Improvements (Phase 2)

| #   | Item                                               | Inspiration                                | Risk               |
| --- | -------------------------------------------------- | ------------------------------------------ | ------------------ |
| 1   | Add cache layer (Redis-based)                      | Mattermost's localcachelayer + searchlayer | Low                |
| 2   | Extract shared message input sub-components        | Mattermost's textbox decomposition         | Low                |
| 3   | Add more keyboard shortcuts                        | Mattermost's shortcut system               | Low                |
| 4   | Add notification sound variety (verify existing 9) | Mattermost's 9 sounds                      | Low (already done) |
| 5   | Standardize error codes across API                 | Mattermost's error patterns                | Low                |

### 5.4 Medium-Risk Convergence Candidates (Phase 3)

| #   | Item                                                     | Inspiration                  | Risk   | Prerequisites                 |
| --- | -------------------------------------------------------- | ---------------------------- | ------ | ----------------------------- |
| 1   | Add 6+ new worker processors (export, import, migration) | Mattermost's 27 job types    | Medium | Queue infrastructure stable   |
| 2   | Add full-text search enhancements (operator hints)       | Mattermost's search          | Medium | Search index verified         |
| 3   | Add channel member history API                           | Mattermost's member history  | Medium | DB migration needed           |
| 4   | Add scheduled message enhancements                       | Mattermost's scheduled posts | Medium | Existing base in place        |
| 5   | Add data retention enforcement to worker                 | Mattermost's data retention  | Medium | Already partially implemented |

### 5.5 Optional Strategic Improvements (Phase 4)

| #   | Item                      | Inspiration           | Risk   | Business Value     |
| --- | ------------------------- | --------------------- | ------ | ------------------ |
| 1   | MFA/TOTP implementation   | Mattermost enterprise | High   | Enterprise sales   |
| 2   | SAML/OIDC SSO             | Mattermost enterprise | High   | Enterprise sales   |
| 3   | Plugin system             | Mattermost plugin API | High   | Ecosystem growth   |
| 4   | Desktop app (Tauri)       | Mattermost desktop    | Medium | User experience    |
| 5   | Elasticsearch integration | Mattermost enterprise | High   | Large-scale search |

### 5.6 What Must Stay As-Is

| System                       | Rationale                                    |
| ---------------------------- | -------------------------------------------- |
| Supabase Auth                | More secure and maintainable than custom JWT |
| Tailwind CSS + design tokens | Superior to SASS/Bootstrap                   |
| Next.js App Router           | Modern, performant, better DX                |
| Socket.io + Redis            | More reliable than custom WebSocket          |
| BullMQ workers               | Industry-standard queue system               |
| Migration rollbacks          | Critical safety net Mattermost lacks         |
| Terraform IaC                | Essential for reproducible infrastructure    |
| RLS policies                 | Defense-in-depth for tenant isolation        |

### 5.7 Recommended Execution Order

```
Week 1:   Phase 1 — e2e tests, i18n expansion, GIF picker
Week 2-3: Phase 2 — cache layer, sub-component extraction, keyboard shortcuts
Week 4-7: Phase 3 — worker expansion, search enhancements, data retention
Week 8+:  Phase 4 (if justified by business need) — enterprise auth, plugins
Ongoing:  Phase 5 — cleanup, standardization, test improvements
```

### 5.8 Minimum Validation Gate Before Each Phase

| Phase   | Validation Gate                                                     |
| ------- | ------------------------------------------------------------------- |
| Phase 1 | All existing tests pass; no migration changes                       |
| Phase 2 | Phase 1 complete; all e2e tests pass                                |
| Phase 3 | All unit + integration + e2e tests pass; staging deployment healthy |
| Phase 4 | Business justification documented; security review completed        |
| Phase 5 | Continuous; no regression allowed                                   |

---

## Phase 6 — File-by-File / Area-by-Area Change Plan

### 6.1 Highest-Priority Target Areas

1. **Test expansion** — `tests/e2e/`, `apps/api/src/modules/*/__tests__/`
2. **i18n expansion** — `apps/web/lib/i18n/`
3. **Worker expansion** — `apps/worker/src/processors/`
4. **Cache layer** — `packages/db/src/stores/`
5. **Message input decomposition** — `apps/web/components/chat/message-input.tsx`

### 6.2 Likely Files/Folders to Touch First

| File/Folder                                  | Change                                                                   | Phase |
| -------------------------------------------- | ------------------------------------------------------------------------ | ----- |
| `tests/e2e/messaging.spec.ts`                | Add message edit, delete, reply, reaction tests                          | P1    |
| `tests/e2e/channel.spec.ts`                  | New file for channel CRUD e2e tests                                      | P1    |
| `apps/api/src/modules/*/__tests__/`          | Add integration tests for uncovered modules                              | P1    |
| `apps/web/lib/i18n/`                         | Add locale files (it, ko, zh-CN, ru, nl, pl, sv, pt)                     | P1    |
| `apps/web/components/chat/gif-picker.tsx`    | New component                                                            | P1    |
| `packages/db/src/stores/`                    | Add cache layer wrapper                                                  | P2    |
| `apps/web/components/chat/message-input.tsx` | Decompose into sub-components (text-editor, formatting-bar, send-button) | P2    |
| `apps/worker/src/processors/`                | Add export, import, migration processors                                 | P3    |

### 6.3 Likely Files/Folders to Avoid Touching Early

| File/Folder                                 | Reason                                                                |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `apps/web/app/(workspace)/layout.tsx`       | Critical layout chain for virtual scrolling (documented in AGENTS.md) |
| `apps/web/components/chat/message-list.tsx` | Complex virtual scrolling logic; high regression risk                 |
| `apps/api/src/middleware/authenticate.ts`   | Auth is critical path; changes need thorough testing                  |
| `supabase/policies/*.sql`                   | RLS changes need careful security review                              |
| `infra/terraform/`                          | Infrastructure changes need CI/CD coordination                        |
| `packages/db/src/config.ts`                 | Core DB configuration affecting all services                          |

### 6.4 Structural Cleanup Candidates

| Item                     | Location                   | Change                                      |
| ------------------------ | -------------------------- | ------------------------------------------- |
| Emoji data deduplication | `apps/web/lib/emoji/`      | Verify no duplication between .json and .ts |
| CSS variable cleanup     | `apps/web/app/globals.css` | Already completed ✅ (Phase 4)              |
| Opacity standardization  | Various files              | Already completed ✅ (Phase 4)              |
| Component index exports  | `apps/web/components/`     | Add barrel exports for clean imports        |

### 6.5 UI/UX Alignment Candidates

| Item                       | Current State                          | Target                             |
| -------------------------- | -------------------------------------- | ---------------------------------- |
| Channel topic editing      | Implemented ✅                         | Click-to-edit with Enter/Escape    |
| Post delete undo           | Implemented ✅                         | Toast with 5s undo window          |
| High-contrast mode         | Implemented ✅                         | prefers-contrast: high media query |
| Focus ring standardization | Implemented ✅                         | Global focus-ring class            |
| Empty state adoption       | Implemented ✅ (16 files/20 locations) | Consistent EmptyState component    |

All UI/UX alignment items from Phase 4 already completed as of July 9, 2026.

### 6.6 API/Service Layer Alignment Candidates

| Item                       | Current State                  | Target                          |
| -------------------------- | ------------------------------ | ------------------------------- |
| Error code standardization | Structured error classes exist | Expand with more granular codes |
| API versioning             | Some versioning via BFF        | More explicit versioned routes  |
| OpenAPI documentation      | OpenAPI module exists          | Enhance schema documentation    |
| Rate limit configuration   | Per-endpoint configurable      | Add admin-configurable limits   |

### 6.7 Shared Utility / Abstraction Candidates

| Utility         | Location                        | Status                           |
| --------------- | ------------------------------- | -------------------------------- |
| Logger          | `packages/config/logger.ts`     | ✅ Existing                      |
| Error classes   | `packages/config/errors.ts`     | ✅ Existing                      |
| Env schema      | `packages/config/env-schema.ts` | ✅ Existing                      |
| Supabase client | `packages/db/src/config.ts`     | ✅ Existing                      |
| Store interface | `packages/db/src/stores/`       | ✅ Existing (IMessageStore etc.) |

### 6.8 Test Coverage Needed Before Refactor

| Refactor Target             | Required Tests Before                  |
| --------------------------- | -------------------------------------- |
| Message input decomposition | Full e2e message send/edit/delete flow |
| Cache layer addition        | Data access integration tests          |
| Worker processor changes    | Queue integration tests                |
| RLS policy changes          | Data access tests per policy           |

### 6.9 Documentation / Runbook Improvements

| Doc                   | Current State                  | Target                          |
| --------------------- | ------------------------------ | ------------------------------- |
| Architecture diagrams | Text descriptions in AGENTS.md | Formal architecture diagrams    |
| API documentation     | OpenAPI module                 | Full OpenAPI spec with examples |
| Deployment runbook    | Existing                       | Expand with rollback procedures |
| Contributing guide    | Existing                       | Add more examples and workflows |

### 6.10 Safe Patch Grouping Proposal

**Group A** (Phase 1 — no-risk):

- E2E test additions
- i18n locale additions
- GIF picker component
- Documentation improvements

**Group B** (Phase 2 — low-risk):

- Cache layer implementation
- Message input component decomposition
- Keyboard shortcut additions
- API error code standardization

**Group C** (Phase 3 — medium-risk):

- Worker processor expansion (4-6 new processors)
- Search operator hints
- Channel member history
- Data retention enforcement

**Group D** (Phase 4 — strategic, gated):

- Enterprise auth (MFA, SAML)
- Plugin system
- Desktop app (Tauri)

---

## Phase 7 — Patch Set Design / Execution Plan

### 7.1 Patch Set 1: No-Risk Cleanup / Organization / Docs

**Objective:** Expand test coverage, i18n, and documentation with zero regression risk.

| Item                                                  | Files                                     | Risk | Effort |
| ----------------------------------------------------- | ----------------------------------------- | ---- | ------ |
| E2E message edit/delete/reaction flow                 | `tests/e2e/messaging.spec.ts`             | None | 4h     |
| E2E channel CRUD                                      | `tests/e2e/channel.spec.ts` (new)         | None | 4h     |
| E2E file upload verification                          | `tests/e2e/file-upload.spec.ts`           | None | 2h     |
| Integration tests for 5 uncovered modules             | `apps/api/src/modules/*/__tests__/`       | None | 1d     |
| Add 8 new locales (it, ko, zh-CN, ru, nl, pl, sv, pt) | `apps/web/lib/i18n/`                      | None | 2d     |
| GIF picker component                                  | `apps/web/components/chat/gif-picker.tsx` | None | 1d     |

**Validation:** `pnpm test`, `pnpm test:e2e`  
**Rollback:** Git revert — no data/schema changes  
**Visual QA:** No (component additions only)

### 7.2 Patch Set 2: Low-Risk Shared Utility / Component Alignment

**Objective:** Introduce caching, decompose message input, standardize patterns.

| Item                           | Files                                        | Risk | Effort |
| ------------------------------ | -------------------------------------------- | ---- | ------ |
| Redis cache layer for stores   | `packages/db/src/stores/cache-store.ts`      | Low  | 2d     |
| Decompose message-input.tsx    | `apps/web/components/chat/`                  | Low  | 2d     |
| Keyboard shortcut additions    | `apps/web/lib/keyboard-shortcut-registry.ts` | Low  | 1d     |
| API error code standardization | `packages/config/errors.ts`, modules         | Low  | 1d     |

**Validation:** `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`  
**Rollback:** Revert individual component commits  
**Integration tests:** Required for cache layer

### 7.3 Patch Set 3: Low-Risk UI Consistency Improvements

**Objective:** Polish UI components for consistency.

All items already completed as of July 9, 2026 (Phase 4). No further work needed.

### 7.4 Patch Set 4: Medium-Risk Internal Refactors with Tests

**Objective:** Expand worker capabilities and search features.

| Item                       | Files                                     | Risk   | Effort |
| -------------------------- | ----------------------------------------- | ------ | ------ |
| Export processor           | `apps/worker/src/processors/export.ts`    | Medium | 2d     |
| Import processor           | `apps/worker/src/processors/import.ts`    | Medium | 2d     |
| Migration processor        | `apps/worker/src/processors/migration.ts` | Medium | 1d     |
| Search operator hints      | `apps/web/components/chat/search-bar.tsx` | Low    | 1d     |
| Channel member history API | `apps/api/src/modules/channels/`          | Medium | 2d     |

**Validation:** Worker integration tests, search e2e tests, staging deployment  
**Rollback:** Feature flags for new processors; DB migration rollback for member history  
**Visual QA:** Required for search UI changes

### 7.5 Patch Set 5: Optional Strategic Convergence Work (Gated)

**Objective:** Enterprise features (gated on business justification).

| Item                | Risk   | Prerequisites                   | Business Value   |
| ------------------- | ------ | ------------------------------- | ---------------- |
| MFA/TOTP            | High   | Security review, auth e2e tests | Enterprise sales |
| SAML/OIDC SSO       | High   | Security review, SAML test IdP  | Enterprise sales |
| Plugin system       | High   | Architecture RFC, API design    | Ecosystem growth |
| Desktop app (Tauri) | Medium | PWA stability, build pipeline   | User experience  |

**Gate:** Business requirement document + security architecture review + dedicated sprint allocation.

### 7.6 Top 20 Prioritized Recommendations

| #   | Recommendation                                  | Risk   | Phase | Value     |
| --- | ----------------------------------------------- | ------ | ----- | --------- |
| 1   | Expand e2e tests for message operations         | None   | P1    | High      |
| 2   | Add integration tests for uncovered API modules | None   | P1    | High      |
| 3   | Expand i18n to 15+ locales                      | None   | P1    | High      |
| 4   | Add GIF picker                                  | None   | P1    | Medium    |
| 5   | Add Redis cache layer for stores                | Low    | P2    | High      |
| 6   | Decompose message-input.tsx                     | Low    | P2    | Medium    |
| 7   | Add keyboard shortcuts (Ctrl+Shift+K, etc.)     | Low    | P2    | Medium    |
| 8   | Standardize API error codes                     | Low    | P2    | Medium    |
| 9   | Add export processor                            | Medium | P3    | High      |
| 10  | Add import processor                            | Medium | P3    | High      |
| 11  | Add search operator hints                       | Low    | P3    | Medium    |
| 12  | Add channel member history API                  | Medium | P3    | Medium    |
| 13  | Add data retention enforcement to scheduler     | Medium | P3    | High      |
| 14  | Add compliance export detail enhancements       | Medium | P3    | Medium    |
| 15  | Enhance OpenAPI documentation                   | Low    | P2    | Medium    |
| 16  | Add barrel exports for components               | Low    | P2    | Low       |
| 17  | Add integration tests for worker processors     | Medium | P1    | High      |
| 18  | MFA/TOTP (gated)                                | High   | P4    | Strategic |
| 19  | SAML/OIDC (gated)                               | High   | P4    | Strategic |
| 20  | Plugin system (gated)                           | High   | P4    | Strategic |

### 7.7 Quick Wins (Already Implemented)

The following items from the comparative audit are already complete in chat:

- ✅ Notification sounds (9 options)
- ✅ Emoji picker with skin tones + categories
- ✅ Channel header action menu
- ✅ Channel mute/unmute
- ✅ Post-delete undo toast
- ✅ High-contrast mode
- ✅ Focus ring standardization
- ✅ Empty state adoption (16 files)
- ✅ Opacity consolidation (264 replacements)
- ✅ Channel inline topic editing
- ✅ Drag-and-drop file upload overlay
- ✅ Announcement banner with dismiss persistence
- ✅ Tablet sidebar auto-collapse
- ✅ Thread typing indicator
- ✅ Slash commands with autocomplete
- ✅ Search operator hints
- ✅ Channel bookmark API
- ✅ Message forwarding
- ✅ Read-only channels
- ✅ Custom user status with emoji + presets

### 7.8 Needs-Tests-First List

| Change                              | Tests Required Before                    |
| ----------------------------------- | ---------------------------------------- |
| RLS policy changes                  | Data access integration tests per policy |
| Auth flow changes                   | Full auth e2e suite                      |
| Migration schema changes            | Forward + rollback tests                 |
| API route changes (existing routes) | Route integration tests                  |
| Socket event changes                | Real-time e2e tests                      |
| Cache layer changes                 | Store access integration tests           |

### 7.9 Copy-from-Reference List

Items that can be directly adapted from Mattermost patterns:

| Pattern                                | Adaptation Style             |
| -------------------------------------- | ---------------------------- |
| Notification sound variety             | Copy as-is (already done ✅) |
| GIF picker integration                 | Copy as-is (GIPHY API)       |
| Search operator hints (`from:`, `in:`) | Copy as-is                   |
| Keyboard shortcut system               | Adapt conceptually           |
| Error code enumeration                 | Adapt conceptually           |
| Worker job types (export, import)      | Adapt conceptually           |

### 7.10 Adapt-Don't-Copy List

| Pattern         | Why Adapt                                                     |
| --------------- | ------------------------------------------------------------- |
| i18n expansion  | Manually translate, don't copy Mattermost's auto-translations |
| Cache layer     | Design for Redis (Mattermost uses in-memory)                  |
| Plugin system   | Design for current stack (Mattermost uses Go plugins)         |
| Enterprise auth | Implement with Supabase extensions (not custom JWT)           |
| Desktop app     | Tauri instead of Electron                                     |

### 7.11 Leave-Alone List

| System                   | Reason                    |
| ------------------------ | ------------------------- |
| Supabase Auth            | Already superior          |
| Tailwind + design tokens | Already superior          |
| Next.js App Router       | Already superior          |
| Socket.io + Redis        | Already superior          |
| BullMQ workers           | Already industry-standard |
| Migration rollbacks      | Already safer             |
| Terraform IaC            | Already superior          |
| RLS policies             | Already superior          |

### 7.12 Best Order of Execution

```
Week 1:   Patch Set 1 (tests + i18n + GIF picker)
Week 2:   Patch Set 2 (cache + decomposition + shortcuts)
Week 3-4: Patch Set 4 (worker expansion + search + member history)
Week 5+:  Patch Set 5 (gated — enterprise features)
Ongoing:  Continuous improvement (documentation, cleanup, test expansion)
```

---

## Phase 8 — Final Reconciliation / Single Source of Truth Audit

### 8.1 Executive Summary

**Reference Repo:** Mattermost v11.9.0 — C:\temp\mattermost-master  
**Current Repo:** chat — C:\temp\chat

The current repo (chat) is architecturally superior to Mattermost across nearly every dimension: build system (Turborepo/pnpm vs webpack/npm), styling (Tailwind + design tokens vs SASS/Bootstrap 3), state management (React hooks vs Redux), database security (RLS vs app-level auth), infrastructure (Terraform IaC vs manual), migration safety (down scripts vs none), and modernization (Next.js 15 App Router vs React-Redux SPA).

Mattermost's primary advantages are feature breadth and maturity: 67 locales, 27 job types, enterprise auth (SAML/LDAP/MFA), plugin system, Elasticsearch, desktop app, and 10+ years of production hardening with 55 CI workflows and 100+ e2e test directories.

**Key verdict: Do not mirror Mattermost's architecture. Selectively adopt features and patterns where safe and valuable.**

### 8.2 High-Level Repo Comparison

| Dimension               | Mattermost                  | chat                         | Advantage            |
| ----------------------- | --------------------------- | ---------------------------- | -------------------- |
| **Backend**             | Go (compiled, performant)   | TypeScript/Node.js           | Mattermost (Go)      |
| **Frontend**            | React 17 + Redux            | Next.js 15 + App Router      | chat                 |
| **Styling**             | SASS + Bootstrap 3          | Tailwind + design tokens     | chat                 |
| **Database**            | PostgreSQL (custom Go)      | Supabase (managed + RLS)     | chat                 |
| **Auth**                | Custom JWT + 4 providers    | Supabase Auth + 2 providers  | chat (security)      |
| **Real-time**           | Custom WebSocket            | Socket.io + Redis            | chat                 |
| **Jobs**                | 27 Go goroutine types       | 6 BullMQ processors          | Mattermost (breadth) |
| **i18n**                | 67 locales                  | 7 locales                    | Mattermost           |
| **Tests**               | 55 workflows, 100+ e2e dirs | 6 e2e specs, 27 module tests | Mattermost           |
| **Infrastructure**      | Manual                      | Terraform IaC                | chat                 |
| **Migration safety**    | No rollbacks                | 59 paired down migrations    | chat                 |
| **Design system**       | Ad-hoc                      | Token-based with Storybook   | chat                 |
| **Enterprise features** | MFA, SAML, LDAP, plugins    | None                         | Mattermost           |
| **Mobile**              | React Native app            | PWA                          | Equivalent           |
| **Security**            | App-level auth              | RLS + app-level auth         | chat                 |

### 8.3 Detailed Mapping Summary

**API Layer:**

- Mattermost: `server/channels/api4/` (150+ flat Go handler files)
- chat: `apps/api/src/modules/` (27 modular route/service/test directories)
- chat's modular approach is more maintainable

**Data Layer:**

- Mattermost: `server/channels/store/` (layered: sql, cache, search, retry, timer)
- chat: `packages/db/src/stores/` (interface-based store abstraction)
- Conceptually similar; chat lacks cache layer

**UI Layer:**

- Mattermost: `webapp/channels/src/components/` (170+ dirs, deeply nested)
- chat: `apps/web/components/` (10 dirs, flat per area)
- chat's flat structure is simpler; Mattermost has more components

**Job System:**

- Mattermost: `server/channels/jobs/` (27 types, Go goroutines)
- chat: `apps/worker/src/processors/` (6 types, BullMQ)
- chat's architecture is more robust; Mattermost has more breadth

### 8.4 Best Implementations Worth Adopting

| Implementation               | Source     | Adoption Method           | Priority |
| ---------------------------- | ---------- | ------------------------- | -------- |
| GIF picker                   | Mattermost | New component (GIPHY API) | Low      |
| Expanded locales (67→15+)    | Mattermost | Phased locale additions   | Medium   |
| Search operator hints        | Mattermost | UI enhancement            | Low      |
| Keyboard shortcut system     | Mattermost | Registry expansion        | Low      |
| Export/import job processors | Mattermost | New BullMQ processors     | Medium   |
| Compliance export detail     | Mattermost | API/worker enhancement    | Low      |

### 8.5 Areas the Current Repo Should Keep As-Is

| Area                          | Reason                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| Supabase Auth                 | More secure, less custom code, PKCE by default                     |
| Tailwind CSS + design tokens  | More maintainable, consistent, smaller bundles                     |
| Next.js App Router            | Modern RSCs, better performance, SEO support                       |
| Socket.io + Redis             | More reliable, auto-reconnection, room management, adapter pattern |
| BullMQ workers                | Proven queue system, retries, DLQ, scheduling, monitoring          |
| Migration rollbacks           | Critical safety net — do not remove                                |
| Terraform IaC                 | Reproducible infrastructure — essential for production             |
| RLS policies                  | Defense-in-depth — do not weaken                                   |
| PWA                           | No native app overhead — sufficient for current users              |
| BFF layer                     | API gateway pattern — protects backend                             |
| Optimistic UI                 | Better user experience than synchronous Redux patterns             |
| Design system                 | Single source of truth — extend don't replace                      |
| Audit pipeline (19 workflows) | Automated security verification                                    |

### 8.6 Efficiency Opportunities

| Opportunity                 | Current State     | Target         | Expected Benefit                |
| --------------------------- | ----------------- | -------------- | ------------------------------- |
| Worker processor expansion  | 6 processors      | 12+ processors | Automated background operations |
| Cache layer                 | None              | Redis-based    | Faster reads, reduced DB load   |
| E2E test coverage           | 6 spec files      | 20+ spec files | Confidence in refactors         |
| i18n expansion              | 7 locales         | 15+ locales    | Global user adoption            |
| Message input decomposition | Single large file | Sub-components | Maintainability                 |

### 8.7 Risk Register

| Risk                    | Probability | Impact        | Mitigation                        |
| ----------------------- | ----------- | ------------- | --------------------------------- |
| RLS policy regression   | Low         | Critical      | Review process, integration tests |
| Auth provider lock-in   | Medium      | High          | Abstracted behind store interface |
| Socket.io scaling limit | Low         | Medium        | Redis adapter already configured  |
| BullMQ Redis dependency | Low         | Medium        | Redis HA configuration            |
| Migration conflicts     | Low         | Medium        | CI verification, paired rollbacks |
| Test coverage gaps      | Medium      | Medium        | Phased expansion                  |
| Enterprise feature gaps | Medium      | Low (current) | Gated roadmap                     |

### 8.8 Safe Alignment Roadmap

```
Phase 1 (Week 1):    No-risk wins
  ├── E2E test expansion (messaging, channels, file upload)
  ├── Integration tests for API modules
  ├── i18n expansion (7 → 15 locales)
  └── GIF picker component

Phase 2 (Week 2-3):  Low-risk alignment
  ├── Redis cache layer for stores
  ├── Message input component decomposition
  ├── Keyboard shortcut additions
  └── API error code standardization

Phase 3 (Week 4-7):  Medium-risk convergence
  ├── Worker processor expansion (export, import, migration)
  ├── Search operator hints
  ├── Channel member history API
  └── Data retention enforcement

Phase 4 (Week 8+):   Strategic (gated)
  ├── MFA/TOTP
  ├── SAML/OIDC SSO
  ├── Plugin system
  └── Desktop app (Tauri)
```

### 8.9 File/Area Change Recommendations

| Priority | Area               | Files                                        | Type          |
| -------- | ------------------ | -------------------------------------------- | ------------- |
| P1       | E2E tests          | `tests/e2e/`                                 | New tests     |
| P1       | Integration tests  | `apps/api/src/modules/*/__tests__/`          | New tests     |
| P1       | i18n               | `apps/web/lib/i18n/`                         | Add locales   |
| P1       | GIF picker         | `apps/web/components/chat/gif-picker.tsx`    | New component |
| P2       | Cache layer        | `packages/db/src/stores/cache-store.ts`      | New store     |
| P2       | Message input      | `apps/web/components/chat/message-input.tsx` | Refactor      |
| P2       | Keyboard shortcuts | `apps/web/lib/keyboard-shortcut-registry.ts` | Enhance       |
| P2       | Error codes        | `packages/config/errors.ts`                  | Expand        |
| P3       | Worker processors  | `apps/worker/src/processors/`                | New files     |
| P3       | Search             | `apps/web/components/chat/search-bar.tsx`    | Enhance       |

### 8.10 Do-Not-Break Guardrails

```
CRITICAL (NO REGRESSION ALLOWED):
  1. Authentication — all login/session/signup flows
  2. Message delivery — zero loss, zero duplication
  3. RLS policies — never less restrictive
  4. Real-time connections — no silent disconnects
  5. Database migrations — always reversible

HIGH (REGISTRATION REQUIRES EXCEPTION):
  6. API contracts — SDK consumers depend on stability
  7. UI layout — responsive design for all breakpoints
  8. Search results — tsvector query accuracy
  9. File upload/download — data integrity
  10. Notification delivery — timely and reliable

MEDIUM:
  11. Env variable contracts — all services
  12. Compose file compatibility — local/dev/prod
  13. Caddy routing rules — TLS and proxying
  14. Worker queue names — BullMQ consumers
  15. Socket event names — frontend/backend contract
```

### 8.11 Validation Checklist

Before ANY production deployment:

```
□ All unit tests pass (pnpm test)
□ All integration tests pass (pnpm test:integration)
□ All e2e tests pass (pnpm test:e2e)
□ TypeScript typecheck passes (pnpm typecheck)
□ Lint passes (pnpm lint)
□ All migrations can be applied and rolled back
□ BFF layer is healthy
□ Worker queues are processing
□ Socket.io connections are functional
□ Search index is current
```

Before Phase 3+ changes:

```
□ Staging environment mirrors production
□ Load test passes for new worker processors
□ Security review completed for auth changes
□ Rollback plan documented and tested
□ Monitoring alerts configured
□ Runbook updated
```

### 8.12 Final Recommendation

**Do not attempt to mirror Mattermost's architecture.** The current repo (chat) is architecturally superior and built on modern, proven technologies. Mattermost's advantages are in feature breadth and enterprise maturity, not architectural patterns.

**Recommended action plan:**

1. **Immediately** (Phase 1): Expand test coverage and i18n — no risk, high value
2. **Within 2 weeks** (Phase 2): Add cache layer, decompose message input, add keyboard shortcuts — low risk, measurable improvement
3. **Within 4 weeks** (Phase 3): Expand worker processors, enhance search, add member history — medium risk, significant capability expansion
4. **Gated** (Phase 4): Enterprise auth, plugins, desktop app — only when business justifies the investment

**Things to never port from Mattermost:**

- Redux state management
- SASS/Bootstrap styling
- Custom WebSocket implementation
- Embedded Go database migrations
- Manual infrastructure management
- No migration rollbacks
- No PWA approach

**Things to keep and extend in current repo:**

- Supabase Auth + RLS
- Tailwind CSS + design tokens
- Next.js App Router
- Socket.io + Redis
- BullMQ workers
- Migration rollbacks
- Terraform IaC
- PWA approach
- BFF layer
- Audit pipeline
- Design system + Storybook
- Optimistic UI hooks

---

**Audit completed July 16, 2026**  
**Repos: C:\temp\mattermost-master (Reference) vs C:\temp\chat (Current)**  
**8 Phases executed: Structural baseline → Feature mapping → Strengths/weaknesses → Risk analysis → Roadmap → Change plan → Patch sets → Final reconciliation**
