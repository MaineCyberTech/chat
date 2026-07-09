# Frontend Release Gate Report

- Prompt: **chat_ux_specialization**
- Domain: **uxui**
- Run ID: **chat_ux_specialization_20260707_074854**
- Generated: **2026-07-07T12:00:00Z**
- Decision: **GO**
- P0: **0**, P1: **2**
- P2: **5**, P3: **5**
- Readiness: **69.00**

## Findings

### P1 — Full page reload on DM and channel creation using window.location.href instead of router.push

- **File:** `apps/web/components/workspace/app-sidebar.tsx:190`
- **Category:** ux
- **Impact:** Jarring full page reload loses React state, resets scroll position, and defeats PWA app-shell model on mobile
- **Fix:** Use Next.js router.push() with shallow routing for channel/DM navigation after creation

### P1 — Mobile bottom navigation bar fixed at bottom with no content padding compensation

- **File:** `apps/web/app/(workspace)/layout.tsx:269`
- **Category:** responsive
- **Impact:** Last messages and input area partially hidden behind 3.5rem fixed nav bar on mobile screens
- **Fix:** Add padding-bottom of 3.5rem to the main content scroll container to account for fixed bottom nav

### P2 — Empty channel state lacks actionable guidance or onboarding context for new users

- **File:** `apps/web/components/chat/message-list.tsx:350`
- **Category:** ux
- **Impact:** New users joining an empty channel may be uncertain how to begin participating
- **Fix:** Add contextual empty state with channel purpose, onboarding hints, or a clickable 'Say hello!' suggestion

### P2 — No feedback when @mention query matches no channel members

- **File:** `apps/web/components/chat/message-input.tsx:821`
- **Category:** ux
- **Impact:** Users may be confused why @mention autocomplete is not responding; no indication that the name doesn't exist
- **Fix:** Show a 'No members found matching query' message below the input when filteredMembers is empty and mentionQuery is active

### P2 — Sidebar category drag-and-drop lacks drag ghost image and channel-to-category drag support

- **File:** `apps/web/components/workspace/app-sidebar.tsx:283`
- **Category:** ux
- **Impact:** Drag-and-drop feels unpolished; channels cannot be dragged between categories, only via API
- **Fix:** Add drag ghost image via e.dataTransfer.setDragImage(), show drop zone indicators for channels, and enable channel-to-category drag

### P2 — Priority warning and @everyone modals do not restore focus to message input after close

- **File:** `apps/web/components/chat/message-input.tsx:1109`
- **Category:** accessibility
- **Impact:** Keyboard navigation flow is interrupted after modal confirmations; keyboard users must tab back to input manually
- **Fix:** After modal close, call tiptapRef.current?.commands.focus() or manually focus the editor element

### P2 — Mobile thread panel uses ArrowLeft icon for close — ambiguous UX pattern

- **File:** `apps/web/components/chat/chat-view.tsx:756`
- **Category:** ux
- **Impact:** Users may expect ArrowLeft to navigate back in browser history rather than close the thread panel
- **Fix:** Use X icon consistently for closing mobile RHS panels, or add close label text alongside ArrowLeft

### P3 — Search bar placeholder text may overflow on narrow mobile screens

- **File:** `apps/web/components/chat/chat-view.tsx:636`
- **Category:** responsive
- **Impact:** Minor visual overflow on very narrow viewports where search bar max-width is constrained
- **Fix:** Use shorter placeholder on mobile (e.g., 'Search...') or remove max-width constraint on small screens

### P3 — Status picker positioned with hardcoded bottom:48px offset relative to sidebar container

- **File:** `apps/web/components/workspace/app-sidebar.tsx:1099`
- **Category:** ux
- **Impact:** Status picker may render at wrong position if sidebar footer layout height changes
- **Fix:** Position status picker relative to the avatar button using dynamic top calculation or portal-based positioning

### P3 — Reaction tooltip uses native HTML title attribute — not keyboard accessible, no user names shown

- **File:** `apps/web/components/chat/message-list/message-item.tsx:447`
- **Category:** ux
- **Impact:** Reaction tooltips cannot be triggered by keyboard and do not display names of who reacted
- **Fix:** Add proper tooltip component listing names of users who reacted on hover/focus, or use aria-label with aggregated count

### P3 — Settings and admin page content unknown — may lack loading states or permission checks

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx:1`
- **Category:** ux
- **Impact:** Unknown UX quality for settings and admin flows; potential missing loading/error states
- **Fix:** Verify settings and admin pages have loading skeletons, permission checks, and consistent layout with workspace shell

### P3 — OnboardingTour component always rendered but trigger logic unclear — may not activate for new users

- **File:** `apps/web/app/(workspace)/layout.tsx:329`
- **Category:** ux
- **Impact:** New users may miss guided onboarding if tour trigger condition is not properly configured
- **Fix:** Verify onboarding tour trigger is functional and appears for newly created user accounts on first workspace visit
