# Principal Audit Report

- Prompt: **frontend_audit_deep_dive**
- Domain: **frontend**
- Run ID: **frontend_audit_deep_dive_20260708_073657**
- Generated: **2026-07-08T00:00:00Z**
- Decision: **GO**
- P0: **0**, P1: **0**
- P2: **8**, P3: **3**
- Readiness: **73.50**

## Findings

### P2 — Sticky bottom navigation overlaps content on mobile beyond post-create container
- **File:** `apps/web/app/globals.css`
- **Category:** F2 — Layout & Navigation
- **Impact:** Settings, admin, and channel info panels lack bottom padding compensation for fixed bottom nav, causing content to be hidden behind nav bar on mobile.
- **Fix:** Apply uniform bottom padding to all main content areas (.app__content) using var(--bottom-nav-height) + safe-area. Replace page-specific overrides with a global content wrapper class.

### P2 — Message list renders all messages as DOM nodes with no virtualization
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** F3 — Chat UX
- **Impact:** Channels with 500+ messages render 500+ DOM nodes plus reactions, context menus, and modals. Performance degrades significantly on low-power mobile devices and long chat sessions.
- **Fix:** Add @tanstack/react-virtual to render only visible messages (~30-50 DOM nodes). Preserve scroll position on message prepend for infinite scroll. Implement estimated row heights for variable content.

### P2 — Optimistic echo deduplication leaves ghost messages after reconnection before server confirmation
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** F4 — State Management & Data Flow
- **Impact:** If a socket reconnects before the API confirms a message, the optimistic temp message persists permanently as a ghost until page reload. Users see duplicate or phantom messages.
- **Fix:** Track pending message IDs in a Set ref. On initial channel load, reconcile against confirmed IDs. Remove temp IDs that match confirmed server IDs from the pending set. Clear stale temps on reconnect.

### P2 — 8 icon-only buttons lack descriptive accessible names
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** F5 — Accessibility
- **Impact:** Screen reader users cannot distinguish buttons like 'Export', 'Channel menu', 'Priority picker', 'Schedule message', 'Collapse sidebar', 'Add category', 'New DM', and 'Add channel'. These are critical navigation and action elements.
- **Fix:** Audit all icon-only buttons for aria-label correctness. Use context-specific labels: 'Export channel' instead of 'Export', 'Set message priority' instead of 'Set priority'. Add aria-describedby for toolbar groupings.

### P2 — Overlay modals do not auto-focus first interactive element on open
- **File:** `apps/web/components/chat/message-input.tsx`
- **Category:** F5 — Accessibility
- **Impact:** The @everyone warning, priority warning, and schedule picker modals trap keyboard focus but do not programmatically move focus to the first button. Keyboard and screen reader users must tab blind to locate the dialog content.
- **Fix:** Add useEffect on modal mount that calls .focus() on the first focusable button (Cancel/Send). Ensure focus is restored to the triggering element when the modal closes.

### P1 — Ctrl+K shortcut conflicts with browser default and TipTap link insertion
- **File:** `apps/web/app/(workspace)/layout.tsx`
- **Category:** F5 — Accessibility
- **Impact:** Pressing Ctrl+K in the message editor triggers QuickSwitcher AND may insert a TipTap link simultaneously. The browser may also open its own search. This creates confusing and inconsistent behavior for power users relying on keyboard shortcuts.
- **Fix:** Suppress global Ctrl+K handler when the active element is an input/textarea/editor. Use Ctrl+Shift+K for QuickSwitcher when inside the editor. Keep Ctrl+K for TipTap link insertion as users expect.

### P2 — Sidebar auto-collapse state at tablet widths is not persisted across page loads
- **File:** `apps/web/components/workspace/app-sidebar.tsx`
- **Category:** F6 — Responsive Design
- **Impact:** Users who manually expand the sidebar at tablet width lose their preference on every page navigation. The auto-collapse logic resets, forcing a manual re-expand each time.
- **Fix:** Save the userToggledRef state to localStorage. On mount, check localStorage before applying auto-collapse. Respect user's explicit choice until they toggle again or clear storage.

### P3 — 3357 emoji entries are statically imported adding ~150KB to client bundle
- **File:** `apps/web/components/chat/emoji-picker.tsx`
- **Category:** F7 — Performance
- **Impact:** The emoji-data.ts is always bundled with the chat chunk regardless of whether the emoji picker is opened. Increases initial JS payload and parse time for all users.
- **Fix:** Lazy-load emoji-data.ts via dynamic import when EmojiPicker first mounts. Use React.lazy or next/dynamic for the picker component itself. Cache the loaded data in a module-level variable.

### P3 — Category drag-and-drop reorder uses HTML5 DnD API with no touch support
- **File:** `apps/web/components/workspace/app-sidebar.tsx`
- **Category:** F8 — Interaction Quality
- **Impact:** Mobile and tablet users cannot reorder sidebar categories because native HTML5 drag-and-drop does not work on touch devices. This feature is desktop-only despite the app being responsive.
- **Fix:** Add touch event handlers (touchstart/touchmove/touchend) that mirror the drag logic. Alternatively, use a pointer-events-based approach or a lightweight library like @dnd-kit/core.

### P3 — Inline styles use hardcoded color values instead of CSS custom properties
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** F9 — Visual Consistency
- **Impact:** Hardcoded colors (#fff, rgba(0,0,0,0.4)) in ConnectionBanner, overlay, and button elements break dark mode consistency and make theme customization harder. Minor visual drift between themed and un-themed elements.
- **Fix:** Replace hardcoded colors with CSS variables: use var(--banner-bg) for connection banner, var(--overlay-bg) for modals. Add fallback values for backwards compatibility.

### P2 — ChatView component exceeds 890 lines with 8+ mixed responsibilities
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** F10 — Component Architecture
- **Impact:** Single component handles socket lifecycle, optimistic updates, file uploads, typing, presence, notifications, media room, replies, threads, and channel info. Hard to test, maintain, or reason about. Changes risk breaking unrelated features.
- **Fix:** Extract: useChannelSocket (socket join/leave/events), useChannelNotifications (sound + desktop + prefs), useTypingIndicator (emit + display). ChatView should only compose these hooks with JSX.
