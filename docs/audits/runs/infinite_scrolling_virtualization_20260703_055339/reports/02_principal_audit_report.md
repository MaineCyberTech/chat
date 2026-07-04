# Principal Audit Report

- Prompt: **infinite_scrolling_virtualization**
- Domain: **features**
- Run ID: **infinite_scrolling_virtualization_20260703_055339**
- Generated: **2026-07-03T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **3**, P3: **0**
- Readiness: **60.00**

## Findings

### P2 — Fixed row height estimate of 64px causes scroll jank with variable-height messages (long content, reactions, thread reply links)

- **File:** `apps/web/components/chat/message-list.tsx:542`
- **Category:** virtualization_quality
- **Impact:** React Virtualizer recalculates item positions on each render pass, causing the scroll bar to jump and the user to lose visual context.
- **Fix:** Use virtualizer.measureElement with data-index attributes on each row for dynamic measurement.

### P2 — Unread count is calculated as Math.floor(messages.length \* visibleRatio) — approximate ratio instead of tracking actual unseen message boundaries

- **File:** `apps/web/components/chat/message-list.tsx:560`
- **Category:** unread_tracking
- **Impact:** Miscounts unread messages when messages have varying heights; cannot show precise new-message markers.
- **Fix:** Store ID of last visible message on scroll, compute unread count as messages.indexOf(lastSeenId); render visual 'new messages' divider.

### P2 — Prepending older messages during cursor pagination shifts visible content downward with no scroll anchoring compensation

- **File:** `apps/web/components/chat/chat-view.tsx:126`
- **Category:** scroll_anchoring
- **Impact:** When loadOlder appends messages to the beginning of the array, currently viewed messages are pushed down, causing visual jump.
- **Fix:** After prepending older items, adjust scrollTop by total height of newly inserted items.
