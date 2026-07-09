# Phase 8 — Final Reconciliation / Single Source of Truth Comparative Audit

**Audit Date:** July 8, 2026 (Revised)
**Reference Repo:** `C:\temp\mattermost-master` — Go backend, React/Redux frontend, 15,031 files, 2011 directories, 6-year mature codebase
**Current Repo:** `C:\temp\chat` — Express/TS API, Next.js 15 (React 19, Tailwind CSS 4), Supabase PostgreSQL, BullMQ worker, 53 migrations
**Prior Phases:** 1 (Inventory), 2 (Mapping), 3 (Findings/Strengths), 4 (Risk/Stability), 5 (Roadmap), 6 (Change Plan Rev), 7 (Patch Sets Rev)
**Tone:** Production-grade, principal+ level, evidence-driven, conservative about regressions

---

## 1. Executive Summary

This audit compares two codebases at vastly different maturity levels to produce a single source of truth (SSOT) about what to adopt, what to keep, what to defer, and what never to change.

**Mattermost** is a production-hardened, enterprise-grade chat platform with 6 years of development: 2146 Go server files, 4040 TypeScript/React client files, 402 migration files (~201 up+down pairs), 273 component directories (each with test + styles), 39 CI workflows, full i18n (60+ languages), plugin ecosystem, LDAP/SAML/MFA/OAuth, compliance exports, 35+ keyboard shortcuts, 3301 emojis, and a WYSIWYG TipTap editor (30+ files).

**Chat** is a modern greenfield chat platform (Express/TS, Next.js 15 App Router, Tailwind v4, Socket.io, Supabase, BullMQ) with 53 migrations (52 with rollback scripts), 19 CI workflows, and extensive audit infrastructure. Built from scratch in ~6 months with a focus on modern architecture: BFF proxy (server-side tokens), design tokens (CSS custom properties), Zod runtime validation, optimistic UI engine, idempotency keys, circuit breaker, Redis adapter, feature-based module organization, Supabase RLS for multi-tenancy, and 5 store abstraction interfaces.

### Key Finding

**Chat has a stronger architectural foundation than a 6-year-old Mattermost in 17 specific dimensions** (BFF pattern, design tokens, Zod, optimistic UI, idempotency, circuit breaker, Socket.io rooms, same-domain routing, feature modules, Vitest, HEALTHCHECK, graceful shutdown, consolidated CI, shared UI library, Tailwind v4, pnpm, App Router). Mattermost has **broader feature surface** in areas like emoji completeness, channel context menus, sidebar category management, DM multi-select UX, global notification settings, search operator hints, and enterprise features (MFA, LDAP, plugins).

### Implementation Progress (July 1–8, 2026)

The July implementation wave dramatically closed the gap:

| Area | Before July 1 | After July 8 | Status |
|---|---|---|---|
| Emoji picker | ~600 emojis, basic | ~600 emojis + full infrastructure (categories, skin tones, recent, search, colon autocomplete, preview) | 🟡 Needs data expansion |
| Keyboard shortcuts | Flat list, 8+ | Categorized modal (Navigation/Messaging/Formatting/General), 10+ | ✅ Complete |
| Sidebar workspace menu | Basic header | Full dropdown with workspace list, icons, active indicator | ✅ Complete |
| File preview | Basic overlay | Metadata panel (name, size), zoom, multi-file nav | ✅ Complete |
| i18n infrastructure | None | `lib/i18n/` with en.json, locale detection | ✅ Complete |
| Onboarding tour | None | 5-step task list (join channel, send message, invite, profile, notifications) | ✅ Complete |
| Drafts auto-save | None | localStorage auto-save + restore | ✅ Complete |
| TipTap editor | None | Installed with TaskList, Link, Placeholder extensions | ✅ Complete |
| Store abstraction | Direct Supabase | 5 interfaces (message, channel, workspace, reaction, notification) | ✅ Complete |
| Supabase seeds | 0 | 9 seed files (users, workspaces, channels, messages, threads, reactions, notifications, webhooks) | ✅ Complete |
| Migration rollbacks | 0 | 52 `_down.sql` scripts | ✅ Complete |
| Shared config | Per-package | `packages/config/` with eslint, tsconfig, logger, errors, env-schema, date, vitest | ✅ Complete |
| E2E tests | 1-2 spec files | 9+ spec files (auth, file-upload, home, messaging, navigation, search, comprehensive, visual-snapshot, auth-workspace-chat) | ✅ Complete |
| Message decomposition | Monolith | 3 of 7 sub-modules extracted (context-menu, delete-dialog, message-item) | 🟡 Partial |

### Posture

All 20 P0 and 39 P1 hardening findings resolved. All 7 remaining pipeline findings resolved (BFF layer, rollback scripts, diff coverage, visual snapshots, keyboard shortcuts discoverability, E2E tests, reduced-motion check). 0 P0, 0 P1, 0 P2, 9 P3 remaining across all audit pipelines.

