# Frontend Release Gate Report

- Prompt: **feature_release_gate**
- Domain: **release**
- Run ID: **feature_release_gate_20260707_074854**
- Generated: **2026-07-07T12:00:00Z**
- Decision: **GO**
- P0: **0**, P1: **1**
- P2: **4**, P3: **3**
- Readiness: **66.00**

## Findings

### P1 — Full page reload on DM/channel navigation breaks PWA app-shell model and causes full React remount
- **File:** `apps/web/components/workspace/app-sidebar.tsx:190`
- **Category:** release_blocker
- **Impact:** PWA users experience hard reloads on every DM/channel creation; offline app-shell breaks and streaming data is lost
- **Fix:** Replace window.location.href navigations with Next.js router.push() and ensure page data is prefetched for instant transitions

### P2 — User-generated markdown content rendered via ReactMarkdown without href sanitization on link renderer
- **File:** `apps/web/components/chat/message-list/message-item.tsx:322`
- **Category:** security
- **Impact:** Potential XSS vector through crafted markdown links using javascript: or other dangerous URI schemes in the custom 'a' component override
- **Fix:** Add href sanitization to the link renderer validating against dangerous URI schemes, and consider DOMPurify as additional defense layer

### P2 — Socket connection listener cleanup may not execute if getSocket() promise is pending during unmount
- **File:** `apps/web/components/chat/chat-view.tsx:321`
- **Category:** stability
- **Impact:** Potential socket event listener leak on rapid channel switches causing duplicate message handlers or memory leaks
- **Fix:** Use cancellable promise pattern or ref to track cancellation state ensuring cleanup runs regardless of socket connection status

### P2 — Workspace layout returns null on missing user without error UI for workspace fetch failures
- **File:** `apps/web/app/(workspace)/layout.tsx:158`
- **Category:** error_handling
- **Impact:** Blank screen if workspace API fails after authentication succeeds; no retry mechanism or error messaging
- **Fix:** Add error state for workspace fetch failures with retry button, clear messaging, and fallback UI instead of returning null

### P2 — File upload handler lacks client-side file size, type, and extension validation
- **File:** `apps/web/components/chat/chat-view.tsx:401`
- **Category:** security
- **Impact:** Users may upload oversized files or disallowed file types (scripts, executables) wasting bandwidth and creating security risk
- **Fix:** Add client-side file validation: max file size check (50MB), allowed MIME type whitelist, and reject executable extensions before upload

### P3 — Socket.io client missing explicit heartbeat (ping/pong) configuration for unreliable networks
- **File:** `apps/web/lib/socket.ts:1`
- **Category:** stability
- **Impact:** Silent disconnections on unreliable mobile networks where client thinks it's connected but server timed out
- **Fix:** Configure Socket.io client with explicit pingTimeout (20000) and pingInterval (25000) for mobile-friendly reconnection

### P3 — Reduced motion handled via inline script instead of CSS media query in stylesheet
- **File:** `apps/web/app/layout.tsx:33`
- **Category:** performance
- **Impact:** Minor; inline script increases root layout size and runs on every page load unnecessarily
- **Fix:** Move reduced motion handling to CSS: @media (prefers-reduced-motion: reduce) setting animation-duration: 0.01ms !important

### P3 — Avatar images rendered with unoptimized img tag instead of Next/Image component
- **File:** `apps/web/components/chat/message-list/message-item.tsx:186`
- **Category:** performance
- **Impact:** Larger than necessary image bytes on the wire; no automatic lazy loading, responsive sizing, or format optimization
- **Fix:** Replace <img> with Next.js Image component with explicit width/height and remotePatterns in next.config.ts
