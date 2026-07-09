# Full Comparative Repo Audit (Re-execution)

**Audit Date:** July 9, 2026
**Reference Repo:** `C:\temp\mattermost-master` (Mattermost v11.9.0, Server v8)
**Current Repo:** `C:\temp\chat` (Chat Platform)
**Method:** Full 8-phase protocol — cross-referenced against existing `docs/audits/compare/full_comparative_repo_audit.md` with updated UI/UX deep audit findings incorporated.

---

## Phase 1 — Repo Inventory + Structural Baseline

### 1A. Reference Repo Inventory (Mattermost)

**Language:** Go 1.26.4 (backend) + TypeScript 5.6.3 / React 18.2 (frontend)
**Package Manager:** npm workspaces (frontend) + Go modules (backend)
**Build:** Webpack 5 (frontend) + `go build` via Makefile (backend)
**Docker:** Multi-stage server + webapp builds, docker-compose for dev services (PostgreSQL, Minio, Redis, Elasticsearch, OpenLDAP, Keycloak)
**Makefiles:** 7 total across the repo

**Top-level structure:**

```
mattermost-master/
├── api/                  # OpenAPI v4 spec (55 YAML source files)
├── docs/                 # Docusaurus documentation site
├── e2e-tests/            # Playwright (current) + Cypress (legacy)
├── server/               # Go backend (~1,800+ source files)
│   ├── channels/         # Main server app (~700 source files)
│   │   ├── api4/         # 167 REST API handler files
│   │   ├── app/          # 293 business logic files
│   │   ├── db/           # 200 migration pairs (400 files)
│   │   ├── store/        # 147 SQL persistence files (sqlx)
│   │   └── jobs/         # 27 job types
│   ├── platform/         # 11 pluggable services + 5 shared libs
│   ├── public/           # Public Go module
│   │   ├── model/        # 291 domain model files
│   │   └── shared/       # 8 packages (markdown, mlog, i18n, etc.)
│   ├── config/           # Configuration system
│   ├── enterprise/       # EE code (Elasticsearch, metrics, message export)
│   ├── i18n/             # 55 server-side locale files
│   ├── cmd/              # Entry points (mattermost, mmctl)
│   └── build/            # Dockerfiles, CI compose
├── tools/                # Custom Go vet analyzers, i18n tool, etc.
└── webapp/               # React frontend monorepo
    ├── channels/src/     # Main SPA (actions, components, reducers, store)
    │   ├── components/   # 350+ component directories
    │   ├── actions/      # ~47 Redux action creator files
    │   ├── reducers/     # Redux slice reducers
    │   ├── selectors/    # ~36 selector files
    │   ├── utils/        # ~130 utility files
    │   ├── i18n/         # 64 locale files
    │   └── sass/         # SCSS stylesheets (~50 files)
    └── platform/         # 6 shared packages (client, components, redux, shared, types, eslint)
```

**Key architectural characteristics:**

- Go monolith with clear layered architecture: `api4` → `app` → `store/sqlstore` → PostgreSQL
- 27 background job types (scheduler + worker pattern)
- Redux-heavy frontend with SASS styling, no CSS-in-JS
- Plugin system throughout (hooks, registry, marketplace)
- WebSocket hub architecture (`web_hub.go`)
- Enterprise features gated behind interfaces in `einterfaces/`

### 1B. Current Repo Inventory (Chat Platform)

**Language:** TypeScript 5.9 (full-stack) + Node 22
**Package Manager:** pnpm 9.x with Turborepo orchestration
**Build:** Next.js 15 standalone (frontend) + tsx/tsup (backend services)
**Docker:** Multi-stage per-service builds (api, web, worker) + Caddy reverse proxy
**No Makefiles** — everything in package.json scripts + Turbo tasks

**Top-level structure:**

```
chat/
├── .github/              # 20 GitHub Actions workflows
├── apps/                 # Multi-service architecture
│   ├── api/              # Express + Socket.io (25 modules, 75+ files)
│   ├── web/              # Next.js 15 App Router (12 route groups, 35+ components)
│   └── worker/           # BullMQ (6 processors)
├── packages/             # 4 shared packages (Turborepo)
│   ├── config/           # Shared env config, errors, logger
│   ├── db/               # Supabase client + 5 store interfaces
│   ├── sdk/              # Client SDK (10 API modules)
│   └── ui/               # Design system (8 components, 7 token categories)
├── supabase/             # Database layer
│   ├── migrations/       # 55 forward migrations
│   ├── rollback/         # 54 down migrations
│   ├── policies/         # 11 RLS policy files
│   └── seeds/            # 9 seed files
├── tests/                # E2E (6 specs), integration, k6 (2), chaos (2)
├── scripts/              # 42+ tooling scripts
├── infra/                # Terraform (5 files) + Docker Compose (11 files) + Caddy
├── hardening/            # Security artifacts (baselines, history, rules, policies)
└── docs/                 # Extensive documentation (100+ files)
```

**Key architectural characteristics:**

- Microservice-oriented: api (Express), web (Next.js), worker (BullMQ) — but all deployed on single DO droplet
- Supabase-native auth + database with RLS for tenancy
- Socket.io for real-time (not raw WebSocket)
- TipTap (ProseMirror) WYSIWYG editor
- Tailwind CSS v4 + dual CSS variable system (Mattermost-style + design tokens)
- 25 API modules with Express routers, consistent middleware stack
- 6 BullMQ worker processors
- Extensive audit pipeline (58 prompts, 624 findings across 8 batches)
- Design token system with Storybook

### 1C. Structural Similarities

| Dimension                    | Similarity                                                                 |
| ---------------------------- | -------------------------------------------------------------------------- |
| Monorepo layout              | Both have `apps/` or equivalent (webapp/server) + shared packages/platform |
| Docker deployment            | Both use multi-stage Dockerfiles + docker-compose                          |
| CI/CD                        | Both have extensive GitHub Actions workflows (20 vs 39)                    |
| DB migrations with rollbacks | Both have forward + down migration scripts                                 |
| Background jobs              | Both have job systems (27 Go types vs 6 BullMQ processors)                 |
| OpenAPI                      | Both have OpenAPI specs (55 YAML sources vs generated)                     |
| RLS/tenancy                  | Both use PostgreSQL RLS for multi-tenant isolation                         |
| i18n                         | Both have en.json + locale files (64 vs 1)                                 |
| E2E testing                  | Both use Playwright                                                        |
| Component library            | Both have shared component packages                                        |

### 1D. Structural Differences

| Dimension                  | Mattermost                                        | Chat Platform                        |
| -------------------------- | ------------------------------------------------- | ------------------------------------ |
| **Backend language**       | Go 1.26                                           | TypeScript/Node 22                   |
| **Frontend framework**     | React 18 SPA (Webpack)                            | Next.js 15 (App Router/SSR)          |
| **State management**       | Redux + sagas                                     | React hooks + Supabase subscriptions |
| **Styling**                | SASS (SCSS)                                       | Tailwind CSS v4                      |
| **Auth model**             | Custom JWT + sessions                             | Supabase Auth (magic link + OAuth)   |
| **Database**               | PostgreSQL + MySQL (legacy)                       | Supabase (PostgreSQL 17)             |
| **Real-time**              | Raw WebSocket hub (gorilla/websocket)             | Socket.io + Redis adapter            |
| **Editor**                 | Textarea + markdown                               | TipTap (ProseMirror WYSIWYG)         |
| **Package manager**        | npm workspaces                                    | pnpm + Turborepo                     |
| **Build system**           | Webpack 5                                         | Next.js build + tsup                 |
| **Orchestration**          | Makefiles (7)                                     | package.json scripts + Turbo         |
| **Plugin system**          | Full plugin framework                             | None                                 |
| **Enterprise features**    | EE code built-in (Elasticsearch, MFA, LDAP, SAML) | None (except RBAC + audit)           |
| **Migration count**        | 200 pairs                                         | 55 + 54 rollback                     |
| **Jobs count**             | 27 types                                          | 6 types                              |
| **Locales**                | 64 frontend + 55 server                           | 1 (en.json)                          |
| **Component count**        | ~350+ directories                                 | ~35+ components                      |
| **API route count**        | ~167 handlers                                     | ~25 modules                          |
| **Infrastructure-as-Code** | None                                              | Terraform (DO)                       |
| **Audit pipeline**         | None                                              | 58 prompts, 624 findings             |
| **Design system**          | None formal                                       | Token system + Storybook             |
| **PWA**                    | No                                                | Yes (manifest, service worker, push) |
| **AI features**            | No                                                | AI rewrite actions                   |
| **WebRTC**                 | No (separate calls product)                       | LiveKit integration                  |

