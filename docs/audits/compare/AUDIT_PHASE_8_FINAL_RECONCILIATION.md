# Phase 8 — Final Reconciliation / Single Source of Truth Comparative Audit

**Audit Date:** July 6, 2026
**Reference Repo:** `C:\temp\mattermost-master` — Go backend, React/Redux frontend, 15,031 files, 2011 directories, 6-year mature codebase
**Current Repo:** `C:\temp\chat` — Express/TS API, Next.js 15 (React 19, Tailwind CSS 4), Supabase PostgreSQL, BullMQ worker, 48 migrations
**Prior Phases:** 1 (Inventory), 2 (Mapping), 3 (Findings/Strengths), 4 (Risk/Stability), 5 (Roadmap), 6 (Change Plan), 7 (Patch Sets v1/v2)
**Tone:** Production-grade, principal+ level, evidence-driven, conservative about regressions

---

## 1. Executive Summary

This audit compares two codebases at vastly different maturity levels to produce a single source of truth (SSOT) about what to adopt, what to keep, what to defer, and what never to change.

**Mattermost** is a production-hardened, enterprise-grade chat platform with 6 years of development: 2146 Go server files, 4040 TypeScript/React client files, 402 migration files (~201 up+down pairs), 273 component directories (each with test + styles), 39 CI workflows, full i18n (60+ languages), plugin ecosystem, LDAP/SAML/MFA/OAuth, compliance exports, 35+ keyboard shortcuts, 3301 emojis, and a WYSIWYG TipTap editor (30+ files).

**Chat** is a modern greenfield chat platform (Express/TS, Next.js 15 App Router, Tailwind v4, Socket.io, Supabase, BullMQ) with 48 migrations, 19 CI workflows, and extensive audit infrastructure. It was built from scratch in ~6 months with a focus on modern architecture: BFF proxy (server-side tokens), design tokens (CSS custom properties), Zod runtime validation, optimistic UI engine, idempotency keys, circuit breaker, Redis adapter, feature-based module organization, and Supabase RLS for multi-tenancy.

### Key Finding

**Chat has a stronger architectural foundation than a 6-year-old Mattermost in 17 specific dimensions** (BFF pattern, design tokens, Zod, optimistic UI, idempotency, circuit breaker, Socket.io rooms, same-domain routing, feature modules, Vitest, HEALTHCHECK, graceful shutdown, consolidated CI, shared UI library, Tailwind v4, pnpm, App Router). However, Mattermost has **5-10x more feature surface** in areas like emoji, keyboard shortcuts, i18n, store abstraction, file preview, search UX, DM management, sidebar customization, and -- critically -- 202 migration pairs with rollback scripts vs Chat's 48 up-only migrations.

### Posture

All 12 Quick Wins from the initial Mattermost comparison are already implemented. All 20 P0 and 39 P1 hardening findings resolved. All 7 remaining pipeline findings resolved (BFF layer, rollback scripts, diff coverage, visual snapshots, keyboard shortcuts discoverability, E2E tests, reduced-motion check). Frontend UX release gate at 90.3% (0 P0, 0 P1, 0 P2, 9 P3).

**Recommendation: PROCEED with Phases 0-3 (observation + 10 patch sets, ~25-29 engineering days). DEFER Phases 4-5 (WYSIWYG editor, drafts, i18n expansion, multi-team sidebar, onboarding tour) until post-launch analytics justify the investment. Do NOT regress any of Chat's 17 superior architectural choices.**

---

## 2. High-Level Repo Comparison

| Dimension | Mattermost (Reference) | Chat (Current) | Verdict |
|---|---|---|---|
| **Age** | ~6 years | ~6 months | Different maturity |
| **Files** | 15,031 | 68,246* | *Chat includes generated files; src count comparable |
| **Server** | Go (2146 `.go` files) | Express/TS (1159 `.ts`) | Different languages |
| **Client** | React/Redux (4040 `.tsx/.ts`) | Next.js 15 App Router (2975 `.tsx/.ts`) | Chat: App Router + RSC |
| **Styling** | SCSS modules (tailwindcss v3) | Tailwind CSS v4 + CSS custom properties | **Chat stronger** — design tokens |
| **Migrations** | 402 files (~201 up+down pairs) | 48 SQL files (up only) | **Mattermost stronger** — 4x more + rollback scripts |
| **Components** | 273 dirs (each: component + test + styles) | Monolithic + shared UI (7 components) | Mattermost more granular |
| **CI workflows** | 39 | 19 | Chat is more consolidated |
| **i18n** | 60+ languages | None | **Mattermost stronger** |
| **Real-time** | Raw WebSocket | Socket.io (rooms, typing, presence, Redis adapter) | **Chat stronger** |
| **Auth** | Session cookie + DB lookup + OAuth providers | Magic link + JWT via BFF (server-side tokens) | **Chat stronger** — no tokens exposed to browser |
| **Validation** | Go struct type checking | Zod schemas on all inputs | **Chat stronger** — runtime + types from single source |
| **Store layer** | 40+ interfaces with contract tests, code-generated retry/cache/timer | Direct Supabase calls in service layer | **Mattermost stronger** |
| **Emoji** | 3301 emojis, 11 categories, skin tones, colon autocomplete | ~600 emojis, basic picker | **Mattermost stronger** |
| **Keyboard shortcuts** | 35+ with categorized modal | 8+ with basic modal | **Mattermost stronger** |
| **Optimistic UI** | Redux dispatch → API → reducer (blocking) | `useOptimistic` hook with rollback + temp IDs | **Chat stronger** |
| **Idempotency** | None | Idempotency keys on message creation | **Chat stronger** |
| **Circuit breaker** | None | Circuit breaker + retry + DLQ | **Chat stronger** |
| **Plugin ecosystem** | Marketplace, hooks, SDK | None | Mattermost enterprise feature |
| **Enterprise auth** | LDAP, SAML, MFA, OAuth (GitLab, Google, Office365, OpenID) | Magic link only | Mattermost enterprise feature |
| **Audit pipeline** | None | 10+ audit scripts, 60+ run reports, dashboards, badges | **Chat stronger** — unique infrastructure |
| **RBAC** | Basic role system (admin/member) | 18 granular permissions × 3 roles + requirePermission middleware | **Chat stronger** |

---

## 3. Detailed Mapping Summary

### 3.1 Architecture Equivalencies