**Recommendation: PROCEED with remaining 8 patch sets (~8-15 engineering days across 1.5-2 weeks). DEFER multi-team sidebar (Patch Set 8) until analytics justify. Do NOT regress any of Chat's 17 superior architectural choices.**

---

## 2. High-Level Repo Comparison

| Dimension | Mattermost (Reference) | Chat (Current) | Verdict |
|---|---|---|---|
| **Age** | ~6 years | ~6 months | Different maturity |
| **Server** | Go (2146 `.go` files) | Express/TS (1159 `.ts`) | Different languages |
| **Client** | React/Redux (4040 `.tsx/.ts`) | Next.js 15 App Router (2975 `.tsx/.ts`) | Chat: App Router + RSC |
| **Styling** | SCSS modules (tailwindcss v3) | Tailwind CSS v4 + CSS custom properties | **Chat stronger** — design tokens |
| **Migrations** | 402 files (~201 up+down pairs) | 53 SQL files + 52 rollback scripts | Mattermost more mature; Chat catching up |
| **CI workflows** | 39 (duplicated) | 19 (consolidated via workflow_call) | Chat more maintainable |
| **i18n** | 60+ languages | English only (infrastructure ready) | Mattermost broader; Chat ready for expansion |
| **Real-time** | Raw WebSocket | Socket.io (rooms, typing, presence, Redis adapter) | **Chat stronger** |
| **Auth** | Session cookie + DB lookup | Magic link + JWT via BFF (server-side tokens) | **Chat stronger** — no tokens exposed to browser |
| **Validation** | Go struct type checking | Zod schemas on all inputs | **Chat stronger** — runtime + types from single source |
| **Store layer** | 40+ interfaces with contract tests | 5 interfaces without contract tests | Mattermost more mature; Chat adequate for now |
| **Emoji** | 3301 emojis, 11 categories, skin tones | ~600 emojis, 9 categories, skin tones | **Mattermost broader**; Chat infrastructure matches |
| **Keyboard shortcuts** | 35+ with categorized modal | 10+ with categorized modal | Already aligned; Chat has fewer shortcuts |
| **Optimistic UI** | Redux dispatch → API (blocking) | `useOptimistic` hook with rollback + temp IDs | **Chat stronger** |
| **Idempotency** | None | Idempotency keys on message creation | **Chat stronger** |
| **Circuit breaker** | None | Circuit breaker + retry + DLQ | **Chat stronger** |
| **RBAC** | Basic role system (admin/member) | 18 granular permissions × 3 roles | **Chat stronger** |
| **Plugin ecosystem** | Marketplace, hooks, SDK | None | Mattermost enterprise feature |
| **Enterprise auth** | LDAP, SAML, MFA, OAuth | Magic link only | Mattermost enterprise feature |
| **Audit pipeline** | None | 10+ audit scripts, dashboards, badges | **Chat stronger** — unique infrastructure |

---

## 3. Detailed Mapping Summary

### 3.1 Architecture Equivalencies (Updated)

| Chat Concept | Mattermost Equivalent | Mapping Type | Notes |
|---|---|---|---|
| Workspaces | Teams | Direct | Multi-tenant root entity |
| Channels | Channels | Direct | Same concept |
| Messages | Posts | Direct | Core messaging entity |
| Thread replies | Thread replies | Direct | Same threaded model |
| Reactions | Reactions | Direct | Same concept |
| File uploads | File uploads | Direct | Different storage backends |
| User presence | User presence | Direct | Socket.io vs custom WebSocket |
| BFF proxy | No equivalent | **Unique to Chat** | Mattermost exposes tokens to browser |
| Design tokens | SCSS variables | **Chat better** | Systematic theming |
| Zod schemas | Go struct types | **Chat better** | Runtime + TypeScript from single source |
| Optimistic UI | Redux optimistic updates | **Chat better** | `useOptimistic` + temp IDs + rollback |
| Idempotency keys | None | **Chat better** | Prevents duplicate sends |
| Circuit breaker | None | **Chat better** | Prevents cascading failures |
| Store abstraction | 40+ interfaces, contract tests | Mattermost more mature | Chat has 5 interfaces, no contract tests yet |
| Migration rollback scripts | 201 down pairs | Chat now has 52 | Rapidly closing gap |
| i18n system | 60+ languages | Chat infrastructure ready | English only; ready for expansion |
| Emoji picker | 3301 emojis | ~600 emojis + full infrastructure | Needs data expansion only |
| Keyboard shortcuts | 35+ categorized | 10+ categorized | Already aligned |
| WYSIWYG editor | TipTap (30+ files) | TipTap installed with 4 extensions | Already aligned |
| Search UX | Type toggle, operator hints | Basic text search | Search infrastructure exists |
| Sidebar categories | Draggable CRUD | Tables exist, no UI | Needs management UI |
| Channel context menu | Full menu | Message Cx exists, channel missing | Needs channel Cx |
| DM creation | Multi-select modal | Inline/basic | Needs DM modal |
| Onboarding tour | 15+ files, task list + tour | 5-step task list | Already aligned |
| Multi-team sidebar | 65px rail | Dropdown only | Needs rail (gated) |