### 1E. Likely Core Systems

**Mattermost:**

- `server/channels/app/` — central business logic (293 files)
- `server/channels/store/sqlstore/` — data access layer (147 files)
- `server/public/model/` — domain model definitions (291 files)
- `webapp/channels/src/components/` — UI (350+ directories)
- Plugin system (hooks, registry, marketplace)

**Chat Platform:**

- `apps/api/src/modules/` — 25 API modules
- `apps/api/src/middleware/` — 15 middleware components
- `apps/web/components/chat/` — core chat UI (message-input.tsx alone is 1347 lines)
- `packages/db/src/stores/` — store abstraction layer
- `supabase/migrations/` + `supabase/policies/` — database schema + RLS

### 1F. Likely Fragile / High-Risk Areas

**Mattermost:**

- Plugin system — large surface area, backward compatibility constraints
- Migration system — 200 sequential migrations, ordering dependencies
- Redux store — massive state tree, selector chains
- WebSocket hub — single point for real-time message delivery

**Chat Platform:**

- `message-input.tsx` (1347 lines) — largest single component, high complexity
- Socket.io — per-event auth, presence, reconnection
- Supabase RLS — 11 policy files, must stay synchronized with API middleware
- BullMQ workers — 6 processors sharing Redis, queue management
- CSS variable system — dual track (Mattermost-style + design tokens) creates maintenance overhead

### 1G. Unknowns / Areas Needing Deeper Inspection

- Mattermost performance / load testing maturity
- Chat platform's full API contract coverage vs Mattermost's OpenAPI spec
- Chat platform's monitorability / observability stack maturity relative to Mattermost
- Enterprise feature gap analysis (MFA, LDAP, SAML, Elasticsearch)
- Plugin system feasibility assessment for chat platform

---

## Phase 2 — Feature / Module / Folder Mapping

### 2A. Mapping Summary

The two repos share the same conceptual domain (team messaging platform) but differ dramatically in architecture:

- Mattermost is a Go monolith + React SPA with Redux
- Chat Platform is a TypeScript microservice-oriented architecture with Next.js SSR + Supabase

### 2B. Folder-to-Folder Mapping

| Mattermost                                   | Chat Platform                                            | Equivalence                                                         |
| -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| `server/channels/api4/`                      | `apps/api/src/modules/`                                  | **Direct** — REST API handlers, though Go vs Express                |
| `server/channels/app/`                       | `apps/api/src/modules/*/service.ts`                      | **Partial** — business logic split across api + worker              |
| `server/channels/store/sqlstore/`            | `packages/db/src/stores/`                                | **Conceptual** — data access layer                                  |
| `server/public/model/`                       | `packages/db/src/types.ts`                               | **Partial** — Mattermost has 291 model files vs 1 shared types file |
| `server/channels/web/`                       | `apps/api/src/middleware/`                               | **Partial** — middleware layer                                      |
| `webapp/channels/src/components/`            | `apps/web/components/`                                   | **Direct** — UI components                                          |
| `webapp/platform/types/`                     | `packages/db/src/types.ts` + `packages/sdk/src/types.ts` | **Partial** — type definition                                       |
| `webapp/platform/client/`                    | `packages/sdk/`                                          | **Direct** — client SDK                                             |
| `webapp/platform/components/`                | `packages/ui/`                                           | **Direct** — shared component library                               |
| `server/channels/jobs/`                      | `apps/worker/src/processors/`                            | **Conceptual** — background jobs                                    |
| `server/channels/db/migrations/`             | `supabase/migrations/`                                   | **Direct** — database migrations                                    |
| `server/i18n/` + `webapp/channels/src/i18n/` | `apps/web/lib/i18n/`                                     | **Partial** — i18n (64 locales vs 1)                                |
| `server/build/` + `webapp/channels/build/`   | `infra/docker/`                                          | **Direct** — Docker deployment                                      |
| No equivalent                                | `infra/terraform/`                                       | **Extra** — chat has IaC                                            |
| No equivalent                                | `scripts/`                                               | **Extra** — chat has extensive tooling                              |
| `api/v4/source/`                             | `apps/api/src/modules/openapi/`                          | **Conceptual** — OpenAPI spec                                       |
| No equivalent                                | `hardening/`                                             | **Extra** — chat has security hardening store                       |
| No equivalent                                | `docs/audits/`                                           | **Extra** — chat has full audit pipeline documentation              |

### 2C. Feature-to-Feature Mapping

| Feature            | Mattermost                                            | Chat Platform                                                                       |
| ------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Auth**           | Email/password, OAuth, SAML, LDAP, MFA                | Magic link, Google, GitHub                                                          |
| **Messaging**      | Posts (CRUD), threads, reactions, pinning, flagging   | Messages (CRUD), threads, reactions, pinning, flagging, forwarding, scheduled posts |
| **Channels**       | Public/private, DM/GM, read-only, bookmarks           | Public/private, DM/GM, read-only, bookmarks                                         |
| **Search**         | Elasticsearch + built-in                              | tsvector full-text search                                                           |
| **Sidebar**        | Categories, drag-reorder, unread filter               | Categories, drag-reorder, unread filter, keyboard move                              |
| **Notifications**  | Email, push, desktop, sounds                          | In-app, push (VAPID), email, 9 sounds, trigger words                                |
| **Editor**         | Textarea + markdown                                   | TipTap WYSIWYG (rich text)                                                          |
| **Files**          | Upload, preview, zoom, navigation, metadata           | Upload, preview, zoom, navigation, metadata                                         |
| **Admin**          | Full admin console                                    | Admin panel (user roles, CSV import)                                                |
| **Integrations**   | Webhooks (incoming/outgoing), slash commands, plugins | Webhooks (incoming/outgoing), slash commands, AI rewrite                            |
| **Real-time**      | WebSocket hub                                         | Socket.io with Redis adapter                                                        |
| **i18n**           | 64 locales                                            | 1 locale (en)                                                                       |
| **Performance**    | react-window virtualization                           | @tanstack/react-virtual                                                             |
| **Export**         | Compliance export (message_export)                    | CSV/JSON export endpoints                                                           |
| **Import**         | Slack import                                          | CSV import                                                                          |
| **Retention**      | Compliance + data retention policies                  | Data retention worker (365d messages, 90d audit)                                    |
| **WebRTC**         | Separate calls product                                | LiveKit integration                                                                 |
| **Onboarding**     | Tour tips + task list                                 | Onboarding tour + task list                                                         |
| **Auto-responder** | @mattermost/auto_responder.go                         | API + UI + migration                                                                |
| **Drafts**         | Drafts system                                         | localStorage auto-save                                                              |
| **User groups**    | Groups CRUD                                           | Groups CRUD + user-groups                                                           |
| **Custom status**  | Custom status + emoji + duration                      | Custom status + emoji + duration                                                    |

### 2D. Naming and Organizational Mismatches

| Mattermost Name      | Chat Platform Name         | Notes                                     |
| -------------------- | -------------------------- | ----------------------------------------- |
| `post`               | `message`                  | Same concept, different naming convention |
| `team`               | `workspace`                | Team-level grouping                       |
| `gorilla/mux` router | Express Router             | Different routing paradigm                |
| `store/sqlstore/`    | `packages/db/src/stores/`  | Store abstraction layer                   |
| `app/`               | `src/modules/*/service.ts` | Business logic                            |
| `enterprise/`        | No equivalent              | EE features gated behind build tags       |
| `plugin/`            | No equivalent              | Plugin system                             |
| `einterfaces/`       | No equivalent              | Enterprise interface definitions          |

### 2E. Missing in Current Repo (Chat Platform)