| Chat Concept | Mattermost Equivalent | Mapping Type | Notes |
|---|---|---|---|
| Workspaces | Teams | Direct | Multi-tenant root entity |
| Channels | Channels | Direct | Same concept, different schema |
| Messages | Posts | Direct | Core messaging entity |
| Thread replies | Thread replies | Direct | Same threaded model |
| Reactions | Reactions | Direct | Same concept |
| File uploads | File uploads | Direct | Different storage backends |
| User presence | User presence | Direct | Socket.io vs custom WebSocket |
| BFF proxy (server-side tokens) | No equivalent | **Unique to Chat** | Mattermost exposes tokens to browser |
| Design tokens (CSS vars) | SCSS variables | **Chat better** | Systematic theming |
| Zod schemas | Go struct types | **Chat better** | Runtime + TypeScript from single source |
| Optimistic UI engine | Redux optimistic updates | **Chat better** | `useOptimistic` + temp IDs + rollback |
| Idempotency keys | None | **Chat better** | Prevents duplicate sends |
| Circuit breaker | None | **Chat better** | Prevents cascading failures |
| Redis adapter (Socket.io) | No pub/sub | **Chat better** | Enables horizontal scaling |
| Store abstraction | 40+ interfaces, contract tests | **Mattermost better** | Mature abstraction with code generation |
| Migration rollback scripts | 201 down pairs | **Mattermost better** | Chat has 0 rollback scripts |
| i18n system | 60+ languages | **Mattermost better** | Chat has none |
| Emoji picker | 3301 emojis, 11 categories, skin tones | **Mattermost better** | Chat has ~600 basic emojis |
| Keyboard shortcuts | 35+ categorized | **Mattermost better** | Chat has 8+ shortcuts |
| Plugin system | Marketplace + hooks + SDK | **Mattermost enterprise** | Chat doesn't need yet |
| WYSIWYG editor | TipTap (30+ files, 3000+ lines) | **Mattermost better** | Chat has markdown textarea |
| Search UX | Type toggle, operator hints, file extension suggestions | **Mattermost better** | Chat has basic text search |
| File preview | Multi-file nav, zoom, metadata panel | **Mattermost better** | Chat has basic overlay |
| Sidebar categories | Draggable categories, create/rename/reorder/delete | **Mattermost better** | Chat has categories with seed data but no management UI |
| Channel context menu | Favorites, mute, move, copy, leave, delete | **Mattermost better** | Chat has basic right-click (reply/copy/edit/delete) |
| DM creation | Multi-select with user search | **Mattermost better** | Chat has basic DM creation |
| Onboarding tour | 15+ files, task list + tour tips | **Mattermost better** | Chat has none |
| Multi-team sidebar | 65px team rail with icons | **Mattermost enterprise** | Chat is single-workspace |

### 3.2 Language/Framework Delta

| Dimension | Mattermost | Chat | Impact |
|---|---|---|---|
| Server language | Go (compiled, goroutines) | TypeScript/Express (interpreted, event loop) | Go has better concurrency/performance; TS has faster development cycle |
| State management | Redux (boilerplate-heavy, predictable) | React Context + hooks (simpler, less scalable) | Redux is overkill at Chat's current scale |
| Database driver | `database/sql` + custom migration framework | Supabase JS client + Supabase CLI migrations | Supabase provides RLS, real-time subscriptions, storage |
| ORM/query builder | Custom store interfaces | Supabase client (raw SQL via RPC) | Both avoid heavy ORM |
| Build system | Webpack (Go + webpack for webapp) | Turborepo + pnpm (tsc + next build) | Turborepo is faster, pnpm is disk-efficient |
| Testing | Jest + enzyme (legacy) | Vitest + Playwright | Vitest is faster, ESM-native |
| Containerization | Docker (no HEALTHCHECK, no graceful shutdown) | Docker (HEALTHCHECK + SIGTERM drain) | Chat has better operational readiness |
| CI/CD | 39 independent workflows | 19 workflows with `workflow_call` consolidation | Chat is more maintainable |

---

## 4. Best Implementations Worth Adopting

### 4.1 High Value, Low Risk

| # | Pattern | Source (Mattermost) | Adaptation Guidance | Est. Effort | Why |
|---|---|---|---|---|---|
| 1 | **3000+ emoji dataset** | `webapp/channels/src/utils/emoji.json` (57,799 lines, ~3300 system emojis) | Replace `emoji-data.json` dataset; keep existing picker infrastructure (categories, skin tones, recent, search, preview) | 1 day | Users expect full Unicode coverage. Infrastructure already wired — data-only swap. |
| 2 | **Keyboard shortcut categories** | `keyboard_shortcuts/keyboard_shortcuts_sequence/keyboard_shortcuts.ts` | Add section headers to existing shortcut modal. Group ~20 shortcuts into Navigation, Messages, Search, Composer. | 0.5 day | Presentation-only change. Existing modal has all shortcuts listed flat. |
| 3 | **File preview metadata panel** | `file_preview_modal_info/` | Add filename, size, uploader, date to the expanded preview overlay. Adapt as bottom bar (not right panel) for mobile compatibility. | 0.5 day | Users need file metadata without downloading. |
| 4 | **Sidebar header workspace menu** | `sidebar_header/sidebar_header.tsx` | Extend existing `showTeamMenu` state in app-sidebar.tsx with workspace switcher, browse workspaces, create workspace actions. | 0.5 day | Menu infrastructure already exists — enrich content. |
| 5 | **Sidebar category management UI** | `sidebar_category/` (466 lines, draggable) | Database tables already exist (`sidebar_categories` + `sidebar_channel_assignments` from July 4 migration). Wire drag-and-drop (HTML5 DnD already proven in channel-list.tsx) to create/rename/reorder/delete. | 2 days | Tables exist, DnD infrastructure exists. Only UI missing. |
| 6 | **Channel context menu** | `sidebar_channel_menu/` (favorite, mute, move, copy, leave, delete) | Use existing context-menu infrastructure (already implemented for messages) to add right-click on channels. All actions use existing API handlers. | 1 day | Infrastructure exists — wire new trigger. |
| 7 | **Ctrl+K quick switcher** | `components/quick_switch/` modal | Keyboard shortcuts system already exists (`keyboard-shortcuts.tsx`). Add command palette modal searching channels + workspaces with keyboard navigation. | 1 day | Most-used Mattermost shortcut. Keyboard system ready. |
| 8 | **Search improvements: type toggle + operator hints + file ext suggestions** | `search_box_type_selector.tsx`, `search_box_hints.tsx`, `extension_suggestions_provider.tsx` | Search API already supports date/author/channel filters. Add Messages/Files toggle, operator hints (`from:`, `in:`), file extension suggestions when in Files mode. | 1.5 days | Search infra exists — polish UX. |

### 4.2 Medium Value, Medium Risk (Require Tests First)

