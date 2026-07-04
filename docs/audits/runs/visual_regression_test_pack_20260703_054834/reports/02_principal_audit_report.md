# Principal Audit Report

- Prompt: **visual_regression_test_pack**
- Domain: **testing**
- Run ID: **visual_regression_test_pack_20260703_054834**
- Generated: **2026-07-03T14:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **2**, P3: **0**
- Readiness: **65.00**

## Findings

### P1 — No visual regression testing tool configured — no Percy, Chromatic, Playwright screenshot, or custom snapshot infrastructure

- **File:** `apps/web/`
- **Category:** tooling
- **Impact:** Visual regressions in a complex chat application with multiple themes (light/dark), responsive breakpoints (mobile/tablet/desktop), and dynamic state (loading/empty/error/online-offline) go completely undetected. A CSS change that breaks message bubble alignment, breaks sidebar responsiveness, or inverts dark mode colors cannot be caught in CI.
- **Fix:** Add Playwright screenshot testing with @playwright/test snapshot matchers. Configure dedicated viewport snapshots (375px, 768px, 1280px). Add CI step for visual regression with diff threshold alerts.

### P2 — 12+ conditional rendering states (empty, loading, error, typing indicator, editing, replying, thread preview, search results, pinned messages, etc.) have no visual snapshot coverage

- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** state_coverage
- **Impact:** The message list component has the most complex rendering logic in the app, with 12+ visual states depending on context. Without snapshots, a refactor that breaks the empty state message, misaligns the typing indicator, or corrupts the editing UI will go undetected until a user reports it.
- **Fix:** Create snapshot stories/tests for each visual state: (1) empty channel (no messages), (2) loading messages (skeleton), (3) error loading messages, (4) typing indicator visible, (5) message editing UI, (6) thread reply preview, (7) search results mode, (8) pinned message banner.

### P2 — Sidebar auto-collapse behavior at md breakpoint (768-1024px) has no visual regression test for the three viewport states

- **File:** `apps/web/components/workspace/app-sidebar.tsx`
- **Category:** responsive_coverage
- **Impact:** The recently implemented responsive sidebar now has three states: expanded sidebar (lg+), auto-collapsed with hamburger (md), and bottom navigation (mobile). Each state renders different navigation elements and layout. Without snapshots at each breakpoint, a CSS or component change that breaks the collapsing behavior or misaligns the hamburger button will not be detected.
- **Fix:** Add Playwright viewport snapshots at: (1) 1280px width (desktop — full sidebar), (2) 900px width (tablet — collapsed sidebar with hamburger), (3) 375px width (mobile — bottom nav). Verify sidebar state and hamburger visibility at each breakpoint.