| Feature                                | Mattermost Reference                                     | Impact                  |
| -------------------------------------- | -------------------------------------------------------- | ----------------------- |
| Multi-factor authentication            | `server/platform/shared/mfa/`                            | Enterprise requirement  |
| SAML/OIDC SSO                          | `server/channels/app/saml.go`                            | Enterprise requirement  |
| LDAP directory sync                    | `server/channels/app/ldap.go`                            | Enterprise requirement  |
| Elasticsearch integration              | `server/enterprise/elasticsearch/`                       | Advanced search         |
| Plugin system                          | `server/public/plugin/` + `webapp/channels/src/plugins/` | Extensibility           |
| Compliance export                      | `server/enterprise/message_export/`                      | Regulatory requirement  |
| 64 locale support                      | `webapp/channels/src/i18n/` 64 locales                   | Internationalization    |
| Desktop app                            | `webapp/desktop/` (separate repo)                        | Native client           |
| GIF picker                             | `@giphy/react-components`                                | Rich media              |
| Math rendering (KaTeX)                 | TipTap has no math extension                             | Technical documentation |
| Interactive message blocks             | `model/post_interactive_blocks.go`                       | Rich interactivity      |
| Boards/kanban                          | Separate product                                         | Project management      |
| Playbooks                              | Separate product                                         | Incident response       |
| OpenAPI v4 spec (55 source YAML files) | `api/v4/source/`                                         | API documentation       |

### 2F. Missing in Reference Repo (Mattermost)

| Feature                            | Chat Platform                           | Notes                             |
| ---------------------------------- | --------------------------------------- | --------------------------------- |
| Infrastructure-as-Code (Terraform) | `infra/terraform/`                      | Mattermost has none               |
| Full audit pipeline                | `scripts/audits/`                       | 58 prompts, 624 findings          |
| Hardening data store               | `hardening/`                            | Finding tracking with history     |
| PWA support                        | `apps/web/public/`                      | Service worker, manifest, push    |
| AI rewrite actions                 | `apps/api/src/modules/ai/`              | AI integration                    |
| LiveKit WebRTC                     | `apps/api/src/modules/livekit/`         | WebRTC calls                      |
| Design token system                | `packages/ui/src/tokens/`               | Formalized design tokens          |
| Scheduled message sending          | `apps/api/src/modules/scheduled-posts/` | Delay/post-scheduling             |
| Storybook                          | `.storybook/`                           | Component development environment |
| Toast notification system          | `packages/ui/src/components/toast.tsx`  | In-app toast                      |
| CSS variable elevation system      | `--elevation-1` through `--elevation-6` | Design system shadows             |

### 2G. Conceptually Similar but Architecturally Different

| Concept             | Mattermost                            | Chat Platform                        |
| ------------------- | ------------------------------------- | ------------------------------------ |
| Auth                | Custom JWT + session tokens + cookie  | Supabase Auth (magic link, OAuth)    |
| State management    | Redux with complex selector chains    | React hooks + Supabase subscriptions |
| Database access     | sqlx Go queries + manual SQL          | Supabase JS client + RLS             |
| Real-time           | WebSocket hub with channels           | Socket.io with Redis + namespaces    |
| Background jobs     | Go goroutines + database polling      | BullMQ with Redis                    |
| UI styling          | SASS compiled to CSS                  | Tailwind CSS v4 utility classes      |
| API patterns        | gorilla/mux subrouters                | Express Router + middleware chain    |
| Migration tool      | morph (Go-based custom fork)          | Supabase CLI                         |
| Data access pattern | Interface-based store layer (mockery) | Interface-based store layer (manual) |
| Editor              | Textarea with markdown processing     | TipTap (ProseMirror) WYSIWYG         |

### 2H. Areas That Cannot Yet Be Mapped Reliably

- Mattermost's full plugin system surface area — chat platform has no equivalent
- Mattermost's compliance/regulatory features (message export in detail)
- Mattermost's advanced analytics/telemetry stack
- Chat platform's full API contract — would need to compare each endpoint vs Mattermost's OpenAPI spec

---

## Phase 3 — Best Implementations, Strengths, Weaknesses, and Efficiency Opportunities

### 3A. Overall Comparative Judgment

**Mattermost is more mature and feature-complete.** It has 20 years of engineering investment, a full plugin ecosystem, enterprise auth, 64 locales, extensive compliance tooling, and battle-tested scalability.

**The Chat Platform is architecturally superior in several dimensions:** modern stack (Next.js 15, Supabase, Turborepo, Tailwind, TipTap), Supabase-native auth with declarative RLS, Infrastructure-as-Code, PWA support, design token system, and automated audit pipeline.

The chat platform should NOT attempt to match Mattermost feature-for-feature. Instead, focus on architectural and UX advantages while selectively adopting Mattermost patterns where they provide clear value.

### 3B. Best Implementations in Reference Repo Worth Considering

| #   | Implementation                                                                               | Classification         | Rationale                                                                             |
| --- | -------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| 1   | **Migration management** (200 pairs, ordered, with `migrations.list` manifest)               | **Adapt conceptually** | Chat has 55 migrations but lacks a manifest for ordering validation in CI             |
| 2   | **Store interface + test pattern** (interface `XStore` + `storetest.XStore` for every store) | **Adapt conceptually** | Chat's store interfaces lack paired test helpers                                      |
| 3   | **Domain model separation** (291 files, 1 per domain)                                        | **Not worth porting**  | Chat's single `types.ts` is simpler and sufficient for current scale                  |
| 4   | **OpenAPI v4 spec** (55 YAML source files, spectral linting)                                 | **Adapt conceptually** | Chat has `openapi/` module but should expand coverage                                 |
| 5   | **API client SDK** (client4.go + @mattermost/client)                                         | **Keep current**       | Chat's `@chat/sdk` is well-designed and TypeScript-native                             |
| 6   | **Slash command handler pattern** (dedicated `slashcommands/` directory)                     | **Adapt conceptually** | Chat has slash commands in message-input.tsx; separate handler files would be cleaner |
| 7   | **Enterprise interface definitions** (`einterfaces/` for feature gating)                     | **Not worth porting**  | Chat's RBAC + permission-based gating is sufficient                                   |
| 8   | **WebSocket hub architecture** (`web_hub.go`)                                                | **Keep current**       | Socket.io is already superior for use case                                            |
| 9   | **Comprehensive test coverage** (paired \_test.go files for every handler)                   | **Adapt conceptually** | Chat has tests but not uniformly paired                                               |
| 10  | **Notification sound variety** (10+ sounds)                                                  | **Keep current**       | Chat already has 9 sounds                                                             |
| 11  | **Config management system** (file/database/memory stores with migration)                    | **Not worth porting**  | Chat uses env vars + Supabase, much simpler                                           |
| 12  | **Recap/generative summary job**                                                             | **Not worth porting**  | Low priority for current stage                                                        |
| 13  | **Email notification system** (rendering + delivery)                                         | **Keep current**       | Chat has Nodemailer in worker                                                         |
| 14  | **Read receipt tracking**                                                                    | **Adapt conceptually** | Useful for compliance use cases                                                       |
| 15  | **Expiring notifications** (expirynotify job)                                                | **Adapt conceptually** | Valuable for reminder system robustness                                               |

### 3C. Best Implementations in Current Repo That Should Stay

| #   | Implementation                         | Rationale                                                       |
| --- | -------------------------------------- | --------------------------------------------------------------- |
| 1   | **Supabase Auth with RLS**             | Declarative tenant isolation, zero custom auth code             |
| 2   | **TipTap WYSIWYG editor**              | Significantly better UX than textarea + markdown                |
| 3   | **Tailwind CSS + design tokens**       | Faster development, smaller bundles, no SASS compilation        |
| 4   | **Turborepo + pnpm**                   | Cached builds, parallel execution, strict dependency management |
| 5   | **Socket.io + Redis adapter**          | Namespace + room support, built-in reconnection, scalable       |
| 6   | **Next.js App Router**                 | SSR/SSG, streaming, route groups, layout nesting                |
| 7   | **BullMQ worker system**               | Redis-backed queues, scheduling, retry, DLQ                     |
| 8   | **Terraform IaC**                      | Reproducible infrastructure, version-controlled                 |
| 9   | **PWA support**                        | Installable, offline-capable, push notifications                |
| 10  | **Design token system**                | Consistent styling across packages, Storybook integration       |
| 11  | **Automated audit pipeline**           | 58 prompts, systematic finding tracking                         |
| 12  | **Hardening data store**               | Security posture tracking over time                             |
| 13  | **Store abstraction layer**            | `IChannelStore` / `IMessageStore` interface pattern             |
| 14  | **RBAC with 18 permissions x 3 roles** | Granular access control, middleware-enforced                    |
| 15  | **Optimistic UI hook**                 | Instant feedback, conflict resolution                           |

