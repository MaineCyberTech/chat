# Phase 2 — User Journeys and Information Architecture

**Run**: 2026-07-09
**Auditor**: Principal UX / Frontend Architecture

---

## 1. Major User Journeys

### Current Repo

| Journey | Path | Key Pages | Task Completion |
|---|---|---|---|
| **Sign up / Log in** | `/` → `/login` → OAuth/magic link → callback → workspace | LandingShell → LoginForm → AuthProvider | 4 steps, smooth OAuth flow. Magic link requires email access. |
| **First workspace setup** | Login → create workspace → invite members → first channel | CreateWorkspaceDialog → InviteMembersModal → ChatView | Clear onboarding path with active-tour overlay |
| **Daily messaging** | Workspace → select channel → read → reply → react | AppSidebar → ChatView → MessageList → MessageInput → EmojiPicker | Core flow is 3-4 clicks. Autocomplete in mention/search speeds this. |
| **Multi-channel monitoring** | Sidebar scan → unread badges → switch channel | AppSidebar (unread dots + badges) → channel switch | Badges give quick signal. Category grouping helps organization. |
| **Search for old message** | Ctrl+K or click search → type query → filter → open result | QuickSwitcher → SearchBar → MessageList filter | Search has operator hints (`from:`, `in:`). Files/messages toggle. |
| **Threaded conversation** | Reply in thread → view thread panel → scroll replies | ThreadPanel → MessageList (filtered) | Thread panel opens as RHS. Reactions available on replies (UX-035). |
| **User profile lookup** | Click avatar → ProfilePopover → view info | ProfilePopover (name, email, join date) | Simple, single-click. Dismiss on Escape/outside-click. |
| **Admin user management** | Settings → Admin → user list → role edit → CSV import | Admin page (user roles dropdown + CSV import UI) | Two-column admin page. Role edits per user. |
| **Settings adjustment** | Sidebar → Settings → theme/notifications/auto-responder | Settings page → ThemeToggle → NotificationPreferences | Settings sidebar grouped by category. |
| **File sharing** | Drag file / paste image → upload → inline preview | MessageInput (paste/drop) → FilePreview | Inline media preview for images/video/audio. Fullscreen overlay. |
| **Onboarding** | Post-signup → 5-step tour → complete tasks | OnboardingTour popover → task list | 5-step guided tour with checkmarks. Progress synced to API (UX-033). |
| **PWA install** | Browser prompt → install → use as app | InstallPrompt → NotificationPrompt → PWAProvider | Dual install prompt + dedicated `/install` page. |

### Reference Repo (Mattermost)

| Journey | Path | Key Notes |
|---|---|---|
| **Sign up / Log in** | `/login` → email/password or OAuth or SAML/LDAP or MFA | More enterprise auth options. SAML/OIDC/LDAP/MFA. |
| **Team selection** | `/select_team` → join/create → `/preparing-workspace` | Explicit team selection screen before workspace. |
| **Daily messaging** | Team → channel → post → reply | Slash commands, autocomplete, formatting toolbar, GIF picker |
| **Search** | Ctrl+F or search icon → type → filter by channel/date/type → open | Full boolean search with operators, file type filters |
| **Admin console** | `/admin_console` → navigate tree → edit setting → save | Full hierarchical admin panel. User management, system settings, compliance, reporting. |
| **Plugin management** | System Console → Plugin Marketplace → install → configure | Full plugin lifecycle management UI |
| **Compliance export** | System Console → Compliance → export → download | Data export for audits, legal holds |

---

## 2. Information Architecture Comparison

### Current Repo IA

```
Root (/)
├── Login (/login)
├── Auth Callback (/auth/callback)
├── Verify Email (/auth/verify)
├── Install PWA (/install)
└── Workspace (/:workspaceSlug)
    ├── Chat Channel (/:workspaceSlug/:channelId) ← PRIMARY
    ├── Search (/:workspaceSlug/search)
    ├── Threads (/:workspaceSlug/threads)
    ├── Saved Messages (/:workspaceSlug/saved)
    ├── Scheduled Messages (/:workspaceSlug/scheduled)
    ├── User Groups (/:workspaceSlug/groups)
    ├── Admin Panel (/:workspaceSlug/admin)
    └── Settings (/:workspaceSlug/settings)
```

