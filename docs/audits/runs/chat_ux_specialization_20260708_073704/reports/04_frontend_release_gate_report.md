# Frontend Release Gate Report

- Prompt: **chat_ux_specialization**
- Domain: **uxui**
- Run ID: **chat_ux_specialization_20260708_073704**
- Generated: **2026-07-08T00:00:00Z**
- Decision: **GO**
- P0: **0**, P1: **0**
- P2: **5**, P3: **2**
- Readiness: **78.50**

## Findings

### P2 — In-channel message filter does not highlight matching text or scroll to first result
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** Chat UX — Message Search
- **Impact:** Users must visually scan the filtered message list to find where the search term appears. No visual indication of why each message matched. In channels with hundreds of messages, this makes the filter nearly useless for finding specific content.
- **Fix:** Add <mark> element highlighting around matching substrings in MessageItem when a filterQuery is present. Scroll the message list to the first match on filter change. Show match count indicator.

### P2 — No undo capability after message deletion confirmation
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** Chat UX — Message Deletion
- **Impact:** Accidental message deletion is permanent. Unlike Slack, Discord, and other chat apps that offer a 5-second 'Undo' toast, this app offers no recovery path. A mistaken delete requires admin database intervention.
- **Fix:** Implement soft-delete with ephemeral undo window. After delete API succeeds, show toast 'Message deleted. Undo' for 5 seconds. Call a restore API endpoint if undo is clicked. Add a deleted_at grace period in the message model.

### P3 — Channel bookmarks show blank area when no bookmarks exist
- **File:** `apps/web/components/chat/channel-bookmarks.tsx`
- **Category:** Chat UX — Bookmarks
- **Impact:** Users who click the bookmark icon see an empty panel with no guidance. They may think the feature is broken or not know how to create bookmarks. Reduces discoverability of the pin-to-bookmark flow.
- **Fix:** Add empty state message: 'No bookmarks yet. Pin a message to add it as a bookmark.' Include a brief illustration and link to instructions.

### P2 — Pinned messages in the message list lack any visual indicator
- **File:** `apps/web/components/chat/message-list.tsx`
- **Category:** Chat UX — Pinned Messages
- **Impact:** Users cannot tell which messages are pinned without checking the channel info sidebar. The is_pinned flag exists in the data model and API but is not rendered in the UI. Reduces the value of the pinning feature.
- **Fix:** Add a pin icon (📌 or Pin icon from lucide-react) to the message metadata area when is_pinned is true. Style the message background with a subtle highlight. Add filter option to show only pinned messages.

### P3 — No way to navigate from thread panel to the parent message in the main list
- **File:** `apps/web/components/chat/thread-panel.tsx`
- **Category:** Chat UX — Thread Navigation
- **Impact:** Users viewing a thread cannot easily locate the parent message in the main channel view. The parent message is displayed inline in the thread panel but scrolling in the main list to find related context is cumbersome.
- **Fix:** Add a 'Jump to message' link/button in the thread header. When clicked, close the thread panel, scroll the main list to the parent message, and briefly highlight it with a yellow flash animation.

### P2 — Scheduling confirmation toast does not include the scheduled time
- **File:** `apps/web/components/chat/message-input.tsx`
- **Category:** Chat UX — Scheduling
- **Impact:** After scheduling a message, users see 'Message scheduled' but not when it will be sent. They must reopen the schedule picker to verify the datetime. Creates uncertainty about whether the correct time was saved.
- **Fix:** Update success toast to include formatted datetime: 'Message scheduled for Apr 12, 3:30 PM'. Include timezone indicator. Add the scheduled time to the toast's description field.

### P2 — Onboarding tour steps are not independently resolvable leading to stale state
- **File:** `apps/web/components/workspace/onboarding-tour.tsx`
- **Category:** Chat UX — Onboarding
- **Impact:** If a user creates a channel before the tour reaches step 2, the tour shows a 'Create Channel' step that is already done. Users must complete it again or dismiss the tour. This causes frustration for proactive users and reduces tour credibility.
- **Fix:** Make each onboarding step independently checkable. Query channel/workspace state to auto-advance steps that the user has already completed. Allow manual skip on any step without breaking future steps.