### 3D. Efficiency Opportunities

| #   | Opportunity                            | Which Repo | Benefit                               |
| --- | -------------------------------------- | ---------- | ------------------------------------- |
| 1   | Share OpenAPI spec generation patterns | Both       | Better API documentation              |
| 2   | Adopt Mattermost's migration manifest  | Chat       | Migration ordering safety in CI       |
| 3   | Expand i18n beyond en.json             | Chat       | Internationalization readiness        |
| 4   | Add store test helpers pattern         | Chat       | Better store test coverage            |
| 5   | Consolidate CSS variable systems       | Chat       | Single source of truth for styling    |
| 6   | Add paired test files for API handlers | Chat       | Match Mattermost's testing discipline |
| 7   | Expand worker job types                | Chat       | Only 6 vs 27 — room to grow           |
| 8   | Reduce message-input.tsx complexity    | Chat       | 1347 lines is a maintenance risk      |

### 3E. Quality Gaps in Current Repo

| Gap                              | Severity   | Details                                                |
| -------------------------------- | ---------- | ------------------------------------------------------ |
| **Single i18n locale**           | Medium     | Only en.json exists vs Mattermost's 64 locales         |
| **message-input.tsx complexity** | Medium     | 1347-line component with 28 useState hooks             |
| **No migration manifest**        | Low        | Migration ordering not validated in CI                 |
| **Dual CSS variable system**     | Low-Medium | Mattermost-style vars + design tokens create confusion |
| **Uneven test coverage**         | Medium     | Some modules have tests, many don't                    |
| **No plugin system**             | Medium     | Limited extensibility for future integrations          |
| **No enterprise auth features**  | Low-Medium | MFA, SAML, LDAP missing (but not yet needed)           |
| **No visual regression testing** | Low        | One visual snapshot spec, no Percy-like tool           |
| **No load testing in CI**        | Low        | k6 scripts exist but aren't automated in pipeline      |

### 3F. Quality Gaps in Reference Repo

| Gap                              | Details                                                 |
| -------------------------------- | ------------------------------------------------------- |
| **No Infrastructure-as-Code**    | Manual server provisioning                              |
| **SASS maintenance burden**      | ~50 SCSS files, no design tokens                        |
| **Redux complexity**             | Massive state tree, selector chain debugging challenges |
| **Textarea-based editor**        | No WYSIWYG, markdown-only editing                       |
| **No PWA support**               | Requires desktop app for native-like experience         |
| **npm (no pnpm)**                | Slower installs, no strict dependency management        |
| **No automated audit pipeline**  | Security findings tracked manually                      |
| **No CSS variable theming**      | Hardcoded colors, difficult to theme                    |
| **Webpack build (no Turborepo)** | Slower builds, no build caching across packages         |

### 3G. Quick-Win Similarity Opportunities

| #   | Opportunity                                                   | Classification         | Effort           |
| --- | ------------------------------------------------------------- | ---------------------- | ---------------- |
| 1   | Add migration manifest file                                   | **Adapt conceptually** | 1 day            |
| 2   | Expand i18n to 5-10 locales                                   | **Adapt conceptually** | 1-2 weeks        |
| 3   | Add paired \_test.go-style API tests                          | **Adapt conceptually** | Ongoing          |
| 4   | Add OpenAPI endpoint docs matching Mattermost's YAML coverage | **Adapt conceptually** | 2-3 weeks        |
| 5   | Add store test helpers                                        | **Adapt conceptually** | 1 week           |
| 6   | Extract slash command handlers to separate module             | **Adapt conceptually** | 2-3 days         |
| 7   | Add compliance export worker processor                        | **Adapt conceptually** | 1 week           |
| 8   | Add read receipt tracking                                     | **Adapt conceptually** | 3-4 days         |
| 9   | Consolidate CSS variable systems                              | **Keep current**       | 1 week (cleanup) |
| 10  | Reduce message-input.tsx by extracting subcomponents          | **Keep current**       | 2-3 days         |

### 3H. Areas Where Similarity Would Be Counterproductive

| Area                                  | Why Not                                                         |
| ------------------------------------- | --------------------------------------------------------------- |
| **Redux state management**            | React hooks + Supabase subscriptions are simpler and sufficient |
| **SASS styling**                      | Tailwind CSS is more maintainable                               |
| **Go backend**                        | TypeScript full-stack reduces context switching                 |
| **Plugin system**                     | Premature — would add complexity without clear need             |
| **Mattermost migration tool (morph)** | Supabase CLI is better integrated                               |
| **Raw WebSocket hub**                 | Socket.io provides superior DX and reconnection handling        |
| **Custom session management**         | Supabase Auth handles this with battle-tested security          |
| **Makefiles**                         | package.json scripts + Turborepo are cross-platform             |

---

## Phase 4 — Risk, Stability, and "Do Not Break" Analysis

### 4A. Security Posture Comparison

| Dimension                      | Assessment                | Details                                                                  |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------------ |
| **Auth flows**                 | **Current repo stronger** | Supabase Auth with magic link + PKCE OAuth beats custom JWT              |
| **Secrets management**         | **Equivalent**            | Both use env-based secrets; Mattermost has config DB store               |
| **HTTP security headers**      | **Current repo stronger** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options configured via helmet |
| **Input validation**           | **Current repo stronger** | Zod schemas on all mutation endpoints                                    |
| **Rate limiting**              | **Current repo stronger** | Composite key + per-endpoint + auth throttle                             |
| **Dependency vulnerabilities** | **Current repo stronger** | pnpm audit in pre-commit, Dependabot for 5 ecosystems                    |
| **Database access**            | **Current repo stronger** | Supabase RLS + service role key pattern is more modern                   |
| **Audit logging**              | **Equivalent**            | Both have audit log endpoints and middleware                             |
| **Error handling**             | **Current repo stronger** | Structured AppError classes, no stack traces in responses                |

### 4B. High-Risk Areas

| Change                                          | Risk           | Blast Radius                   | Mitigation                                         |
| ----------------------------------------------- | -------------- | ------------------------------ | -------------------------------------------------- |
| Adding a migration manifest                     | **Low-Medium** | CI pipeline only               | Would block CI on ordering mismatch; easy to fix   |
| Consolidating CSS variable systems              | **Medium**     | All UI components              | Could cause visual regressions; visual QA required |
| Extracting subcomponents from message-input.tsx | **Medium**     | Chat compose area              | Largest component; functional regression risk      |
| Adding new worker processors                    | **Low**        | Worker deployment              | Isolated by queue architecture                     |
| Expanding i18n infrastructure                   | **Low**        | Frontend components            | String lookup changes; fallback to en.json         |
| Adding read receipts                            | **Low-Medium** | Messages module + DB migration | New column, indexing considerations                |

### 4C. Medium-Risk Areas

| Change                                          | Risk           | Details                                   |
| ----------------------------------------------- | -------------- | ----------------------------------------- |
| Adding plugin system                            | **High**       | New architecture, security surface area   |
| Migrating to Mattermost's migration numbering   | **Medium**     | Would require renaming 55 migration files |
| Adopting Mattermost's store test helper pattern | **Low-Medium** | New test patterns, no production impact   |
| Notification system rewrite                     | **Medium**     | Core user-facing feature                  |
| Socket.io event model refactoring               | **High**       | Core real-time infrastructure             |

### 4D. Low-Risk Areas

| Change                          | Risk     | Details                       |
| ------------------------------- | -------- | ----------------------------- |
| Adding migration manifest       | Low      | CI-only change                |
| Adding OpenAPI endpoint docs    | Low-Code | No production impact          |
| Extracting slash command module | Low      | Isolated feature              |
| Adding store test helpers       | Low      | Test infrastructure only      |
| Compliance export worker        | Low      | New isolated worker processor |
| Adding more notification sounds | Low      | Static assets                 |

### 4E. Changes That Need Tests First

