# 30/60/90 Day UX Roadmap — July 16, 2026

## First 30 Days: Critical & High Priority Fixes

| Week | Focus                        | Items                                                       | Effort |
| ---- | ---------------------------- | ----------------------------------------------------------- | ------ |
| 1    | Mobile admin + a11y          | UX-101: Admin mobile tab selector                           | S      |
|      |                              | UX-102: aria-activedescendant in search-bar                 | XS     |
|      |                              | UX-214: role="alert" on all error boundaries                | XS     |
| 2    | Touch targets + loading      | UX-103: Formatting bar touch targets (44px mobile)          | XS     |
|      |                              | UX-215: aria-busy + role=status on loading states           | XS     |
|      |                              | UX-216: Replace root/auth spinners with skeletons           | S      |
|      |                              | UX-217: Fix workspace skeleton on mobile                    | XS     |
| 3    | Focus traps + error handling | UX-107: Focus traps in settings confirm dialogs             | S      |
|      |                              | UX-108: Error state in channel-info instead of silent catch | S      |
|      |                              | UX-218: Focus trap + dialog role for onboarding tour        | S      |
|      |                              | UX-219: Focus trap + aria-modal for cookie banner           | S      |
| 4    | Remaining P1 + P2 a11y       | UX-204/205: role="listbox" on search surfaces               | S      |
|      |                              | UX-207: focus ring on formatting bar                        | XS     |
|      |                              | UX-208: Fix aria-pressed on link/image buttons              | XS     |
|      |                              | UX-220: Tab ARIA in channel-info                            | S      |
|      |                              | UX-221: Actionable empty states in channel-info             | S      |

**End of 30 days:** All P1 issues resolved. Mobile admin functional. Accessibility baseline hardened.

## Days 31-60: i18n + Design System

| Week | Focus                   | Items                                         | Effort |
| ---- | ----------------------- | --------------------------------------------- | ------ |
| 5-6  | Admin i18n              | UX-104: Migrate admin 150+ strings to t()     | XL     |
| 6-7  | Settings i18n           | UX-105: Migrate settings 80+ strings to t()   | L      |
| 7    | Search i18n             | UX-106: Migrate search-bar 50+ strings to t() | M      |
|      |                         | UX-209: Formatting bar i18n                   | S      |
|      |                         | UX-210: Notification modal i18n               | S      |
| 8    | Keyboard shortcuts i18n | UX-211: Migrate 25+ strings                   | S      |
|      |                         | UX-212: Mac modifier detection                | XS     |
|      |                         | UX-213: aria-live on filtered results         | XS     |
| 8    | Duplicated code         | UX-222: Extract highlightText utility         | S      |
|      |                         | UX-223: Extract Pagination component          | S      |
|      |                         | UX-224: Fix admin stat grid on mobile         | XS     |

**End of 60 days:** All i18n gaps closed. Design system drift items consolidated. Foundational a11y tests in place.

## Days 61-90: Enterprise Polish + Test Infrastructure

| Week | Focus                        | Items                                        | Effort |
| ---- | ---------------------------- | -------------------------------------------- | ------ |
| 9    | axe-core integration         | Add @axe-core/playwright to E2E pipeline     | M      |
|      |                              | Add visual snapshot for workspace/chat view  | S      |
|      |                              | Add focus trap tests for all 12+ modals      | M      |
| 10   | Interactive responsive tests | Sidebar collapse tests at 768px breakpoint   | M      |
|      |                              | Bottom nav visibility/behavior tests         | S      |
|      |                              | Admin panel mobile tab tests                 | S      |
| 11   | message-input decomposition  | UX-317: Plan split, begin extraction         | XL     |
|      |                              | UI/UX test for remaining untested components | L      |
|      |                              | Add character counters to textareas          | XS     |
| 12   | Theme consolidation          | UX-226: Document CSS var layers              | S      |
|      |                              | UX-228: Fix dark mode alpha var usage        | S      |
|      |                              | UX-321: Split --border-default token         | S      |
|      |                              | UX-322: Implement or remove density modes    | M      |

**End of 90 days:** Automated a11y regression in CI. 50%+ component test coverage. Single CSS var convention established. Enterprise-ready posture achieved.

## Quick Win Sprint (Week 0 — Immediate)

These can be done in parallel in a single day:

| Item                                    | Files                   | Lines   |
| --------------------------------------- | ----------------------- | ------- |
| UX-102: aria-activedescendant           | search-bar.tsx          | ~15     |
| UX-207: focus ring on formatting bar    | formatting-bar.tsx      | ~3      |
| UX-214: role="alert" on errors          | 6 error files           | ~6 each |
| UX-215: aria-busy on loading            | 5 loading files         | ~3 each |
| UX-217: hide sidebar skeleton on mobile | (workspace)/loading.tsx | ~1      |
| UX-212: Mac modifier detection          | keyboard-shortcuts.tsx  | ~5      |
| UX-313: dynamic year in operator hint   | search-bar.tsx          | ~1      |
