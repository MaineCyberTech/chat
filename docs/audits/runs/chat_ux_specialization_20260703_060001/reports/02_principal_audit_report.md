# Principal Audit Report

- Prompt: **chat_ux_specialization**
- Domain: **uxui**
- Run ID: **chat_ux_specialization_20260703_060001**
- Generated: **2026-07-03T06:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **2**
- P2: **4**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — Chat UI dark mode broken - .dark class applied by ThemeProvider but CSS only matches @media (prefers-color-scheme: dark)
- **File:** `packages/ui/src/styles.css`
- **Category:** Theme
- **Impact:** Chat background, message bubbles, input field, and sidebar all use wrong color scheme when user manually toggles theme. Chat becomes unreadable in some theme/OS combinations.
- **Fix:** Add .dark selector support to CSS variables for all chat-related components

### P1 — Thread replies lack edit, delete, and reaction support - read-only after sending
- **File:** `apps/web/components/chat/thread-panel.tsx`
- **Category:** Threads
- **Impact:** Phase B (thread UX) incomplete. Users cannot correct mistakes in thread replies, cannot remove unwanted replies, and cannot react to replies. Major UX gap vs Discord/Slack.
- **Fix:** Add edit action (PUT /messages/:id), delete action (DELETE /messages/:id with confirmation), and reaction support to thread panel

### P1 — No per-user online/offline presence indicators anywhere in the UI
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** Presence
- **Impact:** Phase D (presence) incomplete. Users cannot determine if other users are online. Only an aggregate 'N online' count is shown.
- **Fix:** Add per-user green/gray dot indicator next to user names in message list, thread panel, and member surfaces

### P2 — Typing indicator shows only count ('2 people are typing...') never shows individual names
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** Typing Indicator
- **Impact:** Users cannot tell who is typing. When only one person is typing, showing 'Someone is typing...' instead of their name reduces chat awareness.
- **Fix:** Show names for 1-2 typists, fall back to count only for 3+ (e.g. 'Alice is typing...' / 'Alice and Bob are typing...')

### P2 — No slash commands support (/giphy, /poll, /me, /shrug, etc.)
- **File:** `apps/web/components/chat/message-input.tsx`
- **Category:** Composer
- **Impact:** Phase C (composer) incomplete. Users expect slash commands as a power-user feature for quick actions. Competitors like Slack and Discord rely heavily on slash commands.
- **Fix:** Add slash command parser with command menu popover. Start with /me for action messages and /poll for quick polls.

### P2 — Reaction picker limited to 6 emojis - no full emoji palette available
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** Reactions
- **Impact:** Users can only react with 6 preset emojis. Cannot express nuanced reactions. Competitors offer full emoji pickers.
- **Fix:** Add full emoji picker (e.g. emoji-mart or data-minecraft) to the reaction button in addition to the 6 quick emojis

### P2 — No reaction tooltip/popover showing who reacted with which emoji
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** Reactions
- **Impact:** Users see reaction counts but cannot see who reacted. Reduces social awareness and makes it hard to know who agreed/disagreed.
- **Fix:** Add hover/click tooltip on reaction pills showing user avatars/names who reacted

### P3 — No pinned or bookmarked message support
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** Messages
- **Impact:** Phase A (message stream) lacks common feature for important message retention. Users cannot pin messages for channel reference.
- **Fix:** Implement message pinning with a pinned messages bar in the channel header
