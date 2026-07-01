# Frontend Release Gate Report

- Prompt: **frontend_performance_bundle_audit**
- Domain: **frontend**
- Run ID: **frontend_performance_bundle_audit_20260701_071113**
- Generated: **2026-07-01T07:11:05Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **4**
- P2: **3**, P3: **1**
- Readiness: **34.00**

## Findings

### P1 — All pages use 'use client' directive — zero server components — full JS bundle downloaded on every route

- **File:** `apps/web/app/`
- **Category:** bundle_optimization
- **Impact:** No React Server Component benefits: no streaming SSR, larger initial JS payload, slower time-to-interactive
- **Fix:** Convert non-interactive sections (landing page, workspace list) to server components; use 'use client' only where interactivity requires it

### P1 — No route-level code splitting — all components eagerly imported via static imports

- **File:** `apps/web/next.config.ts`
- **Category:** bundle_optimization
- **Impact:** Large components (ChatView, ThreadPanel, SettingsPage) bundled into main chunk — slower initial load
- **Fix:** Use next/dynamic for lazy-loading heavy components: ChatView, ThreadPanel, SettingsPage

### P1 — No virtual list for long transcripts — all messages rendered as flat DOM nodes

- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** transcript_rendering
- **Impact:** Channels with thousands of messages cause full DOM rendering; unbounded memory growth; long session performance degrades
- **Fix:** Implement virtual scrolling with react-window or @tanstack/react-virtual for message list

### P1 — Reaction data fetched for ALL visible messages on every messages change — N+1 query pattern

- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** transcript_rendering
- **Impact:** Each message render triggers a batch reaction fetch; with 50 visible messages per page, significant overhead
- **Fix:** Cache reaction data by message ID; only re-fetch when new messages appear in viewport

### P2 — Avatar image uses <img> instead of Next.js <Image> — no lazy loading or responsive images

- **File:** `apps/web/components/settings/avatar-upload.tsx`
- **Category:** image_font_loading
- **Impact:** Avatar images block initial load; no automatic srcset generation for responsive sizes
- **Fix:** Replace <img> with Next.js <Image> component with lazy loading

### P2 — Socket.io client imported eagerly even on pages that don't need real-time (workspace overview, settings)

- **File:** `apps/web/next.config.ts`
- **Category:** bundle_optimization
- **Impact:** ~50KB socket.io client JS loaded on every page regardless of whether real-time features are used
- **Fix:** Dynamic import socket.io client only on pages that require real-time features

### P2 — All messages stored in single flat array — no pagination, windowing, or pruning of old messages

- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** hydration_cost
- **Impact:** Long chat sessions accumulate unbounded memory; page grows slower over time
- **Fix:** Limit in-memory message store to last N messages (e.g., 500); implement cursor-based load on scroll

### P3 — transpilePackages: ['@chat/ui'] increases build time

- **File:** `apps/web/next.config.ts`
- **Category:** bundle_optimization
- **Impact:** Every pnpm build transpiles the shared UI package — necessary but can be optimized
- **Fix:** Consider building @chat/ui as pre-compiled package to reduce transpilation overhead
