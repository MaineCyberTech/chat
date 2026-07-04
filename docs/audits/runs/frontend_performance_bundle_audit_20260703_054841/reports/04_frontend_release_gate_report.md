# Frontend Release Gate Report

- Prompt: **frontend_performance_bundle_audit**
- Domain: **frontend**
- Run ID: **frontend_performance_bundle_audit_20260703_054841**
- Generated: **2026-07-03T01:44:57Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **2**, P3: **1**
- Readiness: **71.00**

## Findings

### P1 — react-markdown + remark-gfm bundled into the critical chat input chunk (~50KB gzipped) for a preview feature
- **File:** `apps/web/components/chat/message-input.tsx`
- **Category:** bundle_size
- **Impact:** Users who never open markdown preview still download the markdown parser. On mobile connections this adds significant latency.
- **Fix:** Lazy-load the MarkdownPreview component via next/dynamic with ssr:false, only importing react-markdown when the preview toggle is activated.

### P1 — Channel page is a client component with no route-level code splitting for sub-features (thread panel, media room, search)
- **File:** `apps/web/app/(workspace)/[workspaceSlug]/[channelId]/page.tsx`
- **Category:** route_chunking
- **Impact:** All sub-feature bundles are loaded upfront even when never used (e.g. MediaRoom LiveKit imports on channels without calls).
- **Fix:** Wrap ThreadPanel, MediaRoom, and SearchBar in next/dynamic() lazy imports with appropriate loading states.

### P2 — NotificationBell fetches /notifications/unread every 30 seconds via setInterval even when the menu is closed
- **File:** `apps/web/components/notifications/notification-bell.tsx`
- **Category:** mobile_performance
- **Impact:** Persistent polling on mobile drains battery and consumes data. Multiple open tabs each poll independently.
- **Fix:** Clear the interval when document.hidden or when the window loses focus; re-establish when visible again.

### P2 — ThreadPanel fires an API call to fetch thread metadata on every mount but also on every replies.length change
- **File:** `apps/web/components/chat/thread-panel.tsx`
- **Category:** hydration
- **Impact:** Each thread open and each new reply triggers a redundant API call even when data was available in parent props.
- **Fix:** Derive participant info from existing allMessages/reactions data when possible; only fetch thread metadata once per session.

### P3 — Sentry.init() is called at module level in layout.tsx, not guarded by env check
- **File:** `apps/web/app/layout.tsx`
- **Category:** route_chunking
- **Impact:** Sentry JS bundle is always downloaded and initialized on every page load regardless of environment, adding ~30KB to initial bundle.
- **Fix:** Guard Sentry import/init behind a dynamic import that only loads when NEXT_PUBLIC_SENTRY_DSN is set.