| Change                            | Why                               |
| --------------------------------- | --------------------------------- |
| CSS variable system consolidation | Visual regression risk            |
| message-input.tsx decomposition   | Core user interaction point       |
| Notification system changes       | User-facing, reliability-critical |
| Socket.io event model changes     | Core infrastructure               |
| Any migration renumbering         | Database integrity                |

### 4F. Changes That Need Manual QA / Visual QA

| Change                          | Why                                               |
| ------------------------------- | ------------------------------------------------- |
| CSS variable consolidation      | Visual appearance across light/dark modes         |
| message-input.tsx decomposition | Editor behavior, keyboard shortcuts, autocomplete |
| Notification sound changes      | User experience                                   |
| Sidebar/category refactoring    | Layout-dependent                                  |
| Mobile layout changes           | Responsive design                                 |

### 4G. Do-Not-Break Guardrails

```
CRITICAL (must not break):
  G1. Authentication — all sessions, all flows (magic link, OAuth)
  G2. Message delivery — no loss, no duplication, no silent drops
  G3. RLS policies — never make them less restrictive
  G4. Real-time connections — no silent disconnects or duplicate events
  G5. Database migrations — always reversible (down scripts)

HIGH (serious impact):
  G6. API contracts — SDK consumers depend on stable endpoints
  G7. UI layout — responsive design must remain functional
  G8. Search functionality — tsvector queries and results
  G9. File upload/download paths
  G10. Notification delivery (in-app, push, email)
  G11. CSP/HSTS/security headers — never weaken
  G12. Env var contracts — CI/CD depends on documented vars
```

### 4H. Safe Areas for Early Improvement

1. Migration manifest (CI only)
2. OpenAPI coverage expansion (non-production)
3. Store test helpers (test infrastructure)
4. Compliance export worker (new isolated feature)
5. Worker processor expansion (separate queue, no service impact)
6. Documentation improvements
7. Test coverage expansion

---

## Phase 5 — Safe Alignment Roadmap

### 5A. Roadmap Summary

```
Phase 0: Observation only         (July 9-10)
Phase 1: No-risk wins             (July 10-14)
Phase 2: Low-risk alignment       (July 14-21)
Phase 3: Medium-risk convergence  (July 21-28)
Phase 4: Strategic optional       (August+)
Phase 5: Future cleanup           (TBD)
```

### 5B. Immediate Low-Risk Wins

| #   | Item                                                              | Classification         | Days |
| --- | ----------------------------------------------------------------- | ---------------------- | ---- |
| 1   | Add migration manifest to CI                                      | **Adapt conceptually** | 0.5  |
| 2   | Add OpenAPI endpoint coverage for undocumented modules            | **Adapt conceptually** | 2    |
| 3   | Add store test helpers for existing interfaces                    | **Adapt conceptually** | 2    |
| 4   | Extract slash commands from message-input.tsx to dedicated module | **Adapt conceptually** | 1    |
| 5   | Add read receipt tracking option                                  | **Adapt conceptually** | 2    |
| 6   | Expand notification sounds to match Mattermost's variety          | **Keep current**       | 0.5  |

### 5C. Low-Risk Similarity Improvements

| #   | Item                                                        | Classification         | Days |
| --- | ----------------------------------------------------------- | ---------------------- | ---- |
| 7   | Add compliance export worker processor                      | **Adapt conceptually** | 3    |
| 8   | Add data retention report generation                        | **Adapt conceptually** | 2    |
| 9   | Add expirynotify-style reminder escalation                  | **Adapt conceptually** | 2    |
| 10  | Add channel member history retention job                    | **Adapt conceptually** | 1    |
| 11  | Expand i18n to 5 additional locales (es, fr, de, ja, pt-BR) | **Adapt conceptually** | 5    |
| 12  | Add email notification template rendering                   | **Adapt conceptually** | 3    |

### 5D. Medium-Risk Convergence Candidates

| #   | Item                                                      | Classification         | Days |
| --- | --------------------------------------------------------- | ---------------------- | ---- |
| 13  | Consolidate CSS variable systems (single source of truth) | **Keep current**       | 3    |
| 14  | Decompose message-input.tsx into smaller subcomponents    | **Keep current**       | 3    |
| 15  | Add paired API test files for all 25 modules              | **Adapt conceptually** | 5    |
| 16  | Add E2E tests for file upload + search flows              | **Keep current**       | 2    |
| 17  | Add visual regression testing with Percy or similar       | **Adapt conceptually** | 2    |

### 5E. Optional Strategic Improvements

| #   | Item                         | Classification        | Days |
| --- | ---------------------------- | --------------------- | ---- |
| 18  | Multi-factor authentication  | **Not worth porting** | 5    |
| 19  | Plugin system design         | **Not worth porting** | 10+  |
| 20  | Desktop app (Tauri/Electron) | **Not worth porting** | 10+  |
| 21  | Elasticsearch integration    | **Not worth porting** | 5    |
| 22  | 64-locale i18n expansion     | **Not worth porting** | 10+  |

### 5F. What Must Stay As-Is

- Supabase Auth (do NOT replace with custom JWT)
- Socket.io (do NOT replace with raw WebSocket hub)
- Tailwind CSS + design tokens (do NOT revert to SASS)
- TipTap editor (do NOT revert to textarea + markdown)
- Turborepo + pnpm (do NOT migrate to npm workspaces)
- Next.js App Router (do NOT revert to SPA)
- BullMQ workers (do NOT replace with database polling goroutines)
- Terraform IaC (do NOT revert to manual provisioning)
- PWA support (do NOT remove for desktop app parity)

### 5G. Recommended Execution Order

```
Week 1 (July 9-14):
  [P0-1] Migration manifest + CI check
  [P0-2] OpenAPI coverage expansion
  [P0-3] Store test helpers
  [P0-4] Extract slash commands module

Week 2 (July 14-21):
  [P0-5] Read receipts
  [P1-3] Compliance export worker
  [P1-4] Data retention report
  [P1-6] Email notification templates

Week 3 (July 21-28):
  [P1-5] Expand i18n to 5 locales
  [P1-1] CSS variable consolidation
  [P1-2] message-input.tsx decomposition
  [P2-1] Paired API tests for all modules

Week 4+ (August+):
  [P2-4] Visual regression testing
  [P2-5] E2E test expansion
  Strategic evaluation of EE features (MFA, plugins, desktop)
```

### 5H. Minimum Validation Gate Before Each Phase

| Phase Transition | Validation Required                                                   |
| ---------------- | --------------------------------------------------------------------- |
| P0 → P1          | All CI tests pass, lint clean, typecheck clean                        |
| P1 → P2          | All P0 items deployed and healthy for 48h                             |
| P2 → P3          | All P1 items deployed, E2E tests passing, visual QA sign-off          |
| P3 → P4          | All P2 items deployed, load test passes, no regressions in monitoring |

---

## Phase 6 — File-by-File / Area-by-Area Change Plan

### 6A. Highest-Priority Target Areas

| Priority | Area                                                   | Reason                                         |
| -------- | ------------------------------------------------------ | ---------------------------------------------- |
| P1       | `supabase/` + CI                                       | Add migration manifest for ordering validation |
| P2       | `apps/api/src/modules/openapi/`                        | Expand OpenAPI documentation                   |
| P3       | `packages/db/src/stores/`                              | Add store test helpers                         |
| P4       | `apps/web/components/chat/message-input.tsx`           | Reduce complexity via extraction               |
| P5       | `apps/web/app/globals.css` + `packages/ui/src/tokens/` | Consolidate CSS variable systems               |
| P6       | `apps/worker/src/processors/`                          | Add compliance export processor                |

### 6B. Likely Files/Folders to Touch First

1. **Migration manifest:**
   - Create `supabase/migrations/migrations.list`
   - Update `scripts/verify-migrations.js` to check against manifest
   - Add migration manifest verification step to `ci.yml`

2. **OpenAPI coverage:**
   - `apps/api/src/modules/openapi/routes.ts` — add remaining module endpoints
   - Update or reference `docs/api-contracts.md`

3. **Store test helpers:**
   - `packages/db/src/stores/__tests__/` — add store test helper files
   - Mirror the pattern from `packages/db/src/stores/channel-store.ts`

