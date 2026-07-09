# Principal Audit Report

- Prompt: **frontend_audit_deep_dive**
- Domain: **frontend**
- Run ID: **frontend_audit_deep_dive_20260707_074853**
- Generated: **2026-07-07T12:00:00Z**
- Decision: **GO**
- P0: **0**, P1: **3**
- P2: **8**, P3: **6**
- Readiness: **65.00**

## Findings

### P1 — No ARIA live region on message list for screen reader new-message announcements

- **File:** `apps/web/components/chat/chat-view.tsx:675`
- **Category:** accessibility
- **Impact:** Screen reader users may miss incoming messages in real-time chat; role='log' with aria-atomic='false' is set but no aria-live='polite' explicitly configured
- **Fix:** Add aria-live='polite' to the message list container and ensure new messages trigger announcement via a hidden live region or polite assertion

### P1 — Raw CSS variables used inline instead of Tailwind classes — inconsistent theming across 40+ components

- **File:** `apps/web/components/chat/chat-view.tsx:60`
- **Category:** design_system
- **Impact:** Theming is scattered across inline styles making dark mode and accessibility overrides brittle; Tailwind's dark mode support is bypassed
- **Fix:** Centralize CSS variable usage into Tailwind theme extensions and use utility classes instead of inline styles throughout all components

### P1 — Empty catch blocks with silent failures across 10+ components degrade debugging and observability

- **File:** `apps/web/components/chat/chat-view.tsx:151`
- **Category:** error_handling
- **Impact:** Failures in critical paths (profile loading, socket setup, API calls) go undetected in production with no structured logging
- **Fix:** Replace silent catch blocks with structured logging via a logger service (Sentry scope capture or equivalent) and expose non-sensitive errors to users where appropriate

### P2 — Reaction fetch triggered on every message render without batching or caching for large channel loads

- **File:** `apps/web/components/chat/message-list.tsx:144`
- **Category:** performance
- **Impact:** High API call volume in channels with many messages causing unnecessary network churn and slow reaction display
- **Fix:** Batch reaction fetch calls into a single endpoint request, cache results in a persistent ref, and only fetch for newly visible messages using IntersectionObserver

### P2 — Optimistic update callback may rely on stale closure in rapid-send edge cases

- **File:** `apps/web/components/chat/chat-view.tsx:346`
- **Category:** state_management
- **Impact:** Potential race conditions under rapid message sending where confirmOptimistic or rollbackOptimistic may capture stale state
- **Fix:** Verify all optimistic callbacks use functional updaters (setItems(prev => ...)) rather than depending on closure-captured state values

### P2 — No virtualization for long message lists — all messages rendered as DOM nodes

- **File:** `apps/web/components/chat/message-list.tsx:386`
- **Category:** performance
- **Impact:** Severe performance degradation in channels with 1000+ messages, especially on low-power mobile devices with high memory usage
- **Fix:** Integrate @tanstack/react-virtual for windowed rendering of message items, keeping only visible + buffer items in DOM

### P2 — Duplicate click-outside and Escape handling patterns repeated across 6+ components

- **File:** `apps/web/components/chat/message-input.tsx:150`
- **Category:** component_architecture
- **Impact:** Maintenance burden and potential for inconsistent dismiss behavior across emoji picker, priority picker, schedule picker, status menu, team menu, and user picker
- **Fix:** Extract a shared useClickOutside and useEscape hook (or Popover/Dropdown wrapper component) to consolidate dismiss logic

### P2 — Hardcoded hex color values for status indicators instead of CSS custom properties

- **File:** `apps/web/components/workspace/app-sidebar.tsx:334`
- **Category:** design_system
- **Impact:** Theme color changes require updates in multiple files; inconsistency risk when status colors are updated
- **Fix:** Define status colors as CSS custom properties (--status-online, --status-away, --status-dnd) and reference them consistently

### P2 — Mobile sidebar open state resets on client-side navigation

- **File:** `apps/web/app/(workspace)/layout.tsx:21`
- **Category:** ux
- **Impact:** Users navigating between channels on mobile lose sidebar context and must re-open it
- **Fix:** Persist sidebar open state in URL param or context that survives client-side navigation

### P2 — Login form missing email format validation and inline error messaging for invalid inputs

- **File:** `apps/web/components/auth/login-form.tsx:130`
- **Category:** form_validation
- **Impact:** Users may submit invalid emails without clear feedback; HTML5 required attribute alone is insufficient for accessibility
- **Fix:** Add email format regex validation, provide inline validation messages with aria-describedby, and ensure form submission is disabled until valid

### P2 — RHS panel responsive rendering duplicated for ThreadPanel and ChannelInfo with same desktop/mobile pattern

- **File:** `apps/web/components/chat/chat-view.tsx:718`
- **Category:** component_architecture
- **Impact:** Significant code duplication across panels; risk of mobile vs desktop behavior divergence
- **Fix:** Create a shared RHS panel component handling responsive rendering (overlay vs sidebar) once, accepting panel content via children or slots

### P3 — Post-menu action buttons and floating timestamps have small touch targets on mobile

- **File:** `apps/web/components/chat/message-list/message-item.tsx:389`
- **Category:** accessibility
- **Impact:** Users on small touch screens may struggle to tap 14px icon buttons; violates WCAG 2.5.5 minimum 44px target size
- **Fix:** Add min-width/min-height of 44px to post-menu buttons on touch devices and increase padding

### P3 — No loading skeleton for DM channel list or member list while API fetches

- **File:** `apps/web/components/workspace/app-sidebar.tsx:986`
- **Category:** ux
- **Impact:** Flash of 'No direct messages yet' before list populates degrades perceived performance
- **Fix:** Add skeleton loading states while DM channels and member lists are being fetched via API

### P3 — TipTap editor content set via useEffect causes brief flash and cursor position loss on external content updates

- **File:** `apps/web/components/chat/tiptap-editor.tsx:76`
- **Category:** performance
- **Impact:** Minor edit flash when external state syncs content; cursor position may be lost
- **Fix:** Use editor.commands.setContent only when content differs meaningfully and avoid calling on mount when editor already has content

### P3 — Mobile RHS panel slide-in animation not disabled when prefers-reduced-motion is set

- **File:** `apps/web/components/chat/chat-view.tsx:746`
- **Category:** accessibility
- **Impact:** Users with vestibular disorders may experience discomfort from forced slide-in animations
- **Fix:** Add CSS that disables animations when [data-reduced-motion='true'] is present on the document element

### P3 — Sentry session replay enabled in development environment at 0.1 sample rate

- **File:** `apps/web/app/layout.tsx:40`
- **Category:** performance
- **Impact:** Unnecessary session replay recordings and bandwidth usage in local development
- **Fix:** Set replaysSessionSampleRate to 0.0 in non-production environments by checking NODE_ENV

### P3 — Vague console.warn messages lack error context, request IDs, and component names

- **File:** `apps/web/components/chat/message-input.tsx:211`
- **Category:** observability
- **Impact:** Reduced debuggability of production errors; no way to correlate warnings to specific operations
- **Fix:** Include error details and component name in console.warn calls, or route through structured logging service