**Depth**: 2-3 levels. Workspace → feature → (optional detail). Flat IA once authenticated.
**Topology**: Hub-and-spoke with Workspace as hub. All features accessible from sidebar.

### Reference Repo IA

```
Root (/)
├── Login (/login)
├── Signup (/signup_user_complete)
├── MFA (/mfa)
├── Reset Password (/reset_password*)
├── Terms (/terms_of_service)
├── Select Team (/select_team)
├── Create Team (/create_team)
├── Admin Console (/admin_console)
│   ├── User Management
│   ├── System Settings
│   ├── Compliance
│   ├── Plugin Management
│   └── Reporting
├── Component Library (/component_library) — dev only
└── Team (/:team) ← PRIMARY
    ├── Channel (/:team/channels/:channelId)
    ├── Threads (/:team/threads/:threadId)
    ├── Search (/:team/search)
    ├── Integrations (/:team/integrations)
    ├── Custom Emoji (/:team/emoji)
    └── Settings (/:team/settings)
```

**Depth**: 3-4 levels. Root → Team → Channel → (sub-feature). Admin Console is a separate SPA-within-SPA.

### Key IA Differences

| Dimension | Current Repo | Reference Repo | Verdict |
|---|---|---|---|
| **Top-level navigation** | Workspace slug as single entry point | Team selector → workspace | Current is simpler (no team selection screen) |
| **Admin access** | Workspace-scoped admin page under /admin | Global /admin_console separate hierarchy | Both valid. Current is workspace-scoped. |
| **Feature grouping** | Flat under workspaceSlug | Flat under team + separate admin SPA | Similar organization |
| **Channel navigation** | Sidebar with categories + channel list | Sidebar with categories + channel list + filter | Nearly identical |
| **Saved/scheduled** | Dedicated routes | Drafts section | Current separates saved vs scheduled |
| **Threads** | Workspace-level threads route | Global + per-channel threads | Reference has both views |

---

## 3. Navigation Strengths

### Current Repo

| Strength | Detail |
|---|---|
| **Single-click channel access** | Sidebar channel list with immediate navigation. No extra clicks to reach any channel. |
| **Ctrl+K Quick Switcher** | Fast keyboard-first channel/people navigation. Full implementation with keyboard arrows + Enter. |
| **Unread badge visibility** | Unread dots and count badges on sidebar. Immediate visual cue for attention. |
| **Category grouping** | Sidebar categories (drag-reorderable) let users organize channels their way. |
| **Mobile bottom nav** | Fixed bottom bar with Back/Menu/Channels/Settings. Core actions always accessible. |
| **Workspace landing page** | Overview of channels when no channel is selected. Good starting point for new users. |
| **Minimal click depth** | Most features are 2 clicks from anywhere (sidebar → feature). No nested drill-downs. |

### Reference Repo

| Strength | Detail |
|---|---|
| **Multi-team switcher** | 65px left rail with team icons. Power users managing multiple orgs. |
| **Global header** | Top bar with search, settings, help. Consistent location for global actions. |
| **Channel filter** | Filter sidebar channels by unreads, recent, etc. Reduces cognitive load for large teams. |
| **Drag-and-drop reorder** | Channel categories + channels within categories. Full DnD with keyboard alternative. |
| **RHS control** | Right-hand side panel for channel info, thread, search results. Persistent while browsing channels. |

---

## 4. Navigation Friction Points

### Current Repo

| Friction Point | Severity | Description | Suggested Improvement |
|---|---|---|---|
| **No "Mark all read" in sidebar** | Medium | Users must read each channel individually to clear unread indicators. Notification bell dropdown has the button but not sidebar. | Add "Mark all read" to sidebar header context menu or channel filter bar |
| **No channel filter/search in sidebar** | Medium | For workspaces with 20+ channels, scrolling the full list is slow. Reference repo has filter-at-top pattern. | Add channel filter input at top of sidebar (filters in-place) |
| **Workspace switch requires page nav** | Low | No multi-team sidebar rail. Switching workspaces requires going back to landing page. | Refine TeamSidebar to persist across workspace routes |
| **Admin page lacks sub-navigation** | Low-Medium | Single admin page with all settings in one view. Reference repo has hierarchical admin with navigation. | Add tab/section navigation within admin page as feature set grows |
| **Settings page is flat** | Low | All settings on one page. No left-nav categories within settings. | Add section tabs: Profile, Notifications, Theme, Auto-Responder |
| **Search page replaces content** | Medium | Search is a full page, not an overlay/drawer. User context is lost. | Keep as page but add "back to channel" breadcrumb |
| **No channel breadcrumb** | Low | Once deep in search/threads/settings, no visual path back to current channel. | Consider breadcrumb or "Back to [channel]" link in feature pages |