4. **Slash command extraction:**
   - Create `apps/web/lib/slash-commands/` directory
   - Extract command definitions from `message-input.tsx`
   - Update imports

5. **CSS consolidation:**
   - `packages/ui/src/tokens/semantic-colors.ts` — merge with globals.css variables
   - `apps/web/app/globals.css` — reference design tokens instead of duplicating
   - Update `packages/ui/src/styles.css` if needed

### 6C. Likely Files/Folders to Avoid Touching Early

| File/Folder                                  | Reason                                           |
| -------------------------------------------- | ------------------------------------------------ |
| `apps/web/components/chat/message-input.tsx` | Wait until subcomponent extraction plan is ready |
| `apps/api/src/middleware/authenticate.ts`    | Core auth — any change is high risk              |
| `apps/api/src/lib/socket.ts`                 | Core real-time infrastructure                    |
| `apps/web/app/(workspace)/layout.tsx`        | Core layout — visual regression risk             |
| `supabase/policies/`                         | RLS changes must be carefully reviewed           |
| `.github/workflows/deploy-*.yml`             | Deployment pipelines are production-critical     |
| `infra/terraform/`                           | Infrastructure changes affect live environments  |

### 6D. Structural Cleanup Candidates

| Item               | Current                                            | Proposed                                   |
| ------------------ | -------------------------------------------------- | ------------------------------------------ |
| Slash commands     | Defined inline in `message-input.tsx` (1347 lines) | Extracted to `lib/slash-commands/`         |
| CSS variables      | Dual system (globals.css + design tokens)          | Consolidated to single source of truth     |
| Migration ordering | Implicit by filename prefix                        | Explicit `migrations.list` manifest        |
| API tests          | Partial coverage across 25 modules                 | Paired test files for all modules          |
| Worker processors  | 6 processors in `apps/worker/src/processors/`      | Add compliance + email template processors |

### 6E. UI/UX Alignment Candidates

| Candidate                | Mattermost Reference                         | Chat Platform Action                             |
| ------------------------ | -------------------------------------------- | ------------------------------------------------ |
| Channel header design    | `channel_header/` components                 | Already implemented in `chat-view.tsx`           |
| Profile popover          | `profile_popover/`                           | Already implemented in `profile-popover.tsx`     |
| Search bar hints         | `search_bar/` with operator hints            | Already implemented in `search-bar.tsx`          |
| Keyboard shortcuts modal | `keyboard_shortcuts/`                        | Already implemented in `keyboard-shortcuts.tsx`  |
| Quick switcher           | `quick_switch_modal/`                        | Already implemented in `quick-switcher.tsx`      |
| Emoji picker             | `emoji_picker/` with categories + skin tones | Already implemented (3357 emojis, 11 categories) |
| File preview modal       | `file_preview_modal/` with zoom/navigation   | Already implemented in `file-preview.tsx`        |
| GIF picker               | `gif_picker/` via @giphy                     | Not implemented — low priority                   |
| Math rendering           | KaTeX integration                            | Not implemented — strategic                      |

All previously identified UI/UX gaps were addressed in the July 9, 2026 deep audit (50 findings, all resolved).

### 6F. API/Service Layer Alignment Candidates

| Candidate                | Mattermost Reference               | Chat Platform Action                    |
| ------------------------ | ---------------------------------- | --------------------------------------- |
| Migration manifest       | `migrations.list` checked into git | Add to `supabase/migrations/`           |
| Pagination patterns      | `page`/`per_page` query params     | Already implemented in `pagination.ts`  |
| Error response format    | Structured error codes             | Already implemented in `app-error.ts`   |
| Rate limit configuration | Configurable per-endpoint          | Already implemented via `rate-limit.ts` |
| Audit logging middleware | `audit_logging.go` middleware      | Already implemented in audit service    |

### 6G. Shared Utility / Abstraction Candidates

| Candidate                | Current                          | Proposed                                                                                 |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------- |
| Store test helpers       | `packages/db/src/stores/`        | Add `storetest/` directory with test fixtures                                            |
| Email template rendering | Inline in notification processor | Extracted to `packages/db/src/stores/notification-store.ts` or dedicated template module |
| OpenAPI spec generation  | Manual in `openapi/routes.ts`    | Automate from Zod schemas                                                                |
| i18n extraction          | `scripts/local/extract-i18n.mjs` | Integrate into build pipeline                                                            |

### 6H. Test Coverage Needed Before Refactor

| Refactor                        | Tests Needed                                                             |
| ------------------------------- | ------------------------------------------------------------------------ |
| message-input.tsx decomposition | Unit tests for each extracted subcomponent, E2E test for message sending |
| CSS variable consolidation      | Visual regression test suite                                             |
| Notification system changes     | Integration tests for notification delivery paths                        |
| Socket.io event model changes   | Integration tests for real-time events                                   |

### 6I. Documentation / Runbook Improvements

| Doc                     | Current Status                      | Proposed                                        |
| ----------------------- | ----------------------------------- | ----------------------------------------------- |
| API contracts           | `docs/api-contracts.md` (10k chars) | Expand with OpenAPI-generated reference         |
| Migration guide         | Runbook exists                      | Add manifest verification + ordering section    |
| i18n contribution guide | Missing                             | Add documentation for adding new locales        |
| Worker processor guide  | Missing                             | Add documentation for adding new processors     |
| Store abstraction guide | Missing                             | Add guide for implementing new store interfaces |

### 6J. Safe Patch Grouping Proposal

```
Patch Group A: CI/Infrastructure (no production impact)
  - Migration manifest + CI check
  - OpenAPI spec updates
  - Store test helpers

Patch Group B: New Features (no regression risk)
  - Compliance export worker
  - Read receipt tracking
  - Email notification templates

Patch Group C: Refactoring (needs tests + QA)
  - Slash command extraction
  - message-input.tsx decomposition
  - CSS variable consolidation

Patch Group D: Expansion (incremental)
  - i18n expansion (5 locales)
  - Paired API tests for all modules
  - E2E test expansion

Patch Group E: Strategic (requires planning)
  - Visual regression testing
  - Notification system enhancement
  - Worker processor expansion
```

---

## Phase 7 — Patch Set Design / Execution Plan

### 7A. Patch Set 1: No-Risk Infrastructure Cleanup

**Objective:** Establish CI guardrails and documentation without touching production code.

**Areas:**

- `supabase/migrations/` — add `migrations.list` manifest
- `scripts/verify-migrations.js` — add manifest ordering check
- `.github/workflows/ci.yml` — add migration verification step
- `apps/api/src/modules/openapi/` — expand endpoint coverage

**Risk Level:** Very Low (CI-only changes, no production impact)

**Validation:**

- CI passes with migration verification
- No application code changes

**Rollback:** Revert manifest file and CI step

### 7B. Patch Set 2: Low-Risk Store Test Infrastructure

**Objective:** Add store test helpers to improve testing discipline.

**Areas:**

- `packages/db/src/stores/` — add `__tests__/` with helper functions
- `packages/db/src/stores/channel-store.ts` — add test helper
- `packages/db/src/stores/message-store.ts` — add test helper
- `packages/db/src/stores/notification-store.ts` — add test helper
- `packages/db/src/stores/reaction-store.ts` — add test helper
- `packages/db/src/stores/workspace-store.ts` — add test helper

**Risk Level:** Low (test infrastructure only)

**Validation:**

- Tests pass
- No production code changes

**Rollback:** Remove test helper files

### 7C. Patch Set 3: Low-Risk Feature Extraction

**Objective:** Reduce message-input.tsx complexity by extracting slash commands.

**Areas:**

- Create `apps/web/lib/slash-commands/` with command definitions
- Extract `/me`, `/code`, `/shrug`, `/poll`, `/gif`, `/joke`, `/help` handlers
- Update `message-input.tsx` imports
- Add unit tests for slash command handlers

**Risk Level:** Low (isolated feature extraction)

**Validation:**

- Unit tests pass for all slash commands
- Manual verification of each command in staging
- E2E messaging test passes

**Rollback:** Restore inline commands, remove module

### 7D. Patch Set 4: Medium-Risk CSS Consolidation

**Objective:** Merge dual CSS variable systems into single source of truth.

**Areas:**