### 3.2 Key Gaps Already Closed by July 1–8 Implementation

| Gap (from original audit) | Resolution | File(s) |
|---|---|---|
| No Supabase seeds | 9 seed files created | `supabase/seeds/` |
| No migration rollback scripts | 52 _down.sql files created | `supabase/rollback/` |
| No shared config package | `packages/config/` with 14 files | `packages/config/` |
| Direct Supabase calls in services | 5 store interfaces + implementations | `packages/db/src/stores/` |
| No i18n infrastructure | `lib/i18n/` with en.json + locale system | `apps/web/lib/i18n/` |
| No onboarding tour | 5-step task list | `components/workspace/onboarding-tour.tsx` |
| No drafts auto-save | localStorage auto-save | `message-input.tsx` |
| No TipTap editor | Installed with 4 extensions | `components/chat/tiptap-editor.tsx` |
| Flat keyboard shortcuts | Categorized modal | `components/shared/keyboard-shortcuts.tsx` |
| Basic sidebar header | Workspace switcher dropdown | `app-sidebar.tsx` |
| Basic file preview | Metadata panel + zoom + nav | `file-preview.tsx` |
| Few E2E tests | 9+ spec files | `tests/e2e/` |
| Traefik config | Removed (Caddy only) | `infra/docker/` |
| 48 migrations | 53 migrations (+52 rollbacks) | `supabase/migrations/` |

---

## 4. Best Implementations Worth Adopting (Remaining Gaps)

### 4.1 High Value, Low Risk

| # | Pattern | Source (Mattermost) | Adaptation Guidance | Est. Effort | Why |
|---|---|---|---|---|---|
| 1 | **3000+ emoji dataset** | `webapp/channels/src/utils/emoji.json` (57,799 lines, ~3300 system emojis) | Replace `emoji-data.json` dataset; keep existing picker infrastructure (categories, skin tones, recent, search, preview, colon autocomplete) | 1 day | Users expect full Unicode coverage. Infrastructure already wired — data-only swap. |
| 2 | **Channel context menu (sidebar)** | `sidebar_channel_menu/` (favorite, mute, move, copy, leave, delete) | Use existing message context-menu infrastructure to add right-click on channels. All actions use existing API handlers. | 1 day | Infrastructure exists — wire new trigger. |
| 3 | **Sidebar category management UI** | `sidebar_category/` (466 lines, draggable) | Database tables already exist (`sidebar_categories` + `sidebar_channel_assignments`). Wire HTML5 DnD (proven in channel-list.tsx) to create/rename/reorder/delete. | 2 days | Tables exist, DnD infrastructure exists. Only UI missing. |
| 4 | **DM multi-select creation modal** | `more_direct_channels/more_direct_channels.tsx` (typeahead + checkable list + confirm) | Create dedicated modal with multi-user search/select. DM channel creation API and `dm_channels` table already exist. | 2 days | Users need group DM support. API exists — only UI missing. |
| 5 | **MessageList decomposition** | `post_view/` (split into focused sub-modules) | Complete extraction of reactions, message-editing, timestamp, system-message from 1181-line monolith. 3 of 7 sub-modules already extracted. | 1 day | Improves maintainability; mattermost demonstrates component granularity value. |

### 4.2 Medium Value, Medium Risk

| # | Pattern | Source | Adaptation Guidance | Est. Effort | Why |
|---|---|---|---|---|---|
| 6 | **Global notification settings page** | `user_settings_notifications.tsx` (1300 lines) | Add Notifications tab to existing settings page. Global default preference, push/email toggles, sound selector (9 sounds already exist), quiet hours. Per-channel preferences override global. | 2 days | Per-channel modal exists. Missing global defaults. |
| 7 | **Resizable sidebar drag handle** | `resizable_sidebar/resizable_divider.tsx` (4px handle, mouse tracking, MIN/MAX constants) | Add draggable divider to workspace layout sidebar. Persist width in localStorage. Clamp to 240px-400px. CSS var approach. | 1 day | Layout customization parity with Mattermost, Slack. |
| 8 | **Store abstraction contract tests** | `testlib/` contract tests per interface | Add contract tests for each of the 5 existing store interfaces, verifying CRUD operations against real Supabase. | 1 day | Ensures store implementations are correct and consistent. |

### 4.3 Strategic (Gated)

| # | Pattern | Source | Gating Criteria | Est. Effort | Why |
|---|---|---|---|---|---|
| 9 | **Multi-team sidebar (65px rail)** | `team_sidebar/team_sidebar.tsx` (65px rail, workspace icons, tooltips) | >20% of users belong to >1 workspace | 5 days | Layout change affects all pages. Premature for single-workspace product. |
| 10 | **Full i18n expansion (10+ languages)** | `i18n/` with 60+ JSON translation files | Non-English user growth >10% | 1-2 weeks | Infrastructure scaffolded. Full translation is a separate effort. |
| 11 | **Full TipTap WYSIWYG editor** | `advanced_text_editor/` (30+ files, 3000+ lines) | >30% of users use formatting toolbar monthly (analytics needed) | 2 weeks | Editor installed but needs expansion if usage justifies. |

