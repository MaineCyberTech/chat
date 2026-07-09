# UI/UX Phase 2 — User Journeys and Information Architecture

**Run**: 2026-07-09 04:15 UTC

---

## 1. Major User Journeys

### Primary Journeys (Both Repos)

| Journey | Chat Path | Mattermost Path | Verdict |
|---------|-----------|----------------|---------|
| **Login** | `/login` → magic link/OAuth → redirect to workspace | `/login` → email/password/OAuth → `/select_team` | Similar |
| **View channel** | Select channel from sidebar → message list loads | Select channel from sidebar → center view loads | Equivalent |
| **Send message** | Type in TipTap editor → Enter/Send → optimistic update | Type in AdvancedTextEditor → Enter/Send | Equivalent |
| **Reply in thread** | Click reply icon → RHS thread panel → type → send | Click reply icon → RHS → type → send | Equivalent |
| **Search** | `/search` with filters + operator hints | Search box in header → RHS results | Chat: full-page, MM: RHS |
| **Manage notifications** | Settings page + per-channel modal | User settings modal + channel notifications modal | Chat: in-page, MM: modal |
| **User admin** | `/admin` page (single page, tabs) | `/admin_console` (nested sidebar, 128+ pages) | MM much deeper |
| **Manage groups** | `/groups` page (single page) | Modal-based (create_user_groups_modal, etc.) | Different UX models |

### Secondary Journeys

| Journey | Chat | Mattermost |
|---------|------|-----------|
| **Keyboard navigation** | `Ctrl+K` quick switcher, arrow keys in sidebar, `Ctrl+/` shortcuts | `Ctrl+K` quick switcher, arrow keys, full shortcut modal |
| **File upload** | Paperclip button → file picker or paste clipboard | Paperclip button → file picker or drag-and-drop |
| **Emoji reaction** | Hover message → reaction button → emoji picker | Hover message → reaction button → emoji picker |
| **Message actions** | Context menu (right-click) + hover-reveal toolbar | Context menu + hover-reveal + long-press on mobile |
| **Channel management** | Create dialog, settings modal, bookmark panel | Full channel settings modal, header/purpose editing modals |

---

## 2. Information Architecture Comparison

### Navigation Depth

| Page/Action | Chat (clicks from channel) | Mattermost (clicks from channel) |
|------------|---------------------------|----------------------------------|
| Settings | 2 clicks (sidebar → settings) | 2 clicks (profile → settings) |
| Admin | 2 clicks (sidebar → admin) | 3 clicks (profile → admin console) |
| Search | 1 click (search icon) | 1 click (search box in header) |
| Saved messages | 2 clicks (sidebar → saved) | Via flag icon on messages |
| Scheduled messages | 2 clicks (sidebar → scheduled) | Via draft drawer |
| Create channel | 1 click (+ button in sidebar) | 1 click (+ button in sidebar) |
| Start DM | 2 clicks (New DM → pick user) | 2 clicks (+ → pick user via modal) |

### Information Architecture Strengths

**Chat:**
- Flat page hierarchy in workspace — all features accessible from sidebar
- Search has dedicated full-page view (more room than MM's RHS)
- Settings and admin are in-page tabs, not modals — better for complex forms
- Route structure mirrors the sidebar organization

**Mattermost:**
- Product switcher (Channels, Boards, Playbooks) at top
- Admin console is a full separate app with its own navigation
- Channel header menu provides contextual actions without leaving view
- Threads RHS keeps context while viewing replies

---

## 3. Navigation Strengths

### Chat
- **Resizable sidebar** with drag handle + arrow key resize — excellent UX
- **Auto-collapse on tablet** (768-1024px) — good responsive behavior
- **Context menu** on channels in sidebar (right-click for quick actions)
- **Quick switcher** with keyboard navigation (Ctrl+K)
- **Bottom nav** on mobile with 4 essential tabs
- **Team sidebar rail** (65px) for multi-workspace users

### Mattermost
- **Global header** with product switcher, search, settings, help — persistent across all views
- **Dot menu** in channel header for contextual actions
- **Category management** with drag-and-drop and keyboard alternatives
- **Channel filter** (unreads, favorites, etc.) in sidebar header
- **Unread indicator** with visual hierarchy (dot vs count vs urgent mention)

---

## 4. Navigation Friction Points

### Chat
- **No channel header action dropdown** — ChevronDown exists but menu is minimal (Copy link, Mute)
- **Settings and admin** are accessible from sidebar but not top-level global
- **Search** is per-workspace, not global across all workspaces
- **No product switcher** — user manages workspaces via TeamSidebar rail only
- **Mobile bottom nav** collapses essential navigation to 4 icons — reasonable but limited

### Mattermost
- **No resizable sidebar** — fixed width
- **RHS-thread search** competes for space with message list
- **Admin console** requires navigation away from the main app context
- **Settings modal** can be deep with many nested sections

---

## 5. Workflow Efficiency Findings

| Workflow | Chat Advantage | MM Advantage |
|----------|---------------|-------------|
| **Sending a message** | TipTap rich text + formatting toolbar + slash commands + AI rewrite + scheduling | AdvancedTextEditor with + menu, markdown preview mode |
| **Searching** | Dedicated full page with type toggle, operator hints, autocomplete | RHS search keeps channel context visible |
| **Managing threads** | RHS thread panel with reply preview + reactions + typing indicator | Virtualized thread viewer with participant list |
| **Channel switching** | Quick switcher (Ctrl+K) with channel + user search, arrow nav | Quick switcher with recent channels, arrow nav |
| **File preview** | Inline preview + fullscreen overlay with zoom, nav, metadata | File preview modal with zoom, nav, download |

---

## 6. Similarity Opportunities

Areas where aligning the UX patterns between the two would be beneficial:

- **Channel header menu**: MM has a rich dot menu (copy link, add members, leave, edit header, mute, notification prefs) — Chat has the ChevronDown now but could expand
- **Thread participant list**: MM shows who has viewed/replied — Chat shows only names
- **Category management**: Both have drag-and-drop; Chat added keyboard alternatives — MM has modal-based rename/edit

---

## 7. Areas That Should Not Be Reorganized Without Strong Justification

- **3-panel layout** (sidebar + content + RHS) — industry standard, users expect it
- **Route structure** with `[workspaceSlug]/[channelId]` — matches Mattermost's `/:team/channels/:id` pattern
- **Bottom nav on mobile** — essential for thumb-reachable navigation
- **Auth flow** (magic link + OAuth) — working and secure
- **Optimistic message sending** — critical for perceived performance
- **Modal-based dialogs** for delete, notifications — standard pattern
