# Phase 3: Strengths & Weaknesses — Comparative Audit

## What Mattermost Does Better (with Classification)

### COPY — Directly port to Chat

| #   | Feature                                                                    | MM File(s)                                               | Effort | Priority | Rationale                                                                                           |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------- |
| 1   | Migration down scripts (Chat already has 52 — ensure coverage is complete) | —                                                        | Low    | P2       | Chat has rollbacks, verify all 53 migrations have matching down scripts                             |
| 2   | Notification sound variety (MM has 10 distinct sounds)                     | `webapp/channels/src/sounds/`                            | Low    | P3       | Chat has 9; could add 1 more for parity                                                             |
| 3   | Channel intro renderer (welcome message on empty channel)                  | `webapp/channels/src/components/channel_intro_renderer/` | Low    | P3       | Nice UX touch for new channel members                                                               |
| 4   | `/msg` (DM shortcut) and `/join` slash commands                            | `server/channels/app/slashcommands/command_msg.go`       | Low    | P3       | Chat has `/me`, `/code`, `/shrug`, `/poll`, `/gif`, `/joke`, `/help` — could add `/msg` and `/join` |
| 5   | Post deleted modal (undo toast)                                            | `webapp/channels/src/components/post_deleted_modal/`     | Low    | P3       | UX improvement                                                                                      |
| 6   | Scroll to bottom toast                                                     | `webapp/channels/src/components/scroll_to_bottom_toast/` | Low    | P3       | Common UX pattern                                                                                   |

### ADAPT — Implement with Chat's architectural approach

| #   | Feature                                       | MM File(s)                                                 | Effort    | Priority | Adaptation                                                      |
| --- | --------------------------------------------- | ---------------------------------------------------------- | --------- | -------- | --------------------------------------------------------------- |
| 1   | i18n expansion (Chat has 1 locale, MM has 68) | `webapp/channels/src/i18n/` (68 files)                     | High      | P2       | Use Chat's existing i18n infrastructure, expand to 5-10 locales |
| 2   | Admin console UI                              | `webapp/channels/src/components/admin_console/`            | Very High | P3       | Build as Next.js admin routes, not a separate SPA               |
| 3   | Channel move to category (drag-drop)          | `webapp/channels/src/components/channel_move_to_sub_menu/` | Medium    | P3       | Implement via Chat's sidebar API                                |
| 4   | Drafts page (saved drafts)                    | `webapp/channels/src/components/drafts/` (20+ files)       | Medium    | P3       | Build as channel view filter, not separate page                 |
| 5   | Autocomplete hints (`from:`, `in:`)           | `webapp/channels/src/components/search_hint/`              | Low       | P3       | Add to Chat's search bar                                        |
| 6   | File extension search suggestions             | `webapp/channels/src/components/search/`                   | Low       | P3       | Add to search filters                                           |
| 7   | Post priority indicators                      | `server/channels/app/post_priority.go`                     | Low       | P3       | Add optional priority column                                    |
| 8   | MFA/2FA support                               | `server/platform/shared/mfa/`                              | High      | P2       | Implement via Supabase Auth (has built-in MFA support)          |

### SKIP — Not worth implementing

| #   | Feature                                | Reason                                                                                       |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Plugin system + marketplace            | Chat is a single-tenant SaaS; plugins add complexity without proportional benefit            |
| 2   | MySQL database support                 | Chat uses Supabase (Postgres-only); dual-DB support is unnecessary                           |
| 3   | Enterprise tier licensing              | Chat is open-source monolithic; enterprise split adds complexity                             |
| 4   | Bot accounts system                    | Can be handled via webhooks + API key instead                                                |
| 5   | OAuth app registration portal          | Low usage in single-tenant; API keys suffice                                                 |
| 6   | mmctl CLI                              | Chat has API + SDK; CLI is redundant for web-first SaaS                                      |
| 7   | Server performance telemetry subsystem | Chat can use APM tools (Sentry, DataDog) instead                                             |
| 8   | MJML email templates                   | Chat uses plain HTML/Nodemailer; MJML adds toolchain complexity                              |
| 9   | Elasticsearch integration              | Chat's tsvector search is adequate for current scale                                         |
| 10  | Slack import                           | Low priority feature; Chat can reuse format converters if needed                             |
| 11  | Global relay compliance export         | Low priority; Chat's export module suffices                                                  |
| 12  | LDAP/SAML/AD auth                      | Chat uses Supabase Auth (Google/GitHub/magic link) — enterprise SSO can be added when needed |
| 13  | Boards/Kanban                          | Out of scope for Chat's messaging focus                                                      |