---

## 5. Areas the Current Repo Should Keep As-Is

These are implementations where Chat is objectively stronger than Mattermost. Do NOT regress these to match Mattermost patterns.

| # | Chat Implementation | Why It's Better | Mattermost Equivalent | Guardrail |
|---|---|---|---|---|
| 1 | **BFF pattern (server-side auth tokens)** | Tokens never exposed to browser JS — critical for XSS mitigation. | Tokens exposed to browser in Redux store or session cookie. | Never expose tokens to browser JS. |
| 2 | **Design tokens (CSS custom properties)** | Enables systematic theming, dark mode, accessibility compliance. | Hardcoded SCSS variables — theme changes require recompilation. | Never migrate to raw SCSS variables. |
| 3 | **Zod validation** | Runtime type checking + TypeScript types from single source. | Go structs + TS types — two sources, potential drift. | Never remove Zod from input paths. |
| 4 | **Optimistic UI (useOptimistic)** | Instant UI updates, rollback on error, server-echo dedup. | Redux dispatch → API call → reducer — blocking UX. | Never remove optimistic updates. |
| 5 | **Idempotency keys** | Prevents duplicate message sends on network retry. | None — duplicates possible on retry. | Never remove idempotency key check. |
| 6 | **Circuit breaker + retry + DLQ** | Prevents cascading failures; dead letter queue for failed deliveries. | None — failures propagate to callers. | Never remove circuit breaker. |
| 7 | **Socket.io (rooms, typing, presence, Redis adapter)** | Full real-time feature set with room management and pub/sub. | Raw WebSocket — every feature built from scratch. | Never replace with raw WebSocket. |
| 8 | **Same-domain Caddy routing** | No CORS issues, single TLS certificate, simpler cookie management. | Subdomain split — CORS complications. | Never split into separate subdomains. |
| 9 | **Feature-based module organization** | Co-located routes, services, tests — easier navigation. | Flat 293-file routes/ directory. | Never flatten modules/ into routes/. |
| 10 | **Vitest** | Faster, ESM-native, less configuration than Jest. | Jest — slower, requires ts-jest, more config. | Never replace Vitest with Jest. |
| 11 | **Docker HEALTHCHECK** | Orchestration-aware auto-restart on failure. | No HEALTHCHECK — hung container reads as "running". | Never remove HEALTHCHECK. |
| 12 | **Graceful shutdown (SIGTERM 10s drain)** | Zero-downtime deploys, in-flight requests complete. | No shutdown handling — connections dropped on restart. | Never remove SIGTERM/SIGINT handlers. |
| 13 | **Consolidated CI (workflow_call)** | DRY workflow configuration, path filters, cancel-in-progress. | 39 independent workflows with duplicated setup. | Never revert to per-job workflows. |
| 14 | **Shared UI component library** | Design system consistency across all surfaces. | Duplicated UI patterns across webapp/, channels/, platform/. | Never inline shared components. |
| 15 | **Tailwind CSS v4** | CSS-first configuration, faster build times, JIT compiler. | tailwindcss v3 — older, slower. | Never downgrade to v3. |
| 16 | **pnpm workspaces** | Disk-efficient, strict dependency isolation, fast installs. | npm workspaces — slower, less strict. | Never migrate to npm workspaces. |
| 17 | **Next.js App Router** | React Server Components, streaming, nested layouts. | Pages Router — older, no RSC support. | Never migrate to Pages Router. |
| 18 | **RBAC (18 granular permissions × 3 roles)** | Fine-grained permission model with `requirePermission()` middleware. | Basic role system (admin/member) with coarser access control. | Never simplify to basic role system. |
| 19 | **Supabase RLS for tenant isolation** | Row-level security enforced at database layer. | Application-layer enforcement in Go handlers. | Never remove RLS policies. |
| 20 | **Rate limiting with composite key (user+IP)** | Stronger than IP-only — prevents IP-sharing bypass. | No explicit rate limiting at server level. | Never fall back to IP-only keys. |

---

## 6. Efficiency Opportunities

### 6.1 Process Improvements

| # | Opportunity | Current State | Improvement | Value | Effort |
|---|---|---|---|---|---|
| 1 | **Migration review checklist** | No formal migration review gate | Add migration review step to PR template: (1) Additive only? (2) Rollback script included? (3) Dry-run against prod copy? (4) CONCURRENTLY for large tables? | Prevents data loss | 30 min |
| 2 | **Post-deployment smoke test** | Health endpoint only | Automated smoke test: auth → workspace → channel → message → file → search. Fail + rollback on any step. | Catches regressions | 2 hours |
| 3 | **Dependency upgrade cadence** | Ad-hoc | Monthly `pnpm update` + automated PR | Reduces tech debt | 1 hour/month |
| 4 | **Migration generator script** | Manual creation | `scripts/generate-migration.ps1` creates paired .sql + _down.sql with timestamp | Ensures rollbacks | 30 min |