| # | Pattern | Source | Adaptation Guidance | Est. Effort | Why |
|---|---|---|---|---|---|
| 9 | **Store abstraction layer** | `store/` interfaces (40+ stores), `testlib/` contract tests, code generation | Define IMessageStore, IChannelStore, IWorkspaceStore, IUserStore interfaces. Implement Supabase-backed stores. Migrate service layer to depend on interfaces. Add contract tests per interface. | 3 days | Enables testing, implementation swaps, and future caching layers. Mattermost's code generation pattern is aspirational but Chat should start with 4 hand-written interfaces. |
| 10 | **DM multi-select creation modal** | `more_direct_channels/more_direct_channels.tsx` (typeahead + checkable list + confirm) | Create dedicated modal with multi-user search/select. DM channel creation API and `dm_channels` table already exist. | 2 days | Users need group DM support. API exists — only UI missing. |
| 11 | **Resizable sidebar drag handle** | `resizable_sidebar/resizable_divider.tsx` (4px handle, mouse tracking, MIN/MAX constants) | Add draggable divider to workspace layout sidebar. Persist width in localStorage. Clamp to 240px-400px. Use CSS var approach (no JS-driven layout shifting). | 1 day | Layout customization parity with Mattermost, Slack. |
| 12 | **Global notification settings page** | `user_settings_notifications.tsx` (1300 lines) | Create Settings page with Notifications tab. Global default notification preference, push/email toggles, desktop sound selector (9 sounds), quiet hours, trigger words. Per-channel preferences (already exist) override global. | 2 days | Per-channel notification modal exists. Missing global defaults. |
| 13 | **Down migration scripts (all 48 migrations)** | 402 migration files (~201 up+down pairs) | Create `supabase/rollback/` with `_down.sql` for each of the 48 migrations. Each reverses its up migration. | 4 hours | Without rollback scripts, any destructive migration is unrecoverable without manual SQL reconstruction. |

### 4.3 Strategic (Gated — Requires Post-Launch Analytics)

| # | Pattern | Source | Gating Criteria | Est. Effort | Why |
|---|---|---|---|---|---|
| 14 | **TipTap WYSIWYG editor** | `advanced_text_editor/` (30+ files, 3000+ lines) | >30% of users use formatting toolbar (analytics needed) | 2 weeks | Massive effort. Only justified if users actually need rich text. |
| 15 | **Drafts auto-save + scheduled posts** | `drafts/` (20+ files) | >5% message abandonment rate (detectable via `beforeunload` analytics) | 1 week | Prevents message loss. Server-backed in Mattermost; adapt as localStorage-only for Chat. |
| 16 | **Onboarding task list + tour tips** | `onboarding_tasklist/` (8 files) + `tours/` (15+ files) | New-user activation rate <60% (signup → message within 24h) | 4 days | Custom built — use React Context + localStorage (not Redux like Mattermost). |
| 17 | **Multi-team sidebar (65px rail)** | `team_sidebar/team_sidebar.tsx` (65px rail, workspace icons, tooltips) | >20% of users belong to >1 workspace | 5 days | Layout change affects all pages. Premature for single-workspace product. |
| 18 | **Full i18n expansion (60+ languages)** | `i18n/` with 60+ JSON translation files | Enterprise deployment outside English-speaking markets | Varies | i18n infrastructure (next-intl) should be scaffolded in Phase 2. Full translation is a separate effort. |

---

## 5. Areas the Current Repo Should Keep As-Is

These are implementations where Chat is objectively stronger than Mattermost. Do NOT regress these to match Mattermost patterns.

| # | Chat Implementation | Why It's Better | Mattermost Equivalent | Guardrail |
|---|---|---|---|---|
| 1 | **BFF pattern (server-side auth tokens)** | Tokens never exposed to browser JS — critical for XSS mitigation. | Tokens exposed to browser in Redux store or session cookie. | Never expose tokens to browser JS. |
| 2 | **Design tokens (CSS custom properties)** | Enables systematic theming, dark mode, accessibility compliance without recompilation. | Hardcoded SCSS variables — theme changes require recompilation. | Never migrate to raw SCSS variables. |
| 3 | **Zod validation** | Runtime type checking + TypeScript types from single source of truth. | Go structs + TS types — two sources, potential drift. | Never remove Zod from input paths. |
| 4 | **Optimistic UI (useOptimistic)** | Instant UI updates, rollback on error, server-echo dedup. | Redux dispatch → API call → reducer — blocking UX. | Never remove optimistic updates. |
| 5 | **Idempotency keys** | Prevents duplicate message sends on network retry. | None — duplicates possible on retry. | Never remove idempotency key check. |
| 6 | **Circuit breaker + retry + DLQ** | Prevents cascading failures; dead letter queue for failed deliveries. | None — failures propagate to callers. | Never remove circuit breaker. |
| 7 | **Socket.io (rooms, typing, presence, Redis adapter)** | Full real-time feature set with room management and pub/sub for horizontal scaling. | Raw WebSocket — every feature built from scratch. | Never replace with raw WebSocket. |
| 8 | **Same-domain Caddy routing** | No CORS issues, single TLS certificate, simpler cookie management. | Subdomain split (app.* vs api.*) — CORS complications. | Never split into separate subdomains. |
| 9 | **Feature-based module organization** | Co-located routes, services, tests — easier navigation and maintenance. | Flat 293-file routes/ directory. | Never flatten modules/ into routes/. |
| 10 | **Vitest** | Faster, ESM-native, less configuration than Jest. | Jest — slower, requires ts-jest, more config. | Never replace Vitest with Jest. |
| 11 | **Docker HEALTHCHECK** | Orchestration-aware auto-restart on failure. | No HEALTHCHECK — orchestrator sees "running" when app is hung. | Never remove HEALTHCHECK. |
| 12 | **Graceful shutdown (SIGTERM 10s drain)** | Zero-downtime deploys, in-flight requests complete before shutdown. | No shutdown handling — connections dropped on restart. | Never remove SIGTERM/SIGINT handlers. |
| 13 | **Consolidated CI (workflow_call)** | DRY workflow configuration, path filters, cancel-in-progress. | 39 independent workflows with duplicated setup steps. | Never revert to per-job workflows. |
| 14 | **Shared UI component library** | Design system consistency across all surfaces. 7 reusable components with tests. | Duplicated UI patterns across webapp/, channels/, platform/. | Never inline shared components back into apps. |
| 15 | **Tailwind CSS v4** | CSS-first configuration, faster build times, JIT compiler. | tailwindcss v3 — older, slower. | Never downgrade to v3. |
| 16 | **pnpm workspaces** | Disk-efficient (content-addressable store), strict dependency isolation, fast installs. | npm workspaces — slower, less strict, no content-addressable store. | Never migrate to npm workspaces. |
| 17 | **Next.js App Router** | React Server Components, streaming, nested layouts, server actions. | Pages Router — older pattern, no RSC support, no streaming. | Never migrate to Pages Router. |
| 18 | **RBAC (18 granular permissions × 3 roles)** | Fine-grained permission model with `requirePermission()` middleware. | Basic role system (admin/member) with coarser access control. | Never simplify to basic role system. |
| 19 | **Supabase RLS for tenant isolation** | Row-level security enforced at database layer — defense in depth. | Application-layer enforcement in Go handlers. | Never remove RLS policies. |
| 20 | **Rate limiting with composite key (user+IP)** | Stronger than IP-only — prevents IP-sharing bypass. | No explicit rate limiting at server level. | Never fall back to IP-only keys. |

---

## 6. Efficiency Opportunities

### 6.1 Process Improvements

