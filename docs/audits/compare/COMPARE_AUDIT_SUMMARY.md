# Merged Comparative Repo Audit — Final Reconciliation (Revised July 8, 2026)

**Reference Repo**: `C:\temp\mattermost-master` — Go backend, React/Redux frontend, 15,031 files, 6-year mature codebase
**Current Repo**: `C:\temp\chat` — Express/TS API, Next.js 15 App Router, Supabase PostgreSQL, BullMQ worker
**Audit Scope**: Full structural, architectural, and implementation comparison across 8 phases

---

## 1. Executive Summary

This audit compares a 6-year production-hardened chat platform (Mattermost) against a 6-month greenfield chat platform (Chat) to produce a single source of truth about what to adopt, what to keep, and what never to change.

**Key finding**: Chat has a **stronger architectural foundation** in 17 dimensions (BFF pattern, design tokens, Zod, optimistic UI, idempotency, circuit breaker, Socket.io, Vitest, HEALTHCHECK, graceful shutdown, consolidated CI, shared UI library, Tailwind v4, pnpm, App Router, RBAC, Supabase RLS). Mattermost has **broader feature surface** (emoji, i18n, enterprise auth, plugin ecosystem) and more operational maturity in specific areas.

**July 1-8 implementation progress**: 20+ features/infrastructure items implemented, closing critical gaps in migration rollbacks (0→52), store abstraction, i18n infrastructure, onboarding, drafts, WYSIWYG, seed data, E2E tests, keyboard shortcuts, file preview, and more.

**Recommendation**: PROCEED with 8 remaining patch sets (~10-15 engineering days, ~1.5 weeks with 2 devs). DEFER strategic items (multi-team sidebar, i18n expansion) until post-launch analytics justify the investment.

---

## 2. Implementation Progress Summary

| Feature | Before July 1 | After July 8 | Status |
|---|---|---|---|
| Emoji picker | ~600 emojis, basic | ~600 emojis + full infrastructure | 🟡 Needs data expansion |
| Keyboard shortcuts | Flat list, 8+ | Categorized modal, 10+ | ✅ |
| Sidebar workspace menu | Basic header | Full dropdown with switcher | ✅ |
| File preview | Basic overlay | Metadata + zoom + nav | ✅ |
| i18n infrastructure | None | `lib/i18n/` + en.json | ✅ |
| Onboarding tour | None | 5-step task list | ✅ |
| Drafts auto-save | None | localStorage auto-save | ✅ |
| TipTap editor | None | Installed with TaskList, Link, Placeholder | ✅ |
| Store abstraction | Direct Supabase | 5 typed interfaces | ✅ |
| Supabase seeds | 0 | 9 seed files | ✅ |
| Migration rollbacks | 0 | 52 _down.sql files | ✅ |
| Shared config | Per-package | `packages/config/` (14 files) | ✅ |
| E2E test coverage | 1-2 spec files | 9+ spec files | ✅ |
| MessageList decomposition | Monolith (1181 lines) | 3/7 sub-modules extracted | 🟡 Partial |
| Emoji dataset | ~600 | ~600 (target: 3300+) | ❌ Pending |
| DM multi-select modal | Inline/basic | None | ❌ Pending |
| Sidebar channel context menu | None | None | ❌ Pending |
| Sidebar category management UI | Tables exist | No UI | ❌ Pending |
| Resizable sidebar | Fixed width | None | ❌ Pending |
| Global notification settings | Per-channel only | None | ❌ Pending |
| Multi-team sidebar (65px rail) | Dropdown only | None | ❌ Gated |

---

## 3. Key Documents

| Phase | File | Description |
|---|---|---|
| Phase 1 | `01_INVENTORY.md` | File/directory inventory of both repos |
| Phase 2 | `02_MAPPING.md` | Feature and architecture mapping |
| Phase 3 | `03_FINDINGS.md` | Strengths, weaknesses, efficiency opportunities |
| Phase 4 | `04_RISK.md` | Risk, stability, do-not-break analysis |
| Phase 5 | `05_ROADMAP.md` | Phased alignment roadmap |
| Phase 6 | `06_CHANGE_PLAN.md` | File-by-file change plan (revised July 8) |
| Phase 7 | `07_PATCH_SETS.md` | Patch set design (revised July 8) |
| Phase 8 | `AUDIT_PHASE_8_FINAL_RECONCILIATION.md` | Final SSOT reconciliation (revised July 8) |

---

## 4. Recommendations by Priority

### Immediate (Phase 1 — 4 engineering days)
1. **Emoji expansion** — swap ~600 dataset with 3300+ Unicode set (1 day)
2. **DM multi-select creation modal** — typeahead + checkable list + confirm (2 days)
3. **Sidebar channel context menu** — right-click on channels (1 day)

### Short-term (Phase 2 — 6 engineering days)
4. **Sidebar category management UI** — create/rename/reorder/delete categories (2 days)
5. **MessageList decomposition completion** — extract remaining 4 sub-modules (1 day)
6. **Resizable sidebar drag handle** — 240-400px adjustable width (1 day)
7. **Global notification settings page** — defaults, sounds, quiet hours (2 days)

### Strategic (Phase 3 — Gated)
8. **Multi-team sidebar (65px rail)** — requires >20% multi-workspace user analytics
9. **Full i18n expansion** — requires >10% non-English user growth
10. **Full TipTap WYSIWYG expansion** — requires >30% formatting toolbar usage

---

## 5. Do-Not-Break Guardrails (Summary)

| # | Guardrail | Severity |
|---|---|---|
| 1 | Never expose auth tokens to browser JS | Critical |
| 2 | Never change Socket.io event names or payload shapes | Critical |
| 3 | Never remove idempotency keys | Critical |
| 4 | Never remove DOMPurify from markdown preview | Critical |
| 5 | Never remove CSRF protection | Critical |
| 6 | Never replace Socket.io with raw WebSocket | Critical |
| 7 | Never downgrade Tailwind v4 to v3 | Critical |
| 8 | Database migrations must be additive-only | Critical |
| 9 | Never flatten modules/ into routes/ | Critical |
| 10 | Never remove circuit breaker or DLQ | Critical |

See `AUDIT_PHASE_8_FINAL_RECONCILIATION.md` §10 for the full list including 5 high-severity guardrails.

---

## 6. Final Recommendation

**Verdict: PROCEED with Phases 1-2 (7 patch sets, ~10 engineering days).**

Chat is not a "worse" Mattermost. In 17 architectural dimensions it is objectively stronger. The remaining gaps are:
- **Feature breadth** (emoji completeness, channel context menus, category management)
- **UX polish** (DM creation, sidebar resizing, notification settings)
- **Strategic expansion** (multi-team sidebar, i18n, analytics-gated items)

All 20 architectural guardrails are non-negotiable. Phase 3 items are gated on post-launch analytics. Any violation of guardrails requires immediate rollback.