### 6.2 Tooling Improvements

| # | Tool | Current State | Improvement | Value |
|---|---|---|---|---|
| 1 | **Bundle analyzer** | Configured but not in CI | Run on PR builds, comment with size diff | Prevents bundle bloat |
| 2 | **Store contract tests** | 5 interfaces, no contract tests | Add contract tests per interface against real Supabase | Ensures store correctness |
| 3 | **Visual regression testing** | Playwright screenshots (1 spec) | Add Storybook test-runner + Chromatic | Catches UI regressions |
| 4 | **Performance budget CI** | No performance baselines | Lighthouse CI with LCP <2.5s, TTI <3.5s, CLS <0.1 | Prevents perf regressions |

### 6.3 Architecture Improvements

| # | Improvement | Current State | Target State | Value | Risk |
|---|---|---|---|---|---|
| 1 | **Store contract tests** | No contract tests | Each of 5 interfaces tested against real Supabase + mock | Testability | Low |
| 2 | **OpenAPI specification** | No API docs | Zod schemas exported to OpenAPI, served at `/v1/docs` | Developer onboarding | Low |
| 3 | **Component library expansion** | 7 shared components | 20+ shared components with tests + Storybook stories | Design system maturity | Low |

---

## 7. Risk Register

### 7.1 High Risk

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-001 | **Multi-team sidebar breaks responsive layout** | Low | High | GATE: require >20% multi-workspace analytics. Test at 768px, 1024px, 1440px. CSS var approach prevents JS layout shifts. |
| R-002 | **MessageList decomposition breaks rendering** | Medium | High | Visual smoke test covering all message states. E2E for send → edit → delete. |
| R-003 | **Emoji dataset swap causes picker performance regression** | Medium | Medium | Virtualize emoji grid. Profile render time before/after. Load 3000+ emojis in background. |
| R-004 | **Resizable sidebar breaks responsive layout** | Low | High | Test at 768px, 1024px, 1280px, 1440px. CSS var approach prevents JS layout shifts. |

### 7.2 Medium Risk

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-005 | **DM creation creates duplicate channels** | Low | Medium | API-level dedup check (already in dm_channels migration). E2E verifies redirect to existing DM. |
| R-006 | **Category management migration for existing users missing** | Medium | Medium | Backfill script that creates default categories for users created before migration. |
| R-007 | **Notification settings global vs per-channel confusion** | Low | Medium | Global defaults apply to new channels only. Per-channel overrides explicitly marked. "Reset to default" button. |
| R-008 | **Channel context menu positioning on narrow screens** | Low | Medium | Test at 375px, ensure menu doesn't overflow viewport. Use smart positioning (flip/flush). |

### 7.3 Security Posture Comparison

| Dimension | Mattermost | Chat | Verdict |
|---|---|---|---|
| **Auth** | Session cookie + DB lookup. Tokens exposed. | BFF pattern (server-side JWT). No tokens exposed to browser. | **Chat stronger** |
| **HTTP headers** | 5 configurable headers | 12 security headers, full CSP with `'self'` only scripts | **Chat stronger** |
| **Input validation** | Go type system + manual checks | Zod schemas on all inputs | **Chat stronger** |
| **Rate limiting** | None at server level | Per-endpoint with user+IP composite keys | **Chat stronger** |
| **CSRF** | Relies on subdomain separation | Double-submit cookie + origin check + BFF same-origin | **Chat stronger** |
| **XSS prevention** | Backend output sanitization | CSP + DOMPurify + BFF token isolation | **Chat stronger** |
| **Secrets management** | config.json on filesystem | Zod-enforced env schema with runtime validation | **Chat stronger** |
| **Dependency scanning** | Dependabot (recent) | pnpm audit + Dependabot (3 ecosystems) + Trivy in CI | **Chat stronger** |
| **Tenant isolation** | Application-layer enforcement | RLS policies on all tables + SECURITY INVOKER | **Chat stronger** |
| **Audit logging** | Broader coverage from more feature surface | 9 event types, coverage gaps in auth/webhooks/files | **Mattermost stronger** |

**Overall**: Chat has a stronger security posture in 9 of 10 dimensions. The lone gap (audit logging breadth) is a gap of scope, not architecture.

---

## 8. Safe Alignment Roadmap

### Phase 1: Quick Wins (~6 engineering days)

| Patch Set | Item | Effort | Devs | Risk | Depends On |
|---|---|---|---|---|---|
| PS1 | Emoji expansion (3000+ dataset swap) | 1 day | 1 | Low | None |
| PS2 | DM multi-select creation modal | 2 days | 1 | Low-Med | None |
| PS3 | Sidebar channel context menu | 1 day | 1 | Low | None |