| # | Opportunity | Current State | Improvement | Value | Effort |
|---|---|---|---|---|---|
| 1 | **Migration review checklist** | No formal migration review gate before merge. | Add migration review step to PR template: (1) Additive only? (2) Rollback script included? (3) Dry-run against prod copy? (4) CONCURRENTLY for large table indexes? | Prevents data loss | 30 min |
| 2 | **Patch set CI gate** | CI validates all checks but doesn't enforce phase gating. | Add `phase-gate.yml` workflow that checks phase conditions are met before allowing merge to next phase. | Enforces roadmap discipline | 1 hour |
| 3 | **Post-deployment smoke test** | Deploy pipeline checks health endpoint only. | Add automated smoke test after deploy: auth → workspace → channel → message → file → search flow. Fail + rollback if any step fails. | Catches regressions before users | 2 hours |
| 4 | **Dependency upgrade cadence** | Ad-hoc upgrades when vulnerabilities found. | Monthly `pnpm update` + automated PR with changelog review. | Reduces tech debt accumulation | 1 hour/month |
| 5 | **Pre-commit hook validation** | Pre-commit runs lint-staged + typecheck. | Add: no `console.log` (must use logger), no `@ts-ignore` without comment, no `.only` in test files. | Prevents common mistakes | 30 min |

### 6.2 Tooling Improvements

| # | Tool | Current State | Improvement | Value |
|---|---|---|---|---|
| 1 | **Bundle analyzer** | `@next/bundle-analyzer` configured but not in CI. | Run analyzer on PR builds, comment with size diff. | Prevents bundle bloat |
| 2 | **Migration generator** | Manual `CREATE TABLE` in migration files. | Create `scripts/generate-migration.ps1` that creates paired `.sql` + `_down.sql` files with timestamp prefix. | Ensures rollback scripts always created |
| 3 | **API contract testing** | E2E tests only. | Add Zod-to-OpenAPI schema export + `@stoplight/prism` mock server for contract testing. | Enables frontend development without API running |
| 4 | **Visual regression testing** | Playwright screenshots (1 spec file). | Add `@storybook/test-runner` + `chromatic` for component-level visual regression. | Catches UI regressions in CI |
| 5 | **Performance budget CI** | No performance baselines. | Add Lighthouse CI to PR checks with budget: LCP <2.5s, TTI <3.5s, CLS <0.1. | Prevents performance regressions |

### 6.3 Architecture Improvements

| # | Improvement | Current State | Target State | Value | Risk |
|---|---|---|---|---|---|
| 1 | **Store abstraction** | Direct Supabase calls in service layer. | IMessageStore etc. interfaces with Supabase implementations. Contract tests per interface. | Testability, implementation flexibility | Medium |
| 2 | **Down migration scripts** | 48 up-only migrations. | 48 paired `_down.sql` files in `supabase/rollback/`. | Rollback safety | Low |
| 3 | **i18n infrastructure** | All strings hardcoded in English. | `next-intl` scaffolded, English strings extracted to `messages/en.json`. | Foundation for localization | Low |
| 4 | **OpenAPI specification** | No API docs. | Zod schemas exported to OpenAPI, served at `/v1/docs`. | Developer onboarding, client generation | Low |
| 5 | **Component library expansion** | 7 shared components. | 20+ shared components with tests + Storybook stories. | Design system maturity | Low |

---

## 7. Risk Register

### 7.1 High Risk

| ID | Risk | Phase | Likelihood | Impact | Blast Radius | Mitigation | Owner |
|---|---|---|---|---|---|---|---|
| R-001 | **Store abstraction introduces N+1 queries or transaction scope changes** | 3 | Medium | High | All CRUD operations (workspaces, channels, messages) | Contract tests verify exact DB operations against real Supabase. Load test before/after to measure query count. | Backend |
| R-002 | **MessageList decomposition introduces rendering regression** | 1 | Medium | High | All message rendering in web app | Visual smoke test covering all message states. Compare DOM structure before/after. E2E for send→edit→delete. | Frontend |
| R-003 | **Emoji dataset swap causes picker performance regression** | 1 | Medium | Medium | Emoji picker UX | Virtualize emoji grid. Profile render time before/after. Load 3000+ emojis in background. | Frontend |
| R-004 | **Resizable sidebar breaks responsive layout** | 3 | Low | High | All workspace pages at all breakpoints | Test at 768px, 1024px, 1280px, 1440px. Verify sidebar collapses correctly. CSS var approach prevents JS layout shifts. | Frontend |
| R-005 | **Category management migration for existing users is missing** | 2 | Medium | Medium | All existing workspace users | Backfill script that creates default categories for users created before migration. Run on deploy. | Backend |

### 7.2 Medium Risk