### KEEP — Preserve Chat's approach (do not change)

| #   | Chat Feature                   | Why Keep                                   | MM Equivalent                        |
| --- | ------------------------------ | ------------------------------------------ | ------------------------------------ |
| 1   | Turborepo + pnpm monorepo      | Build speed, cache, parallel execution     | Makefile + Webpack (slower, complex) |
| 2   | Tailwind CSS + design tokens   | Maintainable styling, no SASS baggage      | SASS (`.scss` files throughout)      |
| 3   | Supabase + RLS                 | Declarative auth, less code                | Custom middleware auth in Go         |
| 4   | React context/hooks (no Redux) | Simpler state management, less boilerplate | Redux (actions, reducers, selectors) |
| 5   | Next.js App Router             | SSR, file-based routing, layouts           | Custom Go templating + React SPA     |
| 6   | Store abstraction layer        | Testability, swap DB backends              | Direct sqlstore usage                |
| 7   | BullMQ background jobs         | Modern queue system, observability         | Custom Go job scheduler              |
| 8   | Socket.io (vs raw WebSocket)   | Rooms, auto-reconnect, fallback transport  | Raw Go WebSocket                     |
| 9   | Terraform IaC                  | Reproducible infra, change tracking        | No IaC (manual setup)                |
| 10  | Rollback migration scripts     | Safe deployments, undo capability          | No rollback support                  |
| 11  | Optimistic UI hook             | Instant UX, conflict resolution            | Loading states only                  |
| 12  | PWA + service worker           | Mobile-friendly, offline support           | Desktop app (separate)               |
| 13  | SDK package                    | Typed API client for consumers             | Client4 (looser typed)               |
| 14  | BFF layer                      | Secure API gateway pattern                 | Direct API calls from webapp         |
| 15  | RBAC permissions module        | Granular access control                    | Role-based (less granular)           |
| 16  | Route registry pattern         | Centralized API documentation              | Spread across handler files          |
| 17  | Hardening pipeline             | Automated security auditing                | No equivalent                        |

---

## What Chat Does Better

### Architecture & Infrastructure

| Area                        | Chat Advantage                                   | MM Limitation                                 |
| --------------------------- | ------------------------------------------------ | --------------------------------------------- |
| **Monorepo tooling**        | Turborepo + pnpm — fast, cacheable, parallel     | Makefile + npm — slower, less cacheable       |
| **IaC**                     | Terraform provisions DO droplet + DNS + firewall | No IaC — manual server setup                  |
| **DB migrations**           | 53 SQL files + 52 rollback scripts               | Postgres migration scripts without rollbacks  |
| **CI/CD**                   | 20 workflows including 7 audit workflows         | 41 workflows but no audit/security automation |
| **Container orchestration** | 3 Docker compose variants (dev, devremote, prod) | Single docker-compose.yml                     |
| **BFF pattern**             | Next.js route handler for API gateway            | Direct client-to-API calls                    |
| **Background jobs**         | BullMQ with Redis (retry, DLQ, circ breaker)     | Custom Go scheduler (less resilient)          |
| **Real-time**               | Socket.io (rooms, auth, auto-reconnect)          | Raw Go WebSocket (manual management)          |

### Security & Compliance

| Area                    | Chat Advantage                              | MM Limitation                      |
| ----------------------- | ------------------------------------------- | ---------------------------------- |
| **Auth**                | Supabase Auth (managed, secure)             | Custom Go auth (more surface area) |
| **Data access**         | RLS policies (declarative tenant isolation) | Custom middleware (imperative)     |
| **Audit pipeline**      | 10 hardening prompts, 624 findings tracked  | No automated audit system          |
| **CSP/CORS**            | Comprehensive middleware stack              | Basic security headers             |
| **Rate limiting**       | Composite key rate limiter                  | Basic rate limiting                |
| **Dependency scanning** | pnpm audit + Dependabot + Trivy             | Dependabot only                    |
| **Secrets management**  | Environment-based with validation           | Config file + env                  |

### Developer Experience

