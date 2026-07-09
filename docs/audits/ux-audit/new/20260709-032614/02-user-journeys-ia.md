# UI/UX Phase 2 — User Journeys and Information Architecture

**Run**: 2026-07-09 03:26 UTC

---

## 1. Major User Journeys

### Current Repo — Documented Journeys

| Journey                | Path                                                    | Key Pages                                                 | Estimated Steps |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------- | --------------- |
| **Sign up / Sign in**  | Landing → Login → Magic link/OAuth → Verify → Workspace | `/`, `/login`, `/auth/verify`, `/[workspaceSlug]`         | 4-6             |
| **Create workspace**   | Login → Workspace list → Create dialog → Channel select | `/[workspaceSlug]`, create dialog                         | 3-4             |
| **Send message**       | Workspace → Channel → Message input → Send              | `/[workspaceSlug]/[channelId]`                            | 2-3             |
| **Thread reply**       | Channel → Thread panel → Reply input                    | inline in `[channelId]`                                   | 2-3             |
| **Search**             | Channel → Search bar → Query → Results → Select         | `/[workspaceSlug]/[channelId]`, `/[workspaceSlug]/search` | 3-5             |
| **Manage settings**    | Workspace → Settings                                    | `/[workspaceSlug]/settings`                               | 2               |
| **Admin panel**        | Workspace → Admin                                       | `/[workspaceSlug]/admin`                                  | 2               |
| **User groups**        | Workspace → Groups                                      | `/[workspaceSlug]/groups`                                 | 2               |
| **Saved messages**     | Workspace → Saved                                       | `/[workspaceSlug]/saved`                                  | 2               |
| **Scheduled messages** | Workspace → Scheduled                                   | `/[workspaceSlug]/scheduled`                              | 2               |
| **PWA install**        | Any page → Install prompt → Accept                      | PWA flow                                                  | 2               |
| **Media room**         | Channel → Media call button → LiveKit room              | inline in `[channelId]`                                   | 2               |

### Reference Repo — Equivalent Journeys

Mattermost's journeys are structurally similar but with more depth in settings (11 user settings subdirectories), admin console (128 subdirectories), and onboarding (tours + task lists). Mattermost has an additional "Preparing workspace" screen, "Global header" with announcement bar, and backstage area.

---

## 2. Information Architecture Comparison

### Current Repo IA

```
/                              → Landing page (marketing)
/login                         → Authentication
/auth/callback                 → OAuth callback
/auth/verify                   → Email verification
/[workspaceSlug]               → Workspace hub (channel list)
/[workspaceSlug]/[channelId]   → Channel view (messaging)
/[workspaceSlug]/search        → Search results
/[workspaceSlug]/settings      → User settings
/[workspaceSlug]/admin         → Admin panel
/[workspaceSlug]/groups        → User group management
/[workspaceSlug]/threads       → Thread list
/[workspaceSlug]/saved         → Saved/favorite messages
/[workspaceSlug]/scheduled     → Scheduled messages
/pl/[postId]                   → Permalink
/install                       → PWA install guide
```

### Reference Repo IA (Simplified)

```
/                             → Root redirect → Login or Select Team
/login                        → Login (with OAuth/MFA options)
/signup                       → Sign up
/reset_password               → Password reset
/team-select                  → Team selection
/[teamName]                   → Team channels
/[teamName]/channels/[id]     → Channel view
/[teamName]/pl/[postId]       → Permalink
/[teamName]/search            → Search (RHS or page)
/[teamName]/threads/[id]      → Thread popout
/[teamName]/integrations      → Integrations
/admin_console                → Full admin console
/settings                     → User settings (11 categories)
/plugins/[id]                 → Plugin routes
```

### Key IA Differences

| Aspect                | Current Repo                        | Reference Repo                          |
| --------------------- | ----------------------------------- | --------------------------------------- |
| **Workspace vs Team** | Workspace as top-level org          | Team as top-level org (Mattermost)      |
| **Depth**             | Flat: 2-level (workspace → channel) | Flat: 2-level (team → channel)          |
| **Admin**             | Single `/admin` page                | Full `/admin_console` with 128 sections |
| **Settings**          | Single `/settings` page             | 11 subdirectories in user_settings      |
| **Integrations**      | None visible in routes              | `/integrations` routes                  |
| **Plugin system**     | Not present                         | `/plugins/[id]` routes                  |
| **Breadcrumbs**       | None visible                        | None in standard Mattermost             |

---

## 3. Navigation Strengths

### Current Repo Strengths