### Phase 2: Medium Priority (~6 engineering days)

| Patch Set | Item | Effort | Devs | Risk | Depends On |
|---|---|---|---|---|---|
| PS4 | Sidebar category management UI | 2 days | 1 | Low | None |
| PS5 | MessageList decomposition completion | 1 day | 1 | Medium | PS2 merged (branch hygiene) |
| PS6 | Resizable sidebar drag handle | 1 day | 1 | Medium | None |
| PS7 | Global notification settings page | 2 days | 1 | Low | None |

### Phase 3: Strategic (Gated)

| Patch Set | Item | Effort | Gating Criterion |
|---|---|---|---|
| PS8 | Multi-team sidebar (65px rail) | 5 days | >20% of users in >1 workspace |
| — | Store abstraction contract tests | 1 day | Before any store interface changes |
| — | Full i18n expansion (10+ languages) | 1-2 weeks per language | Non-English user growth >10% |

### Phase Gates

**Phase 1 Gate:**
- [ ] All 54+ existing unit tests pass
- [ ] All E2E tests pass (auth, home, file-upload, messaging, navigation, search, comprehensive, visual-snapshot)
- [ ] `pnpm typecheck` (0 errors), `pnpm lint` (0 warnings on changed files)
- [ ] Emoji picker: all categories render, 3000+ emojis insert correctly
- [ ] DM creation: single DM and group DM both create correct channels. Existing DM with same set redirects.
- [ ] Channel context menu: right-click on each channel type shows correct options; all actions functional

**Phase 2 Gate:**
- [ ] Phase 1 complete and validated
- [ ] Category management: create → rename → drag-reorder → delete persists to database
- [ ] MessageList decomposition: all states render identically (before/after DOM comparison)
- [ ] Resizable sidebar: drag persists across reload. Responsive breakpoints intact.
- [ ] Notification settings: global defaults respected. Per-channel overrides work.
- [ ] Full regression suite passes (54+ unit + E2E + integration)

---

## 9. File/Area Change Recommendations

### Phase 1 Files

| File | Change | Risk | Reference |
|---|---|---|---|
| `apps/web/lib/emoji/emoji-data.json` | REPLACE — swap to 3300+ dataset | Low | Mattermost `utils/emoji.json` |
| `apps/web/components/chat/emoji-picker.tsx` | MODIFY — virtualize grid | Low | — |
| `apps/web/components/chat/create-dm-modal.tsx` | CREATE — multi-user search/select | Low-Med | Mattermost `more_direct_channels.tsx` |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY — DM creation button | Low | — |
| `apps/api/src/modules/channels/service.ts` | MODIFY — bulk member add on DM creation | Low | — |
| `apps/web/components/workspace/channel-context-menu.tsx` | CREATE — right-click channel menu | Low | Mattermost `sidebar_channel_menu/` |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY — right-click handler | Low | — |

### Phase 2 Files

| File | Change | Risk | Reference |
|---|---|---|---|
| `apps/web/components/workspace/sidebar-category-manager.tsx` | CREATE — category CRUD with DnD | Low | Mattermost `sidebar_category/` |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY — integrate category manager | Low | — |
| `apps/web/components/chat/message-list/reactions.tsx` | EXTRACT from monolith | Medium | — |
| `apps/web/components/chat/message-list/message-editing.tsx` | EXTRACT from monolith | Medium | — |
| `apps/web/components/chat/message-list/timestamp.tsx` | EXTRACT from monolith | Medium | — |
| `apps/web/components/chat/message-list/system-message.tsx` | EXTRACT from monolith | Medium | — |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY — resizable divider | Medium | Mattermost `resizable_divider.tsx` |
| `apps/web/app/(workspace)/layout.tsx` | MODIFY — CSS var for sidebar width | Medium | — |
| `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx` | MODIFY — notifications tab | Low | Mattermost `user_settings_notifications.tsx` |
| `apps/api/src/modules/preferences/routes.ts` | MODIFY — global preferences CRUD | Low | — |

### Phase 3 (Gated) Files

| File | Change | Risk | Gate |
|---|---|---|---|
| `apps/web/components/workspace/team-rail.tsx` | CREATE — 65px workspace rail | High | >20% multi-ws users |
| `apps/web/app/(workspace)/layout.tsx` | MODIFY — add rail | High | — |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY — shift right | High | — |
| `apps/api/src/modules/workspaces/service.ts` | MODIFY — multi-ws queries | Low | — |

### Files to NOT Touch (Ever)