- `apps/web/app/globals.css` — reference design tokens instead of duplicating colors
- `packages/ui/src/tokens/semantic-colors.ts` — ensure all globals.css variables are represented
- `packages/ui/src/styles.css` — update if needed

**Risk Level:** Medium (visual regression risk)

**Prerequisites:**

- Patch runs in staging for 48h
- Visual QA sign-off on light + dark mode
- Screenshot comparison across major views (login, workspace, channel, thread, settings)

**Validation:**

- Visual snapshot tests pass
- No visual regressions in light/dark mode
- All CSS variables resolve correctly

**Rollback:** Revert globals.css and token files to pre-consolidation state

### 7E. Patch Set 5: Low-Risk New Features

**Objective:** Add compliance export and read receipt features.

**Areas:**

- `apps/worker/src/processors/compliance-export.ts` — new processor
- `apps/api/src/modules/export/routes.ts` — expand for compliance format
- `supabase/migrations/` — add read_receipts table if needed
- `apps/api/src/modules/messages/` — add read receipt logic

**Risk Level:** Low (isolated new features)

**Validation:**

- Worker starts and processes queue correctly
- Export endpoint returns expected format
- Read receipts tracked correctly for authenticated users

**Rollback:** Disable processor, remove endpoint, revert migration

### 7F. Patch Set 6: Paired API Tests

**Objective:** Add paired test files for all 25 API modules.

**Areas:**

- `apps/api/src/modules/*/__tests__/` — add/modify test files
- Cover: health, auth, channels, messages, threads, reactions, notifications, webhooks, etc.

**Risk Level:** Low (test-only changes)

**Validation:**

- `pnpm test` passes
- Coverage increases

**Rollback:** Remove added test files

### 7G. Patch Set 7: i18n Expansion (5 Locales)

**Objective:** Add es, fr, de, ja, pt-BR locales.

**Areas:**

- `apps/web/lib/i18n/es.json`, `fr.json`, `de.json`, `ja.json`, `pt-BR.json`
- `apps/web/lib/i18n/index.ts` — register new locales
- Update i18n extraction script to support multiple locales

**Risk Level:** Low-Medium (data entry, string fallback)

**Validation:**

- Each locale renders correctly
- Fallback to en.json for missing keys

**Rollback:** Remove locale files, revert index.ts

### 7H. Top 20 Prioritized Recommendations

| #   | Recommendation                             | Patch Set | Risk     | Value   | Days |
| --- | ------------------------------------------ | --------- | -------- | ------- | ---- |
| 1   | Migration manifest + CI check              | PS1       | Very Low | High    | 0.5  |
| 2   | OpenAPI endpoint coverage                  | PS1       | Very Low | Medium  | 2    |
| 3   | Store test helpers                         | PS2       | Low      | High    | 2    |
| 4   | Extract slash commands                     | PS3       | Low      | Medium  | 1    |
| 5   | CSS variable consolidation                 | PS4       | Medium   | High    | 3    |
| 6   | Compliance export worker                   | PS5       | Low      | Medium  | 3    |
| 7   | Read receipt tracking                      | PS5       | Low      | Low-Med | 2    |
| 8   | Email notification templates               | PS5       | Low      | Medium  | 3    |
| 9   | Paired API tests (all modules)             | PS6       | Low      | High    | 5    |
| 10  | i18n expansion (5 locales)                 | PS7       | Low-Med  | Medium  | 5    |
| 11  | message-input.tsx decomposition            | PS4       | Medium   | High    | 3    |
| 12  | E2E test expansion                         | PS6       | Low      | High    | 2    |
| 13  | Visual regression testing                  | PS6       | Low      | Medium  | 2    |
| 14  | Data retention report processor            | PS5       | Low      | Low     | 2    |
| 15  | Expirynotify reminder escalation           | PS5       | Low      | Low     | 2    |
| 16  | Channel member history retention           | PS5       | Low      | Low     | 1    |
| 17  | Add more notification sounds               | PS5       | Very Low | Low     | 0.5  |
| 18  | Documentation updates (API, i18n, workers) | PS1       | Very Low | Medium  | 2    |
| 19  | Worker processor documentation guide       | PS1       | Very Low | Low     | 1    |
| 20  | Enhanced CSP with nonces for API           | PS4       | Medium   | Medium  | 2    |

### 7I. Quick Wins

1. Migration manifest + CI check (0.5 day, no risk)
2. OpenAPI endpoint coverage (2 days, no risk)
3. Store test helpers (2 days, no risk)
4. Extract slash commands (1 day, low risk)
5. Add notification sounds (0.5 day, no risk)

### 7J. Needs-Tests-First List

1. CSS variable consolidation — needs visual regression tests
2. message-input.tsx decomposition — needs subcomponent unit tests + E2E
3. Notification system changes — needs integration tests
4. Socket.io event model changes — needs integration tests

### 7K. Copy-from-Reference List

**Adapt conceptually (not copy as-is):**

- Migration manifest pattern
- Store test helper pattern
- Paired API test pattern
- Email notification template rendering approach
- Compliance export approach

### 7L. Adapt-Don't-Copy List

- Migration management (Mattermost uses morph; chat uses Supabase CLI)
- Store layer testing (Go interfaces + mockery vs TypeScript interfaces + Vitest)
- Notification email rendering (Go templates vs JSX/template strings)
- OpenAPI spec (Go struct annotations vs Zod-to-OpenAPI generators)
- Slash command handling (Go struct pattern vs TypeScript module)

### 7M. Leave-Alone List

- Auth (Supabase Auth > custom JWT)
- State management (hooks + subscriptions > Redux)
- Styling (Tailwind + tokens > SASS)
- Real-time (Socket.io > raw WebSocket)
- Editor (TipTap > textarea)
- Build system (Turborepo + pnpm > npm workspaces + Webpack)
- Infrastructure (Terraform + Docker > manual)
- Worker system (BullMQ + Redis > Go goroutines + DB polling)

### 7N. Best Order of Execution

```
Week 1: PS1 (migration manifest, OpenAPI, docs) → PS2 (store test helpers) → PS3 (slash commands)
Week 2: PS5 (compliance export, read receipts, email templates)
Week 3: PS4 (CSS consolidation, message-input decomposition) + PS6 (paired API tests)
Week 4: PS7 (i18n) + remaining PS6 (E2E, visual regression)
```

---

## Phase 8 — Final Reconciliation / Single Source of Truth Audit

### 8A. Executive Summary

This comparative audit confirms the July 7 reconciliation while incorporating the UI/UX deep audit (July 9) findings. Key conclusions remain:

**Do not mirror Mattermost's architecture.** The current repo's modern stack (Next.js 15, Supabase, Turborepo, pnpm, Tailwind, Socket.io, BullMQ) is architecturally superior for a greenfield project. Mattermost's advantages are in feature breadth (plugin system, enterprise auth, 67 locales, 27 job types) and maturity, not architectural patterns.

**The gap has narrowed since July 7.** The UI/UX deep audit (50 findings resolved), auto-responder feature, and PWA improvements have closed several previous gaps.

**Remaining gaps are strategic, not architectural.** MFA, SAML/LDAP, plugin system, 64-locale i18n — these are enterprise features that should be added when customer demand justifies the investment, not preemptively.

### 8B. High-Level Repo Comparison

| Dimension        | Mattermost v11.9.0          | Chat Platform (July 9, 2026)       | Advantage            |
| ---------------- | --------------------------- | ---------------------------------- | -------------------- |
| Backend language | Go 1.26                     | TypeScript 5.9 (Node 22)           | Chat (full-stack TS) |
| Frontend         | React 18 SPA (Webpack)      | Next.js 15 (App Router)            | Chat (SSR/SSG)       |
| State management | Redux                       | React hooks + subscriptions        | Chat (simpler)       |
| Styling          | SASS (SCSS)                 | Tailwind CSS v4 + tokens           | Chat (maintainable)  |
| Auth             | Custom JWT + sessions       | Supabase Auth (magic link + OAuth) | Chat (battle-tested) |
| Database         | PostgreSQL (+ MySQL legacy) | Supabase (PostgreSQL 17)           | Equivalent           |
| Real-time        | Raw WebSocket hub           | Socket.io + Redis                  | Chat (better DX)     |
| Editor           | Textarea + markdown         | TipTap WYSIWYG                     | Chat (richer UX)     |
| Jobs             | 27 types (Go goroutines)    | 6 types (BullMQ + Redis)           | Mattermost (more)    |
| i18n             | 64 locales                  | 1 locale                           | Mattermost           |
| Plugins          | Full plugin framework       | None                               | Mattermost           |
| Enterprise auth  | MFA, SAML, LDAP             | None                               | Mattermost           |
| IaC              | None                        | Terraform (DO)                     | Chat                 |
| PWA              | No                          | Yes                                | Chat                 |
| Audit pipeline   | None                        | 58 prompts, 624 findings           | Chat                 |
| Design system    | None                        | Token system + Storybook           | Chat                 |
| Migration count  | 200 pairs                   | 55 pairs                           | Mattermost           |
| Source files     | ~3,000+                     | ~500+                              | Mattermost (bigger)  |