### Reference Repo

| Friction Point | Notes |
|---|---|
| **Admin Console IA depth** | 3-4 levels deep. Settings buried in tree. Hard to discover for non-admins. |
| **Team selection screen** | Extra step before workspace. Friction for single-team users. |
| **RHS complexity** | Multiple panel types (info, thread, search) share same slot. Context switching. |

---

## 5. Workflow Efficiency Findings

### High Efficiency (Current Repo)

| Workflow | Clicks | Time Estimate | Notes |
|---|---|---|---|
| Send a message | 3 (channel → type → Enter) | <2s | As fast as it gets. |
| React to message | 3 (hover → click reaction → pick emoji) | <3s | Emoji picker opens near cursor. |
| Switch channel | 2 (Ctrl+K → type → Enter) | <2s | Keyboard-first. Fastest possible. |
| Open thread | 1 (click reply count) | <1s | Thread panel opens inline. |
| Search history | 2 (Ctrl+K or Search → type) | <3s | Operator hints speed refinement. |
| Change settings | 2 (sidebar → settings) | <1s | Direct link in sidebar. |
| View user profile | 1 (click avatar) | <1s | Popover with no navigation. |

### Lower Efficiency (Current Repo)

| Workflow | Clicks | Issue |
|---|---|---|
| Mark all read | 4+ (sidebar → settings → bells → mark all read) | Button exists in notification dropdown but not easily discoverable |
| Jump to saved messages | 2 | OK, but no shortcut for this |
| Admin: edit user role | 3-4 | Navigate to admin → scroll user list → find user → change role dropdown |
| Browse channel members | 2 (channel info → members tab) | Channel info opens as RHS. Acceptable. |

### Reference Repo Edge Cases

- **Multi-team management**: Reference repo handles multi-team workflows better with the team sidebar rail
- **Admin workflows**: Reference repo's admin console is more feature-complete but harder to navigate
- **Plugin discovery**: Reference repo has a marketplace; current repo has no plugin ecosystem

---

## 6. Similarity Opportunities

| Opportunity | Current State | Target State | Risk |
|---|---|---|---|
| **Channel filter in sidebar** | Not present | Add filter input at top of sidebar (list narrows as user types) | Low. No regression. Additive feature. |
| **Settings sub-navigation** | Flat page | Section tabs or left-nav for settings categories | Low. Visual restructure only. |
| **Search persistence** | Full-page replace | Keep search context with "back to channel" link | Low. Adds breadcrumb. |
| **Sidebar "Mark all read"** | Only in notification bell | Add to sidebar header or filter bar | Low. Single button. |
| **Multi-team rail** | Desktop-only, not persistent | Consider adding mobile version or workspace dropdown | Medium. Layout change. |
| **Channel list filtering** | Only unread filter | Add "recent" and alphabetical sort options | Low. Filter toggle. |

---

## 7. Areas That Should Not Be Reorganized Without Strong Justification

| Area | Why Keep |
|---|---|
| **Single-click sidebar channel navigation** | Any change that adds clicks to channel switching will degrade UX. Keep flat, fast access. |
| **Workspace-scoped admin** | Admin tied to workspace matches the multi-tenant architecture. Global admin would require RBAC reconsideration. |
| **Feature pages as top-level routes** | Search, Threads, Saved, Scheduled as direct sidebar links. No nested discovery needed. |
| **Mobile bottom navigation** | Fixed bottom bar with 4 core items is the current standard pattern (similar to Slack, Discord, Teams). |
| **Ctrl+K Quick Switcher** | This is the power-user shortcut. Don't change its behavior or keybinding. |
| **Login flow (magic link + OAuth)** | Simple, secure, no password management. Adding MFA would add complexity but is a feature gap, not a reorganization need. |
| **Channel as primary content view** | Channel-centric workspace is the established mental model for team chat. Don't introduce alternate views that compete. |
| **Flat workspace structure** | No team selection screen means users land in their workspace immediately. This is a UX advantage over Mattermost. |