| File | Reason |
|---|---|
| `apps/api/src/middleware/authenticate.ts` | Auth gate for every operation. See guardrail #1. |
| `apps/api/src/modules/auth/` | Auth flow is critical path. Requires comprehensive test coverage before any change. |
| `apps/web/components/auth/auth-context.tsx` | Auth context is the client-side auth boundary. |
| `apps/web/app/api/v1/[...path]/route.ts` (BFF) | Chat's best security feature. Changes could break all API calls. |
| `apps/api/src/lib/socket.ts` | Socket.io event contracts must be additive only. |
| `infra/docker/Caddyfile` + `Caddyfile.prod` | Route mappings are production contracts. |
| `apps/api/server.ts` | Entry point with graceful shutdown (SIGTERM/SIGINT 10s drain). |
| `.github/workflows/deploy-development.yml` | Fragile SSH-based deployment pipeline. |
| `packages/ui/src/components/` (existing) | Shared UI library is Chat's design system foundation. |

---

## 10. Do-Not-Break Guardrails

### Critical (P0 — Never Break)

| # | Guardrail | Rationale | Enforcement |
|---|---|---|---|
| 1 | **Never expose auth tokens to browser JS** | The BFF pattern is Chat's best security feature. | Review any change touching `authenticate.ts`, `supabase/client.ts`, or BFF `route.ts`. |
| 2 | **Never change Socket.io event names or payload shapes** | Every event is a contract consumed by all connected clients. | Additive events only. `git grep` on event names before any change. |
| 3 | **Never remove idempotency keys from message creation** | Prevents duplicate message sends on network retry. Mattermost lacks this. | Block any PR that removes idempotency key check. |
| 4 | **Never remove DOMPurify from markdown preview** | XSS prevention in rendered markdown is non-negotiable. | Block any PR that removes or bypasses DOMPurify sanitization. |
| 5 | **Never remove CSRF protection** | Defense in depth: double-submit cookie + origin check + same-site cookie. | Block any PR that removes CSRF middleware. |
| 6 | **Never replace Socket.io with raw WebSocket** | Socket.io provides rooms, namespaces, Redis adapter, auto-reconnect. | Block any PR that removes `socket.io` dependency. |
| 7 | **Never downgrade from Tailwind CSS v4 to v3** | v4 has CSS-first configuration, faster builds, smaller output. | Block any PR that changes `tailwindcss` version to <4. |
| 8 | **Database migrations must be additive-only** | Never destructive operation after migration applied to any environment. | Migration review checklist before any DB change. |
| 9 | **Never flatten modules/ into routes/** | Feature-based module organization is superior to flat directory. | Block any PR that restructures `modules/` directory. |
| 10 | **Never remove circuit breaker or DLQ** | Prevents cascading failures in async processing. | Block any PR that removes circuit breaker or dead letter queue. |

### High (P1 — Break Only with Strong Justification)

| # | Guardrail | Rationale | Enforcement |
|---|---|---|---|
| 11 | **Never remove Docker HEALTHCHECK** | Enables Docker to detect and restart unhealthy containers. | Block any PR that removes HEALTHCHECK. |
| 12 | **Never remove graceful shutdown handlers** | 10-second SIGTERM drain prevents dropped connections during deploys. | Block any PR that removes SIGTERM/SIGINT handlers from `server.ts`. |
| 13 | **Rate limiters must keep composite key (user+IP)** | IP-only allows IP-sharing bypass. | Block any PR that falls back to IP-only keys. |
| 14 | **CSP must remain restrictive** | `script-src 'self'` only. No `'unsafe-eval'`. | Security review required for any CSP change. |
| 15 | **No simultaneous model-layer refactor and feature addition** | Creates unbounded risk — which change broke what? | Architecture review gate for mixed refactor+feature PRs. |

---

## 11. Validation Checklist

### Stage 1: Pre-Implementation

- [ ] `pnpm test` passes (all 54+ existing tests)
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes (0 warnings on changed files)
- [ ] `pnpm dev` starts without errors
- [ ] All prior audit phases reviewed and understood

### Stage 2: Phase 1 Complete

- [ ] All existing unit tests still pass
- [ ] All E2E tests pass (auth, home, file-upload, messaging, navigation, search, comprehensive, visual-snapshot)
- [ ] `pnpm typecheck` (0 errors), `pnpm lint` (0 warnings)
- [ ] Emoji picker: 9 category tabs render, 3000+ emojis insert correctly, search works, skin tones persist, colon autocomplete works
- [ ] DM creation: single DM and group DM (3+ users) create correct channels, existing DM with same members redirects
- [ ] Channel context menu: right-click on public/private/DM/GM channels shows correct options; all actions functional
- [ ] Visual QA: message list, sidebar, emoji picker, file preview render correctly at 375px, 768px, 1440px
- [ ] Lighthouse scores within baseline ±5% (LCP, TTI, CLS)

### Stage 3: Phase 2 Complete

- [ ] Phase 1 complete and validated
- [ ] Category management: create → rename → drag-reorder → delete persists to database
- [ ] MessageList decomposition: all message states render identically (before/after DOM structure comparison)
- [ ] Resizable sidebar: drag handle appears on hover, drag resizes smoothly (240px-400px), width persists across reload, responsive breakpoints intact
- [ ] Notification settings: global defaults applied to new channels, per-channel overrides work, sounds, push, quiet hours functional
- [ ] Full regression suite passes (54+ unit + E2E + integration)
- [ ] Performance benchmarks within baseline ±10%

### Stage 4: Pre-Deployment (Any Phase)

- [ ] CI pipeline green (all checks pass)
- [ ] Migration dry-run against production copy (read replica or backup restore)
- [ ] Rollback plan reviewed and accessible
- [ ] Feature flag in place if change is high-risk (Phase 2+ items)
- [ ] Monitoring dashboards reviewed (error rates, latency, memory)
- [ ] On-call engineer notified of deployment

### Go/No-Go Gates for Phase 3 Items

| Item | Go Criteria | Metrics Source | Review Cadence |
|---|---|---|---|
| Multi-team sidebar | >20% of users in >1 workspace | Workspace membership count per user | Monthly |
| i18n expansion (10+ languages) | Non-English user growth >10% | Auth provider locale data | Monthly |
| Full TipTap expansion | >30% formatting toolbar usage | PostHog/analytics event | After 2 weeks post-launch |

---

## 12. Final Recommendation

### Verdict: PROCEED — GO WITH CONDITIONS

**Decision:** PROCEED with Phases 1-2 (8 patch sets, ~12-15 engineering days across ~1.5 weeks with 2 devs).
**Conditions:** Phase 3 strategic items (multi-team sidebar, i18n expansion, full TipTap expansion) are gated on post-launch analytics. Do NOT regress any of the 20 "keep as-is" architectural choices (Section 5). All 15 do-not-break guardrails (Section 10) are non-negotiable.

### Value/Risk Matrix

```
High Value
    |
    |  [Phase 1: Emoji expansion, DM modal, channel context menu]
    |  [Phase 2: Category management, MessageList split,
    |   resizable sidebar, notification settings]
    |
    |  [Phase 3: Multi-team sidebar (GATED)]
    |
    |  [Enterprise: i18n expansion, LDAP/SAML, plugins]
Low Value
    ---------------+-------------->
    Low Risk          High Risk
```

### Resource Estimate

| Phase | Patch Sets | Engineering Days | Calendar Time (2 devs) | Total Dev-Days |
|---|---|---|---|---|
| Phase 1 | PS1, PS2, PS3 | 4 days | 3 days | 4 |
| Phase 2 | PS4, PS5, PS6, PS7 | 6 days | 3 days | 6 |
| **Total (Phases 1-2)** | **7 patch sets** | **~10 days** | **~6 calendar days** | **10** |
| Phase 3 (GATED) | PS8 + expansions | 5-10 days | 3-5 days | 5-10 |

### Critical Risks to Monitor

| Risk | Monitoring Mechanism | Threshold | Response |
|---|---|---|---|
| Emoji picker performance | Render time profiling | >200ms picker open time | Virtualize grid or lazy-load categories |
| MessageList decomposition rendering | Visual regression tests + E2E | Any pixel diff >1% | Revert to single message-list.tsx |
| Resizable sidebar breakage | Responsive QA at 3 breakpoints | Sidebar overflow at any breakpoint | Remove drag handle, revert to fixed width |
| DM creation duplicates | E2E + API-level dedup check | Duplicate DM channels created | Fix API dedup, re-run E2E |
| Category migration for existing users | Migration test | Missing default categories | Run backfill script on deploy |

### Final Assessment

The Chat repo is not a "worse" version of Mattermost. In 17 architectural dimensions, it is objectively stronger. The 6-year Mattermost codebase has broader feature surface and more operational maturity in specific areas, but Chat's foundation is architecturally superior.

The July 1-8 implementation wave dramatically accelerated convergence. 20+ features and infrastructure items were implemented, closing the gap on:
- Migration rollback safety (0→52 rollback scripts)
- Infrastructure shared config (0→14 files in packages/config/)
- Store abstraction (direct Supabase→5 typed interfaces)
- i18n foundation (0→full locale system with en.json)
- Onboarding UX (0→5-step task list)
- Drafts auto-save (0→localStorage-based)
- WYSIWYG editor (0→TipTap with 4 extensions)
- Keyboard shortcuts (flat→categorized modal)
- Sidebar navigation (basic→workspace switcher dropdown)
- File preview (basic→metadata+zoom+nav)
- E2E test coverage (1-2→9+ spec files)
- Supabase seeds (0→9 seed files)

The remaining 8 patch sets deliver the highest-value alignment items within ~10-15 engineering days, with clear gates and rollback procedures. The 15 do-not-break guardrails protect Chat's architectural advantages. The Phase 3 gating criteria ensure that the highest-effort strategic items (multi-team sidebar, i18n expansion, full TipTap expansion) are only pursued when analytics justify the investment.

**Go decision:** Approved for Phases 1-2 (10 engineering days of patch implementation). Phase 3 items are gated on post-launch analytics. All 20 architectural guardrails are non-negotiable. Any violation requires immediate rollback.