### 8C. Detailed Mapping Summary

Complete mapping provided in Phase 2 above. Key equivalents:

| Mattermost                      | Chat Platform                      | Notes                       |
| ------------------------------- | ---------------------------------- | --------------------------- |
| `channels/api4/` → 167 handlers | `modules/` → 25 modules            | 6.7x more API surface       |
| `channels/app/` → 293 files     | `modules/*/service.ts` → ~25 files | 11.7x more business logic   |
| `public/model/` → 291 files     | `types.ts` → 1 file                | 291x more model definitions |
| `channels/jobs/` → 27 types     | `processors/` → 6 types            | 4.5x more job types         |
| `platform/types/` → 61 files    | `db/src/types.ts` → 1 file         | 61x more type definitions   |
| `components/` → 350+ dirs       | `components/` → ~35 components     | 10x more components         |

### 8D. Best Implementations Worth Adopting

From Phase 3 analysis — adapted to current repo context:

1. **Migration manifest** — single file listing migration order for CI validation
2. **Store test helpers** — paired test helpers for each store interface
3. **Paired API test pattern** — test file alongside every route file
4. **Compliance export** — meeting regulatory requirements
5. **Email notification templates** — professional HTML emails
6. **Read receipt tracking** — parity with Mattermost messaging features
7. **Expiring notifications** — reminder system robustness
8. **Channel member history** — audit trail for membership changes

### 8E. Areas the Current Repo Should Keep As-Is

(Consolidated from Phase 5F)

**Architecture:**

- Supabase Auth + RLS (not custom JWT)
- Socket.io (not raw WebSocket)
- Tailwind CSS + design tokens (not SASS)
- TipTap (not textarea + markdown)
- Turborepo + pnpm (not npm workspaces + Webpack)
- Next.js App Router (not SPA)
- BullMQ workers (not Go goroutines + DB polling)
- Terraform IaC

**Features:**

- PWA support
- AI rewrite actions
- LiveKit WebRTC integration
- Scheduled message sending
- Design token system
- Automated audit pipeline
- Hardening data store

### 8F. Efficiency Opportunities

1. **CSS variable consolidation** — dual system creates confusion
2. **message-input.tsx decomposition** — 1347-line component is a maintenance risk
3. **Migration manifest** — implicit ordering is fragile
4. **i18n expansion** — single locale limits reach
5. **Worker processor expansion** — only 6 processors vs Mattermost's 27
6. **API test coverage** — uneven across 25 modules
7. **E2E test coverage** — 6 specs, room for growth

### 8G. Risk Register

| Risk                                              | Likelihood | Impact | Mitigation                                     |
| ------------------------------------------------- | ---------- | ------ | ---------------------------------------------- |
| CSS consolidation causes visual regression        | Medium     | Medium | Visual QA, staged rollout, screenshot diff     |
| message-input.tsx refactor breaks editor behavior | Medium     | High   | Unit tests + E2E + manual QA before merge      |
| Migration renumbering blocks CI                   | Low        | Low    | Migration manifest prevents accidental reorder |
| New worker processor overloads Redis              | Low        | Medium | Monitor queue depth, configure concurrency     |
| i18n expansion misses strings                     | Low        | Low    | Fallback to en.json, extraction script         |
| Notification system changes drop events           | Low        | High   | Integration tests, circuit breaker pattern     |

### 8H. Safe Alignment Roadmap

(Full roadmap from Phase 5, condensed)

| Phase | Timeline | Focus              | Items                                                            |
| ----- | -------- | ------------------ | ---------------------------------------------------------------- |
| P0    | Week 1   | No-risk wins       | Migration manifest, OpenAPI, store test helpers, slash commands  |
| P1    | Week 2   | Low-risk features  | Compliance export, read receipts, email templates                |
| P2    | Week 3   | Medium convergence | CSS consolidation, message-input decomposition, paired API tests |
| P3    | Week 4+  | Expansion          | i18n 5 locales, E2E expansion, visual regression                 |
| P4    | August+  | Strategic optional | MFA, plugins, desktop app (gate on demand)                       |

### 8I. File/Area Change Recommendations

See Phase 6 for complete list. Top recommendations:

| File/Area                                    | Action                     | Priority | Risk    |
| -------------------------------------------- | -------------------------- | -------- | ------- |
| `supabase/migrations/`                       | Add `migrations.list`      | P0       | None    |
| `.github/workflows/ci.yml`                   | Add migration verification | P0       | None    |
| `apps/api/src/modules/openapi/`              | Expand coverage            | P0       | None    |
| `packages/db/src/stores/`                    | Add test helpers           | P1       | None    |
| `apps/web/components/chat/message-input.tsx` | Extract slash commands     | P1       | Low     |
| `apps/worker/src/processors/`                | Add compliance export      | P2       | Low     |
| `apps/web/app/globals.css` + tokens          | Consolidate CSS            | P2       | Medium  |
| `apps/web/lib/i18n/`                         | Add 5 locales              | P3       | Low-Med |

### 8J. Do-Not-Break Guardrails

```
CRITICAL:
  G1. Authentication — all sessions, all flows
  G2. Message delivery — no loss, no duplication
  G3. RLS policies — never less restrictive
  G4. Real-time connections — no silent disconnects
  G5. Database migrations — always reversible

HIGH:
  G6. API contracts — SDK consumers depend on stable endpoints
  G7. UI layout — responsive design must remain functional
  G8. Search functionality — tsvector queries
  G9. File upload/download
  G10. Notification delivery (in-app, push, email)
  G11. CSP/HSTS/security headers — never weaken
  G12. Env var contracts — CI/CD dependencies
```

### 8K. Validation Checklist

Before deploying any alignment work:

- [ ] All CI checks pass (test, lint, typecheck, build)
- [ ] E2E tests pass (auth-workspace-chat, comprehensive)
- [ ] No regression in existing functionality
- [ ] Visual QA sign-off for CSS changes
- [ ] Manual verification in staging environment
- [ ] Rollback plan documented
- [ ] Migration reversible (down script provided)
- [ ] API contract changes communicated (if breaking)
- [ ] Monitoring dashboards checked post-deploy
- [ ] Worker queue health verified

### 8L. Final Recommendation

**Continue as-is with targeted alignment.** The current repo does not need to match Mattermost's architecture. Instead:

1. **Immediately adopt** the migration manifest pattern (0.5 day, zero risk)
2. **Within 2 weeks** complete all Phase 0/1 items (store test helpers, slash commands extraction, OpenAPI expansion)
3. **Within 4 weeks** complete Phase 2 (CSS consolidation, message-input decomposition, paired tests)
4. **Gate Phase 3+** (i18n, E2E expansion, visual regression) on product requirements
5. **Gate enterprise features** (MFA, SAML, LDAP, plugins) on customer demand

The existing comparative audit (`docs/audits/compare/full_comparative_repo_audit.md`) already covers the major architectural decisions correctly. This re-execution validates those conclusions and adds finer-grained implementation recommendations.

**Key new finding since July 7:** The UI/UX deep audit (July 9) resolved all 50 findings, closing the visual/accessibility gap with Mattermost. The remaining gaps are entirely in feature breadth (MFA, i18n count, plugins, enterprise auth), not in architectural quality or UX polish.

---

_Audit completed: July 9, 2026_
_Reference: C:\temp\mattermost-master (Mattermost v11.9.0)_
_Current: C:\temp\chat (Chat Platform)_
_8 phases executed, 50+ pages of analysis_