| Area                 | Chat Advantage                                        | MM Limitation                            |
| -------------------- | ----------------------------------------------------- | ---------------------------------------- |
| **Language**         | Full TypeScript (one language for frontend + backend) | Go + JavaScript + TypeScript mix         |
| **Module structure** | Domain modules (24 clear modules)                     | 293 files in one `app/` directory        |
| **Testing**          | Playwright E2E + Vitest + k6 + chaos                  | Jest + Cypress + Playwright (fragmented) |
| **Storybook**        | Component documentation                               | No component browser                     |
| **SDK**              | Typed SDK package                                     | Loose Client4 class                      |
| **API docs**         | Route registry + OpenAPI generation                   | Separate OpenAPI spec file               |
| **Pre-commit hooks** | Husky + lint-staged                                   | Manual linting                           |

### UX Features (Unique to Chat)

| Feature                    | Details                             |
| -------------------------- | ----------------------------------- |
| LiveKit WebRTC             | Video/audio calls from channel      |
| PWA                        | Installable, offline-capable        |
| Message pinning            | Pin messages to channel             |
| Message forwarding         | Quote messages to other channels    |
| Read-only channels         | Channels where only admins can post |
| Channel mute               | Per-channel notification toggle     |
| Custom user status         | Emoji + text + duration             |
| Floating timestamps        | Time overlay on hover               |
| Syntax-highlighted code    | highlight.js with GitHub Dark theme |
| Rich text editor           | TipTap with 15 formatting buttons   |
| Paste image from clipboard | Direct image upload                 |

---

## Quick-Win Similarity Opportunities

Priority-ordered implementation candidates (effort × impact):

| #   | Opportunity                                        | Effort | Impact | Phase   |
| --- | -------------------------------------------------- | ------ | ------ | ------- |
| 1   | Add `/msg` and `/join` slash commands              | 1h     | Medium | Phase 2 |
| 2   | Add scroll-to-bottom toast                         | 2h     | Low    | Phase 2 |
| 3   | Add channel intro/welcome message                  | 3h     | Low    | Phase 2 |
| 4   | Expand i18n to 5 locales (es, fr, de, ja, pt-BR)   | 2-3d   | Medium | Phase 2 |
| 5   | Add post-deleted undo toast                        | 2h     | Low    | Phase 2 |
| 6   | Add search operator hints (`from:`, `in:`, `has:`) | 4h     | Medium | Phase 3 |
| 7   | Add MFA/2FA via Supabase Auth                      | 1d     | High   | Phase 3 |
| 8   | Add notification sound parity (1 more sound)       | 30m    | Low    | Phase 2 |
| 9   | Add channel drag-to-category reorder               | 1d     | Medium | Phase 3 |
| 10  | Add inline user group creation from sidebar        | 1d     | Low    | Phase 3 |

---

## Areas Where Similarity Would Be Counterproductive

| Area                       | Why NOT to Copy MM                                                                                                        | Chat's Better Approach        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Redux state management** | MM's Redux is 1500+ lines of boilerplate; Chat's hooks + context is ~200 lines for equivalent state                       | Keep React context            |
| **SASS styling**           | MM has 100+ `.scss` files with specificity issues; Chat's Tailwind is composable and consistent                           | Keep Tailwind + tokens        |
| **Plugin system**          | Plugin API is 36+ files and requires maintaining ABI compatibility; Chat's webhook + API pattern covers integration needs | Keep webhook/API integration  |
| **Go backend**             | MM's Go backend is 1000+ files; Chat's TypeScript Express backend shares types with frontend                              | Keep TypeScript throughout    |
| **MySQL support**          | Supporting MySQL doubles migration + testing surface area                                                                 | Keep Postgres-only (Supabase) |
| **Flat file organization** | MM's `app/` has 293 files; Chat's domain modules are far easier to navigate                                               | Keep modular structure        |
| **Webpack configuration**  | Webpack config is complex and slow; Turborepo + Next.js handles this automatically                                        | Keep Turborepo + SWC          |
| **Desktop app**            | MM maintains a separate Electron desktop app; Chat's PWA covers mobile + desktop                                          | Keep PWA approach             |
| **Manual setup scripts**   | MM has shell scripts for everything; Chat uses Docker + Terraform                                                         | Keep Docker/IaC               |
| **Legacy API versioning**  | MM's `api4/` prefix is hard-coded in every route; Chat's `/v1/` prefix is applied centrally                               | Keep central versioning       |
