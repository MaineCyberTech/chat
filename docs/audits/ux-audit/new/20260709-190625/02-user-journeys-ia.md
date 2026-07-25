# UI/UX Phase 2 — User Journeys and Information Architecture

**Run**: 2026-07-09 19:06 UTC

---

## 1. Major User Journeys

| Journey              | Chat Path                                                     | Verdict                 |
| -------------------- | ------------------------------------------------------------- | ----------------------- |
| Login                | `/login` → magic link or OAuth → workspace redirect           | ✓ Clean                 |
| View channel         | Select from sidebar → message list loads                      | ✓ Standard              |
| Send message         | TipTap editor → Enter → optimistic update                     | ✓ Instant feedback      |
| Reply in thread      | Click reply → RHS panel → type → send                         | ✓ With typing indicator |
| Search               | `/search` full page with operator hints + type toggle         | ✓ Dedicated space       |
| Manage notifications | Settings page + per-channel modal                             | ✓ In-page               |
| Admin                | `/admin` single page with tabs                                | ✓ Simplified            |
| Manage groups        | `/groups` single page                                         | ✓ Straightforward       |
| Edit channel topic   | Click topic in header → inline input → Enter to save          | ✓ Added Phase 4         |
| Upload file via drag | Drag file over message area → drop zone overlay → auto-upload | ✓ Added Phase 4         |
| Undo message delete  | Toast with Undo button → 5s window                            | ✓ Added Phase 4         |

### Keyboard Shortcuts

| Shortcut               | Action                                      |
| ---------------------- | ------------------------------------------- |
| Ctrl+K                 | Quick switcher (channels + users)           |
| Ctrl+/                 | Keyboard shortcuts modal                    |
| Arrow keys             | Context menu navigation, sidebar navigation |
| Tab / Shift+Tab        | Focus trap cycling in all modals            |
| Enter (in topic input) | Save channel topic                          |
| Escape                 | Close all modals, cancel topic editing      |

---

## 2. Information Architecture Comparison

### Navigation Depth

| Page/Action        | Chat (clicks from channel)  | Mattermost                      |
| ------------------ | --------------------------- | ------------------------------- |
| Settings           | 2 (sidebar → settings)      | 2 (profile → settings)          |
| Admin              | 2 (sidebar → admin)         | 3 (profile → admin console)     |
| Search             | 1 (search button in header) | 1 (search box in global header) |
| Saved messages     | 2 (sidebar → saved)         | Via flag icon                   |
| Scheduled          | 2 (sidebar → scheduled)     | Via drafts drawer               |
| Create channel     | 1 (+ button in sidebar)     | 1 (+ button in sidebar)         |
| Start DM           | 2 (New DM → pick user)      | 2 (+ → pick user)               |
| Edit channel topic | 1 (click topic → edit)      | Via channel header modal        |

### Chat Advantage

- Flat page hierarchy — all features accessible from sidebar
- Search has dedicated full page
- Settings and admin are in-page tabs, not modals
- Channel topic editing is inline, not modal

---

## 3. Navigation Strengths

- Resizable sidebar with drag handle + arrow key resize
- Auto-collapse on tablet (768-1024px, 60px mini-rail with smooth transition)
- Context menu on channels (right-click for quick actions)
- Channel header dropdown (Copy link, Mute/Unmute)
- Quick switcher (Ctrl+K) with focus trap
- Bottom nav on mobile (4 essential tabs with safe area)
- Team sidebar rail (65px) for multi-workspace

---

## 4. Navigation Friction Points

- No global header with persistent search access (search is per-workspace in header)
- No product switcher — workspaces managed via TeamSidebar only
- Message-input.tsx is very dense — formatting toolbar, emoji button, slash commands, send scheduling, priority picker, AI rewrite all compete for space

---

## 5. Workflow Efficiency Findings

| Workflow          | Chat                                                                                              | Verdict          |
| ----------------- | ------------------------------------------------------------------------------------------------- | ---------------- |
| Sending message   | TipTap rich text + formatting toolbar + slash commands + AI rewrite + scheduling + priority       | Feature-rich     |
| Searching         | Full page with type toggle, operator hints, file extension suggestions, user/channel autocomplete | Comprehensive    |
| Managing threads  | RHS panel with reactions, typing indicator, display names                                         | Feature-complete |
| Channel switching | Quick switcher (Ctrl+K) + sidebar + keyboard arrows                                               | Efficient        |
| File upload       | Paperclip button, paste clipboard, drag-and-drop overlay                                          | 3 methods        |
| Topic editing     | Inline input, Enter saves, Escape cancels                                                         | Fast             |

---

## 6. Similarity Opportunities

- Channel header dot menu could expand with more actions (MM has rich dot menu)
- Thread participant list could show read status (MM shows who has viewed)
- Post-delete undo toast now matches MM's ephemeral undo pattern

---

## 7. Areas That Should Not Be Reorganized

- 3-panel layout (sidebar + content + RHS) — industry standard
- Route structure `[workspaceSlug]/[channelId]` — matches MM's pattern
- Bottom nav on mobile — essential for thumb reach
- Auth flow (magic link + OAuth) — working and secure
- Optimistic message sending — critical UX
- Modal-based dialogs for delete, notifications — standard pattern
