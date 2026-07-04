# Frontend Release Gate Report

- Prompt: **frontend_ux_release_gate**
- Domain: **uxui**
- Run ID: **frontend_ux_release_gate_20260703_060001**
- Generated: **2026-07-03T06:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **3**
- P2: **6**, P3: **4**
- Readiness: **76.70**

## Findings

### P0 — Manual theme toggle broken - CSS only matches @media (prefers-color-scheme: dark), no .dark class selector
- **File:** `packages/ui/src/styles.css`
- **Category:** F1 Design System Integrity
- **Impact:** F1 integrity violation. ThemeProvider applies .dark class but CSS never matches it. All manual light/dark selections have no effect.
- **Fix:** Add .dark selector alongside the media query or restructure to class-based theming

### P1 — --color-accent-reference, accent-primary CSS variable referenced but never defined in any @theme block
- **File:** `apps/web/app/auth/callback/page.tsx`
- **Category:** F1 Design System Integrity
- **Impact:** Undefined CSS variable falls through to browser default. Callback page may render with incorrect colors.
- **Fix:** Define --color-accent-primary in styles.css or replace with --color-brand-primary

### P1 — No member list or member management page exists
- **File:** `apps/web/app/(workspace)/`
- **Category:** F2 Layout and Navigation
- **Impact:** F2 gap. Users cannot navigate to view or manage workspace members. Missing primary navigation target.
- **Fix:** Add /members route with member list, role display, and invite UI

### P1 — Thread replies cannot be edited, deleted, or reacted to
- **File:** `apps/web/components/chat/thread-panel.tsx`
- **Category:** F3 Chat UX
- **Impact:** F3 gap. Thread replies are read-only after sending. Users cannot correct mistakes or express reactions in threads.
- **Fix:** Add edit/delete actions and reaction support to thread panel

### P2 — Duplicate --font-sans and --font-mono declarations in globals.css and styles.css
- **File:** `apps/web/app/globals.css`
- **Category:** F1 Design System Integrity
- **Impact:** Minor F1 violation. Unnecessary duplication may lead to drift.
- **Fix:** Remove duplicate font declarations from globals.css

### P2 — No route-group-specific 404 page - invalid channels show inline 'Channel not found' text
- **File:** `apps/web/app/(workspace)/[workspaceSlug]/[channelId]/page.tsx`
- **Category:** F2 Layout and Navigation
- **Impact:** F2 gap. No proper 404 UX with navigation options for invalid workspace/channel routes.
- **Fix:** Add not-found.tsx to (workspace) route group

### P2 — No per-user presence indicators - only aggregate 'N online' count displayed
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** F3 Chat UX
- **Impact:** F3 gap. Users cannot see who is online. Reduced chat awareness.
- **Fix:** Add green dot indicators next to user names in message list

### P2 — No reaction tooltip showing who reacted to a message
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** F8 Interaction Quality
- **Impact:** F8 gap. Users see reaction counts but cannot know who reacted. Reduces social interaction quality.
- **Fix:** Add hover tooltip on reaction pills with user names/avatars

### P2 — Mixed icon library usage - dialog uses Unicode '✕', sidebar-group uses Unicode '▸', toast uses inline SVGs, rest of app uses lucide-react
- **File:** `packages/ui/src/components/dialog.tsx`
- **Category:** F9 Visual Consistency
- **Impact:** F9 violation. Three different icon approaches create visual inconsistency and different sizing behaviors.
- **Fix:** Migrate all icons to lucide-react components

### P2 — Thread replies area has no aria-live region for screen reader announcements
- **File:** `apps/web/components/chat/thread-panel.tsx`
- **Category:** F5 Accessibility
- **Impact:** F5 gap. Screen reader users are not notified when new replies appear in the thread panel.
- **Fix:** Add aria-live='polite' region to the thread reply list

### P2 — Ctrl+1-9 workspace switching listed in help dialog but not implemented
- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** F8 Interaction Quality
- **Impact:** F8 gap. Help dialog shows non-functional shortcuts, eroding user trust.
- **Fix:** Implement workspace switching shortcuts or remove from help dialog

### P3 — Keyboard shortcuts not discoverable - no UI hint or '?' icon anywhere
- **File:** `apps/web/app/(workspace)/layout.tsx`
- **Category:** F8 Interaction Quality
- **Impact:** F8 minor. Power users may never discover the shortcut system exists.
- **Fix:** Add a '?' button to app header or sidebar

### P3 — Root error.tsx has empty useEffect(() => {}, [error]) - error not logged or reported
- **File:** `apps/web/app/error.tsx`
- **Category:** F4 State Management
- **Impact:** F4 minor. Root error boundary swallows errors silently with no logging or Sentry reporting.
- **Fix:** Add console.error and Sentry.captureException to the useEffect

### P3 — Avatar uses <img> tag instead of Next.js Image component
- **File:** `packages/ui/src/components/avatar.tsx`
- **Category:** F7 Performance
- **Impact:** F7 minor. Avatar images are not optimized, lazy-loaded, or responsively sized by Next.js.
- **Fix:** Switch to Next.js Image component with priority for header avatars