| ID | Risk | Phase | Likelihood | Impact | Blast Radius | Mitigation | Owner |
|---|---|---|---|---|---|---|---|
| R-006 | **Down migration contains incorrect SQL** | 1 | Low | Critical | Database integrity | Review each down migration against up migration. Test against local Supabase. Never run in production without dry-run. | Backend |
| R-007 | **Colon autocomplete conflicts with existing `:` usage in markdown** | 1 | Low | Low | Message input | `::` and `:\` don't trigger. Only trigger after word boundary. Elegant dismiss. | Frontend |
| R-008 | **DM multi-select creates duplicate channels** | 2 | Low | Medium | DM channel list | API-level dedup check (already in `dm_channels` migration). E2E verifies redirect to existing DM. | Backend |
| R-009 | **Notification settings global vs per-channel interaction is confusing** | 2 | Low | Medium | Notification UX | Global defaults apply to new channels only. Per-channel overrides explicitly marked. Clear "Reset to default" button. | Frontend |
| R-010 | **i18n scaffold conflicts with Next.js auth middleware routing** | 1 | Low | Medium | All page routing | Test locale routing + auth middleware interaction. Add locale path to middleware matcher. | Frontend |

### 7.3 Low Risk

| ID | Risk | Phase | Likelihood | Impact | Blast Radius | Mitigation | Owner |
|---|---|---|---|---|---|---|---|
| R-011 | **Search type toggle returns incorrect results for Files mode** | 2 | Low | Medium | Search UX | E2E test for Messages vs Files toggle verifying result types. | Backend |
| R-012 | **Keyboard shortcut modal categorized layout is confusing** | 1 | Low | Low | Shortcut discoverability | Usability test with 3 users. Iterate on category labels. | Frontend |
| R-013 | **Sidebar header menu actions fail silently** | 1 | Low | Low | Workspace navigation | E2E test for each dropdown action. Error toast on failure. | Frontend |

### 7.4 Security Posture Comparison

| Dimension | Mattermost | Chat | Verdict |
|---|---|---|---|
| **Auth** | Session cookie + DB lookup. Tokens exposed. OAuth providers add complexity. | BFF pattern (server-side JWT). No tokens exposed to browser. | **Chat stronger** |
| **HTTP headers** | CSP configurable, HSTS configurable, X-Frame-Options SAMEORIGIN. | Full CSP (`'self'` only scripts), HSTS 1y preload, X-Frame-Options DENY, 12 security headers total. | **Chat stronger** |
| **Input validation** | Go type system catches at compile time. Manual checks in handlers. | Zod schemas on all inputs. Runtime validation + type generation. | **Chat stronger** |
| **Rate limiting** | None at server level. | Per-endpoint limiters with user+IP composite keys. Logged on hit. | **Chat stronger** |
| **CSRF** | None explicit (relies on subdomain separation). | Double-submit cookie + origin/referer check + BFF same-origin. | **Chat stronger** |
| **CORS** | Subdomain separation avoids most CORS issues. | Strict origin allowlist + same-domain BFF (most calls skip CORS entirely). | **Equivalent** |
| **SQL injection** | Parameterized queries in Go. | Supabase JS client with parameterized queries. | **Equivalent** |
| **XSS prevention** | Backend output sanitization. | CSP (`'self'` only scripts) + DOMPurify on markdown preview + BFF token isolation. | **Chat stronger** |
| **Secrets management** | `config.json` on filesystem + env vars. | Zod-enforced env schema (`env.ts`) with runtime validation. | **Chat stronger** |
| **Dependency scanning** | Dependabot (added recently). | pnpm audit (high threshold) + Dependabot (npm/docker/GHA) + Trivy in CI. | **Chat stronger** |
| **Audit logging** | Broader coverage from more feature surface. | 9 event types. Gaps: auth events, member changes, webhooks, files. | **Mattermost stronger** |
| **Tenant isolation** | Application-layer enforcement in Go handlers. | RLS policies on all tables + workspace_members join chain + SECURITY INVOKER search. | **Chat stronger** |

**Overall assessment**: Chat has a stronger security posture in 10 of 12 dimensions. The key advantage is the BFF architecture + same-domain routing + Supabase RLS, which together provide defense in depth that Mattermost's session-cookie + subdomain approach cannot match. The two gaps (audit logging coverage, broader Mattermost feature surface) are gaps of scope, not architecture.

---

## 8. Safe Alignment Roadmap

### Phase 0: Observation (Weeks 1-2)

**Gate:** No code changes. All existing tests continue to pass.

| Activity | Owner | Duration | Success Criteria |
|---|---|---|---|
| Document current state metrics | Platform | 2 days | Baseline: test count, bundle size, API latency, Lighthouse scores |
| Establish performance baselines | Backend | 2 days | k6 load test results for message send, channel load, search |
| Review all 7 prior audit phases | Full team | 1 day | All phases understood, questions resolved |
| Gather analytics on formatting toolbar usage | Frontend | 2 weeks | % of users who click formatting buttons (Phase 4 gate for TipTap) |
| Gather analytics on message abandonment | Frontend | 2 weeks | % of typed messages >50 chars that are never sent (Phase 4 gate for drafts) |
| Gather analytics on new-user activation | Product | 2 weeks | % of signups who send first message within 24h (Phase 4 gate for onboarding) |
| Gather analytics on multi-workspace membership | Backend | 2 weeks | % of users in >1 workspace (Phase 4 gate for multi-team sidebar) |

### Phase 1: No-Risk Wins (~10 engineering days)

**Gate:** Phase 0 baselines established. All existing tests pass. Team capacity confirmed.

| Patch Set | Item | Effort | Devs | Parallel | Risk |
|---|---|---|---|---|---|
| PS1 | Emoji expansion (3000+ emojis, dataset swap) | 1 day | 1 | Y | Low |
| PS2 | Keyboard shortcut modal categorization | 0.5 day | 1 | Y | Low |
| PS3 | Sidebar header workspace menu enrichment | 0.5 day | 1 | Y | Low |
| PS4 | File preview metadata panel | 0.5 day | 1 | Y | Low |
| PS5 | Down migration scripts (48 `_down.sql` files) | 0.5 day | 1 | Y | Low |
| PS6 | Channel context menu (right-click on sidebar) | 1 day | 1 | Y | Low |
| PS7 | Ctrl+K quick switcher | 1 day | 1 | Y | Low |
| PS8 | Colon autocomplete for emoji | 0.5 day | 1 | Y | Low |
| PS9 | Sidebar category management UI | 2 days | 1 | N | Low |
| PS10 | Search improvements (toggle, hints, extensions) | 1.5 days | 1 | N | Low |

**Phase 1 Gate:**
- [ ] All 54+ existing unit tests pass
- [ ] All E2E tests pass
- [ ] `pnpm typecheck` (0 errors), `pnpm lint` (0 warnings on changed files)
- [ ] Emoji picker: all 11 category tabs render, 3000+ emojis insert correctly
- [ ] Keyboard shortcut modal: categorized sections visible, all shortcuts work
- [ ] File preview: metadata panel shows correct data
- [ ] Channel context menu: right-click on each channel type shows correct options
- [ ] Ctrl+K: search → select → navigate E2E passes
- [ ] Colon autocomplete: `:` triggers popup, Enter inserts emoji
- [ ] Category management: create/rename/reorder/delete persist to DB
- [ ] Search toggle: Messages/Files returns correct results
- [ ] All 48 down migrations verified against local Supabase (run down → up → verify)
- [ ] Visual smoke test: message list, sidebar, file preview, emoji picker all render correctly

### Phase 2: Low-Risk Alignment (~7 engineering days)

**Gate:** Phase 1 complete. Regression suite passes at 100%.

| Patch Set | Item | Effort | Devs | Parallel | Risk |
|---|---|---|---|---|---|
| PS11 | Store abstraction (4 interfaces: IMessageStore, IChannelStore, IWorkspaceStore, IUserStore) | 3 days | 1 | Y | Medium |
| PS12 | Resizable sidebar drag handle | 1 day | 1 | Y | Medium |
| PS13 | DM multi-select creation modal | 2 days | 1 | N | Low-Medium |
| PS14 | Global notification settings page | 2 days | 1 | Y | Low |
| PS15 | i18n infrastructure scaffold (next-intl, string extraction, English locale) | 2 days | 1 | Y | Low |

**Phase 2 Gate:**
- [ ] Phase 1 complete and validated
- [ ] Store abstraction: contract tests pass for all 4 interfaces. All existing service tests pass unchanged.
- [ ] Resizable sidebar: drag persists across reload. Responsive breakpoints intact (768px, 1024px, 1440px).
- [ ] DM creation: single DM and group DM both create correct channels. Existing DM with same set redirects.
- [ ] Notification settings: global defaults respected. Per-channel overrides beat global. Sounds, push, quiet hours all functional.
- [ ] i18n: English locale loads. All pages render in English without visible key names. No middleware routing conflicts.
- [ ] Full regression suite passes (54+ unit + E2E + integration)
- [ ] Rollback plan documented for each Phase 2 item

### Phase 3: Medium-Risk Convergence (~4 engineering days)

**Gate:** Phases 1-2 complete. Performance benchmarks stable. Rollback plans documented.

| Patch Set | Item | Effort | Devs | Parallel | Risk |
|---|---|---|---|---|---|
| PS16 | MessageList decomposition (1117 lines → 7 sub-modules) | 1 day | 1 | Y | Medium |
| PS17 | Notification trigger words + auto-responder | 2 days | 1 | Y | Medium |
| PS18 | File extension suggestions in search (Files mode) | 0.5 day | 1 | Y | Low |

**Phase 3 Gate:**
- [ ] Phases 1-2 complete and validated
- [ ] MessageList: all states render identically (before/after DOM comparison). E2E for send → edit → delete passes.
- [ ] Trigger words: keyword outside @mention triggers notification. Auto-responder replies to DMs.
- [ ] File extension suggestions: `.` in Files mode shows extensions. `.p` filters correctly.
- [ ] Performance benchmarks show no regression (API latency, bundle size, render time)
- [ ] Full regression suite passes at 100%

### Phase 4: Strategic Improvements (Gated)

**Gate:** Phase 0 analytics support the investment. Phases 1-3 complete.

| Item | Gating Criterion | Est. Effort | Defer If |
|---|---|---|---|
| TipTap WYSIWYG editor | >30% formatting toolbar usage | 2 weeks | <30% usage — users prefer markdown |
| Drafts auto-save + scheduled posts | >5% message abandonment rate | 1 week | <5% — no message loss problem |
| Full i18n expansion (10+ languages) | Enterprise deployment outside English market | 1-2 weeks per language | Market is English-only |
| Onboarding task list + tour | New-user activation <60% | 4 days | >60% — existing onboarding works |
| Multi-team sidebar (65px rail) | >20% users in >1 workspace | 5 days | <20% — single-workspace is fine |
| Plugin ecosystem | Third-party developer demand | Months | Premature — no developer community |

### Phase 5: Future-State Cleanup (Deferred)

| Item | Why Deferred | Trigger to Revisit |
|---|---|---|
| LDAP/SAML/SSO (enterprise auth) | Magic link works for current scale | Enterprise deployment with IdP requirement |
| Compliance exports (email archives) | No compliance requirement yet | SOC2/HIPAA audit requirement |
| User groups CRUD | No groups concept in product | Users regularly @-mention groups of 4+ |
| Calendar integration | No calendar system | Integration with Google/Outlook Calendar |
| AI rewrite/generation | No AI integration | AI feature roadmap is defined |
| Admin panel UI | No admin dashboard | Operations team requests user/workspace management UI |

---

## 9. File/Area Change Recommendations

### Phase 1 Files

| File | Change | Risk | Reference |
|---|---|---|---|
| `apps/web/lib/emoji/emoji-data.json` | REPLACE — swap ~600 emoji dataset with 3300+ from Mattermost `emoji.json` | Low | Mattermost `utils/emoji.json` |
| `apps/web/lib/emoji/emoji-data.ts` | MODIFY — update category constants, export full array | Low | Mattermost `utils/emoji.js` |
| `apps/web/components/chat/emoji-picker.tsx` | MODIFY — virtualize grid for 5x data, tune category ordering | Low | — |
| `apps/web/components/shared/keyboard-shortcuts.tsx` | MODIFY — add section grouping (Navigation, Messages, Search, Composer) | Low | Mattermost `keyboard_shortcuts.ts` |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY (PS3) — enrich team menu with workspace switcher + actions | Low | Mattermost `sidebar_header.tsx` |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY (PS6) — add right-click handler for channel context menu | Low | Mattermost `sidebar_channel_menu/` |
| `apps/web/components/chat/file-preview.tsx` | MODIFY — add metadata panel (name, size, uploader, date) | Low | Mattermost `file_preview_modal_info/` |
| `apps/web/components/chat/message-input.tsx` | MODIFY — add `:` colon autocomplete handler | Low | Mattermost `use_editor_emoji_picker.tsx` |
| `apps/web/components/shared/quick-switcher.tsx` | CREATE — Ctrl+K command palette modal | Low | Mattermost `quick_switch/` |
| `apps/web/components/chat/sidebar-category-manager.tsx` | CREATE — category CRUD UI with DnD | Low | Mattermost `sidebar_category/` |
| `supabase/rollback/` (48 files) | CREATE — down migration scripts for all 48 migrations | Low | Mattermost `migrations/` down pairs |
| `apps/web/components/chat/search-bar.tsx` | MODIFY — add Messages/Files toggle, operator hints | Low | Mattermost `search_box_type_selector.tsx` |

### Phase 2 Files

| File | Change | Risk | Reference |
|---|---|---|---|
| `packages/db/src/stores/message-store.ts` | CREATE — IMessageStore interface + SupabaseMessageStore | Medium | Mattermost `store/` interfaces |
| `packages/db/src/stores/channel-store.ts` | CREATE — IChannelStore interface + SupabaseChannelStore | Medium | Mattermost `store/` interfaces |
| `packages/db/src/stores/workspace-store.ts` | CREATE — IWorkspaceStore interface + SupabaseWorkspaceStore | Medium | Mattermost `store/` interfaces |
| `packages/db/src/stores/user-store.ts` | CREATE — IUserStore interface + SupabaseUserStore | Medium | Mattermost `store/` interfaces |
| `packages/db/src/stores/contract-tests/` | CREATE — contract tests for each store interface | Medium | Mattermost `testlib/` |
| `apps/api/src/modules/*/service.ts` (5 files) | MODIFY — migrate from direct Supabase to store interfaces | Medium | — |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY — add resizable divider + width state | Medium | Mattermost `resizable_divider.tsx` |
| `apps/web/app/(workspace)/layout.tsx` | MODIFY — CSS var for sidebar width | Medium | — |
| `apps/web/components/chat/create-dm-modal.tsx` | CREATE — multi-user search/select modal | Low-Medium | Mattermost `more_direct_channels.tsx` |
| `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx` | MODIFY — add notification settings tab | Low | Mattermost `user_settings_notifications.tsx` |
| `apps/web/i18n/request.ts` | CREATE — next-intl locale detection | Low | — |
| `apps/web/i18n/routing.ts` | CREATE — next-intl routing config | Low | — |
| `apps/web/i18n/messages/en.json` | CREATE — English locale strings | Low | — |
| `apps/web/middleware.ts` | MODIFY — locale routing | Low | — |

### Phase 3 Files

| File | Change | Risk | Reference |
|---|---|---|---|
| `apps/web/components/chat/message-list/` (7 files) | CREATE — extract from message-list.tsx monolith | Medium | Mattermost `post_view/` (adapt, not copy) |
| `supabase/migrations/20260706000001_trigger_words.sql` | CREATE — trigger words + auto-responder table | Medium | — |
| `apps/api/src/modules/notifications/service.ts` | MODIFY — trigger word evaluation on message send | Medium | Mattermost notification system |
| `apps/web/components/chat/search-bar.tsx` | MODIFY — file extension suggestions | Low | Mattermost `extension_suggestions_provider.tsx` |

### Files to NOT Touch (Ever)

| File | Reason |
|---|---|
| `apps/api/src/middleware/authenticate.ts` | Auth gate for every operation. See guardrail #1. |
| `apps/api/src/modules/auth/` | Auth flow is critical path. Changes require comprehensive test coverage. |
| `apps/web/components/auth/auth-context.tsx` | Auth context is the client-side auth boundary. |
| `apps/web/app/api/v1/[...path]/route.ts` (BFF) | The BFF proxy is Chat's best security feature. Changes could break all API calls. |
| `apps/api/src/lib/socket.ts` | Socket.io event contracts must be additive only. |
| `infra/docker/Caddyfile` + `Caddyfile.prod` | Route mappings are production contracts. Changes require coordinated updates. |
| `apps/api/server.ts` | Entry point with graceful shutdown (SIGTERM/SIGINT 10s drain). |
| `.github/workflows/deploy-development.yml` | Fragile SSH-based deployment pipeline. |
| `packages/ui/src/components/` (any existing) | Shared UI library is Chat's design system foundation. |

---

## 10. Do-Not-Break Guardrails

These guardrails are non-negotiable. Any violation requires immediate rollback.

### Critical (P0 — Never Break)

| # | Guardrail | Rationale | Enforcement |
|---|---|---|---|
| 1 | **Never expose auth tokens to browser JS** | The BFF pattern (server-side JWT injection) is Chat's best security feature. Breaking this for Mattermost-style browser tokens would be a regression. | Review any change touching `authenticate.ts`, `supabase/client.ts`, or BFF `route.ts`. Block if tokens leave server-side. |
| 2 | **Never change Socket.io event names or payload shapes** | Every event (`message:send`, `typing:start`, `user:presence`, `room:join`) is a contract consumed by all connected clients. Renaming or changing payloads breaks real-time messaging silently. | Additive events only. Use `git grep` on event names before any change. Block any rename/remove. |
| 3 | **Never remove idempotency keys from message creation** | Idempotency keys prevent duplicate message sends on network retry. This is critical for real-time chat reliability. Mattermost doesn't have them. | Block any PR that removes idempotency key check from message creation path. |
| 4 | **Never remove DOMPurify from markdown preview** | XSS prevention in rendered markdown is non-negotiable. DOMPurify is the last line of defense. CSP covers script execution, but DOMPurify prevents HTML injection. | Block any PR that removes or bypasses DOMPurify sanitization. |
| 5 | **Never remove CSRF protection** | Double-submit cookie + origin/referer check + same-site cookie = defense in depth. Removing any layer weakens CSRF protection. | Block any PR that removes CSRF middleware or weakens same-site cookie policy. |
| 6 | **Never replace Socket.io with raw WebSocket** | Socket.io provides rooms, namespaces, typing indicators, presence, automatic reconnection exponential backoff, and Redis adapter for horizontal scaling. Rewriting these from scratch is wasted effort and introduces regressions. | Block any PR that removes `socket.io` dependency. |
| 7 | **Never downgrade from Tailwind CSS v4 to v3** | v4 has CSS-first configuration, faster build times (JIT), and smaller output. Matching Mattermost's v3 would be a regression. | Block any PR that changes `tailwindcss` version to <4. |
| 8 | **Never replace Vitest with Jest** | Vitest is 2-3x faster, ESM-native, has better TypeScript support, and requires less configuration. There is zero benefit to matching Mattermost's Jest usage. | Block any PR that adds Jest dependency or replaces Vitest configuration. |
| 9 | **Database migrations must be additive-only** | Never `DROP`, `ALTER COLUMN TYPE`, `RENAME`, or add `NOT NULL` without `DEFAULT` after a migration has been applied to any environment. | Migration review checklist before any DB change. |
| 10 | **Never flatten modules/ into routes/** | Feature-based module organization (co-located routes, services, tests) is superior to Mattermost's flat 293-file `routes/` directory. | Block any PR that restructures `modules/` directory. |

### High (P1 — Break Only with Strong Justification)

| # | Guardrail | Rationale | Enforcement |
|---|---|---|---|
| 11 | **Never remove Docker HEALTHCHECK** | HEALTHCHECK enables Docker orchestration to detect and restart unhealthy containers. Mattermost lacks this. | Block any PR that removes HEALTHCHECK from Dockerfile or compose files. |
| 12 | **Never remove graceful shutdown handlers** | 10-second SIGTERM drain prevents dropped connections during deploys. Mattermost lacks this. | Block any PR that removes SIGTERM/SIGINT handlers from `server.ts`. |
| 13 | **Rate limiters must keep composite key (user+IP)** | IP-only limiting allows an attacker who reuses an IP (NAT) to bypass per-user limits. Composite key prevents this. | Block any PR that falls back to IP-only keys in `rate-limit.ts`. |
| 14 | **CSP must remain restrictive** | `script-src 'self'` only. No `'unsafe-eval'` (Mattermost allows it in dev). Any addition to `script-src` must be reviewed for XSS risk. | Security review required for any CSP change. |
| 15 | **The `/metrics` endpoint must remain authentication-gated** | Exposing Prometheus metrics unauthenticated would leak request volume, error rates, and business metrics. | Verify `authenticate` middleware on `/metrics` route. |
| 16 | **No simultaneous model-layer refactor and feature addition** | Changing the store abstraction at the same time as adding a new feature creates unbounded risk. Separate by at least one release cycle. | Architecture review gate for mixed refactor+feature PRs. |
| 17 | **Production deploy workflow must remain idempotent** | `docker compose up` with existing containers must be a no-op for unchanged services. Never use `docker compose down -v` which destroys volumes. | Code review for deploy workflow changes. |

---

## 11. Validation Checklist

### Pre-Phase 1 Gate

- [ ] `pnpm test` passes (all 54+ existing tests)
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes (0 warnings on changed files)
- [ ] `pnpm dev` starts without errors
- [ ] `supabase start` loads and applies all 48 migrations
- [ ] Performance baselines recorded (API latency, bundle size, Lighthouse scores)
- [ ] k6 load test baseline established
- [ ] All 7 prior audit phases reviewed and understood by the team

### Phase 1 Complete Gate

- [ ] All 54+ existing unit tests still pass
- [ ] All E2E tests pass (auth, home, file-upload, messaging, comprehensive, visual-snapshot)
- [ ] `pnpm typecheck` (0 errors), `pnpm lint` (0 warnings)
- [ ] Emoji picker: 11 category tabs render, 3000+ emojis insert correctly, search works, skin tones persist
- [ ] Colon autocomplete: `:` triggers popup in message input, typing filters, Enter inserts emoji, Escape dismisses
- [ ] Keyboard shortcut modal: categories (Navigation, Messages, Search, Composer) visible, all ~20 shortcuts functional
- [ ] Ctrl+K quick switcher: E2E for search → keyboard select → navigate passes
- [ ] Sidebar header menu: workspace switcher, browse workspaces, create workspace actions all work
- [ ] Channel context menu: right-click on public/private/DM/GM channels shows correct options; all actions functional
- [ ] Sidebar category management: create → rename → drag-reorder → delete persists to database. Categories appear for new channels.
- [ ] Search type toggle: Messages vs Files returns correct result types
- [ ] Search operator hints: `from:` shows user suggestions, `in:` shows channel suggestions
- [ ] File preview metadata: filename, size, uploader, date all displayed correctly
- [ ] All 48 down migrations verified: run `down` against local Supabase → verify schema reverts → run `up` again
- [ ] Visual QA: message list, sidebar, emoji picker, file preview render correctly at 375px, 768px, 1440px
- [ ] Lighthouse scores not regressed (LCP, TTI, CLS within baseline ±5%)

### Phase 2 Complete Gate

- [ ] Phase 1 complete and validated
- [ ] Store abstraction: IMessageStore, IChannelStore, IWorkspaceStore, IUserStore defined
- [ ] Store contract tests: each interface tested against real Supabase (integration) + mock (unit)
- [ ] All 15+ existing service functions produce identical results through store abstraction
- [ ] Resizable sidebar: drag handle appears on hover, drag resizes smoothly (240px-400px), width persists across reload, responsive breakpoints intact
- [ ] DM creation modal: multi-user search works, single DM and group DM (3+ users) create correct channels, existing DM with same members redirects
- [ ] Notification settings: global defaults (All/Mentions/Nothing) apply to new channels, per-channel overrides work, push/email toggles functional, quiet hours suppress notifications, desktop sound selector plays preview
- [ ] i18n scaffold: English locale loads without key names visible, locale routing doesn't conflict with auth middleware
- [ ] Full regression suite passes (54+ unit + E2E + integration)
- [ ] Rollback plan documented for each Phase 2 item
- [ ] Performance benchmarks within baseline ±10%

### Phase 3 Complete Gate

- [ ] Phases 1-2 complete and validated
- [ ] MessageList decomposition: all message states render identically (before/after DOM structure comparison)
- [ ] MessageList extracted components: `MessageItem`, `MessageActions`, `MessageReactions`, `MessageTimestamp`, `MessageEditor`, `MessageListContainer`, `JumpToPresent` all functional
- [ ] Trigger words: registered keywords trigger notification for non-mention messages
- [ ] Auto-responder: DM to user with auto-responder active receives auto-reply
- [ ] File extension suggestions: typing `.` in Files mode shows extension list, `.p` filters to `.pdf`, `.png`, selection inserts extension
- [ ] Performance benchmarks stable (no regression from store abstraction)
- [ ] E2E regression suite: auth → workspace → channel → message → edit → delete → file → search flow all pass
- [ ] `pnpm audit --audit-level=high` passes (no high or critical vulnerabilities)

### Pre-Deployment Gate (for any phase)

- [ ] CI pipeline green (all checks pass)
- [ ] Migration dry-run against production copy (read replica or backup restore)
- [ ] Rollback plan reviewed and accessible
- [ ] Feature flag in place if change is high-risk (Phase 2+ items)
- [ ] Monitoring dashboards reviewed (error rates, latency, memory)
- [ ] On-call engineer notified of deployment

### Go/No-Go Gates for Phase 4 Items

| Item | Go Criteria | Metrics Source | Review Cadence |
|---|---|---|---|
| TipTap WYSIWYG editor | >30% of users use formatting toolbar monthly | PostHog/analytics event on formatting button click | After 2 weeks post-launch |
| Drafts auto-save | >5% of typed messages >50 chars abandoned | `beforeunload` analytics + message abandonment rate | After 2 weeks post-launch |
| i18n expansion | Non-English user growth >10% | Auth provider locale data + user-reported requests | Monthly |
| Onboarding tour | New-user activation rate <60% (signup → message within 24h) | User registration analytics + first-message timestamp | Monthly |
| Multi-team sidebar | >20% of users in >1 workspace | Workspace membership count per user | Monthly |

---

## 12. Final Recommendation

### Verdict: PROCEED — GO WITH CONDITIONS

**Decision:** PROCEED with Phases 0-3 (observation + 10 patch sets across 3 phases).
**Conditions:** Phase 4 strategic items (TipTap, drafts, onboarding, multi-team sidebar) are gated on post-launch analytics. Do NOT regress any of the 17 "keep as-is" architectural choices.

### Value/Risk Matrix

```
High Value
    |
    |  [Phase 1: Emoji expansion, keyboard shortcuts, Ctrl+K,
    |   channel context menu, category management, search toggle,
    |   down migrations, colon autocomplete, file metadata, sidebar menu]
    |  [Phase 2: Store abstraction, i18n scaffold, DM multi-select,
    |   resizable sidebar, notification settings]
    |
    |  [Phase 4: TipTap (GATED), drafts (GATED)]
    |  [Phase 3: MessageList split, trigger words, file ext suggestions]
    |
    |  [Phase 5: LDAP/SAML, compliance exports, plugin system]
Low Value
    ---------------+-------------->
    Low Risk          High Risk
```

### Resource Estimate

| Phase | Patch Sets | Engineering Days | Calendar Time (2 devs) | Total Dev-Days |
|---|---|---|---|---|
| Phase 0 (Observation) | — | — | 2 weeks | — |
| Phase 1 | PS1-PS10 | 10 days | 1 week | 10 |
| Phase 2 | PS11-PS15 | 7 days | 1 week | 7 |
| Phase 3 | PS16-PS18 | 4 days | 3 days | 4 |
| **Total (Phases 1-3)** | **18 patch sets** | **~21 days** | **~2.5 weeks** | **21** |
| Phase 4 (GATED) | PS19-PS23 | 4-5 weeks | 2-3 weeks | 20-25 |
| Phase 5 (DEFERRED) | — | Months | — | — |

### Critical Risks to Monitor

| Risk | Monitoring Mechanism | Threshold | Response |
|---|---|---|---|
| Store abstraction regressions | Contract tests + load tests | Any failing contract test or >10% latency increase | Roll back store changes to direct Supabase calls |
| MessageList decomposition rendering | Visual regression tests + E2E | Any pixel diff >1% | Revert to single `message-list.tsx` |
| Emoji picker performance | Render time profiling | >200ms picker open time | Virtualize grid or lazy-load categories |
| Resizable sidebar breakage | Responsive QA at 3 breakpoints | Sidebar overflow at any breakpoint | Remove drag handle, revert to fixed width |
| DM creation duplicates | E2E + API-level dedup check | Duplicate DM channels created | Fix API dedup, re-run E2E |

### Final Assessment

The Chat repo is not a "worse" version of Mattermost. In 17 architectural dimensions, it is objectively stronger. The 6-year Mattermost codebase has more feature surface and operational maturity (especially migration pairs, component granularity, emoji, i18n, keyboard shortcuts, search UX, file preview), but Chat's foundation is superior.

The recommended alignment strategy is **selective pattern adoption, not convergence**. Each Mattermost pattern evaluated for Phase 1-3 adoption was judged against four criteria: (1) Does it add user-visible value? (2) Does it preserve Chat's architectural advantages? (3) Is the risk proportional to the value? (4) Do we have the analytics to justify it?

The 18 patch sets deliver the highest-value alignment items within ~21 engineering days, with clear gates and rollback procedures at each phase. The 17 do-not-break guardrails protect Chat's architectural advantages. The Phase 4 gating criteria ensure that the highest-effort strategic items (TipTap, drafts, onboarding, multi-team, i18n expansion) are only pursued when analytics justify the investment.

**Go decision:** Approved for Phases 0-3 (observation + 21 engineering days of patch implementation). Phase 4 items are gated on post-launch analytics. Phase 5 items are deferred indefinitely. All 17 architectural guardrails are non-negotiable. Any violation requires immediate rollback.