- **Purposeful routing**: Clean route hierarchy with route groups for auth vs workspace
- **Consistent workspace prefix**: All authenticated pages under `/[workspaceSlug]`
- **Loading states**: 4 loading files, 4 error boundaries, 2 not-found pages — good coverage
- **Mobile-aware**: Bottom nav, hamburger sidebar, swipe-back gesture
- **Quick switcher** (Ctrl+K): Fast workspace/channel navigation without leaving keyboard
- **Sidebar resize**: Both mouse drag and keyboard (ArrowLeft/ArrowRight) — discovered from AGENTS.md

### Reference Repo Strengths

- **Global header**: Persistent announcement bar, global search, help, settings access
- **Team sidebar (65px rail)**: Quick team switching without leaving context
- **Channel header menu**: Dense action menu (copy link, invite, leave, etc.)
- **More DMs modal**: Dedicated flow for starting direct messages
- **Admin console navigation**: Categorized sidebar with search — massive surface area made navigable

---

## 4. Navigation Friction Points

| Friction Point                | Repo    | Details                                                                                 |
| ----------------------------- | ------- | --------------------------------------------------------------------------------------- |
| **No global search access**   | Current | Search is per-channel or via `/search` page — no persistent search bar in global header |
| **No announcement/alert bar** | Current | No space for system-wide announcements (maintenance, security notices)                  |
| **Settings discovery**        | Current | Settings link in bottom nav + sidebar, but no settings header icon                      |
| **Thread discovery**          | Current | Threads page is separate — no persistent thread list in RHS or header                   |
| **No breadcrumbs**            | Both    | Users navigating deep (e.g., threaded reply within search result) lose spatial context  |
| **Admin density**             | Current | Single `/admin` page may become crowded as features expand                              |
| **Workspace switching**       | Current | Workspace list accessible but requires navigation away from current context             |
| **Channel type visibility**   | Current | Public/private/DM/GM type icons in sidebar but no channel purpose preview at glance     |

---

## 5. Workflow Efficiency Findings

### Current Repo — Efficient Flows

| Flow                   | Efficiency  | Why                                                                                       |
| ---------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| **Send a message**     | High        | Click channel → type → Enter — 3 steps, no page load                                      |
| **Reply in thread**    | High        | Click reply → inline thread panel → type → Enter                                          |
| **Quick navigation**   | High        | Ctrl+K → type → Enter — fastest possible                                                  |
| **Search**             | Medium-High | Search bar in channel → type → results. Cross-workspace search requires workspace context |
| **Mute notifications** | Medium      | Click bell icon in channel header → done. Single click to toggle                          |
| **Channel info**       | Medium      | Click info icon → RHS panel. Good, but no hover-card preview                              |

### Potential Frictions

| Flow                               | Friction                                                   | Recommendation                                                   |
| ---------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| **Flag a message**                 | Needs 2 clicks (context menu → flag)                       | Could add one-click toggle beside reaction button                |
| **Start a DM**                     | Must navigate to sidebar → find user or use quick switcher | DM multi-select modal exists but discovery is weak               |
| **Manage categories**              | Multiple steps (context menu → rename/delete)              | Current keyboard reorder (Arrow keys) helps but not discoverable |
| **View pinned messages**           | Channel info panel → Pinned tab                            | Dedicated pin indicator in channel header would reduce friction  |
| **Saved messages cross-workspace** | `/saved` page is per-workspace                             | Could aggregate across workspaces                                |

---

## 6. Similarity Opportunities

| Pattern                     | Reference Repo                              | Current Repo Similarity                          |
| --------------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Quick switcher** (Ctrl+K) | `quick_switch_modal/`                       | Already implemented with keyboard nav            |
| **Profile popover**         | `profile_popover/`                          | Already implemented with focus management        |
| **Channel info RHS**        | `channel_info_rhs/`                         | Already implemented with Members/Pinned tabs     |
| **Emoji picker**            | `emoji_picker/` (11 categories, skin tones) | Already implemented with categories + skin tones |
| **Post actions**            | `actions_menu/`                             | Already implemented via context menu             |
| **Message reactions**       | Reaction picker on hover                    | Already implemented with tooltips                |
| **Thread panel**            | `rhs_thread/`                               | Already implemented with reply reactions         |

## 7. Areas That Should Not Be Reorganized Without Strong Justification

- **Route hierarchy** (`/[workspaceSlug]/[channelId]`) — mirrors Mattermost team/channel pattern, well-understood
- **Auth flow** — magic link + OAuth combination is clean and working
- **Three-panel layout** (sidebar + content + RHS) — standard chat app pattern, users expect this
- **Bottom nav on mobile** — once users learn it, changing location causes re-learning
- **Message input at bottom** — fixed to bottom is universal chat convention
- **Channel list in left sidebar** — reversing or moving this would break muscle memory
