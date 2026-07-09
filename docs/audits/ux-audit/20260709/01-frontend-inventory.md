# Phase 1 — Frontend Inventory and Structural Baseline

**Run**: 2026-07-09
**Auditor**: Principal UX / Frontend Architecture
**Reference Repo**: `C:\temp\mattermost-master` (Mattermost v11.9.0)
**Current Repo**: `C:\temp\chat`

---

## 1. Frontend Inventory — Reference Repo (Mattermost)

### App Shell

- **Stack**: React 18, react-router v5 (history-based), Redux (single store), Sass + styled-components
- **Entry**: `root.html` → `root.tsx` (webpack) → `entry.tsx` → `<App/>` → `<Root/>`
- **Providers chain**: Redux `<Provider>` → `<SharedPackageProvider>` → `<IntlProvider>` → `<WebSocketContext>` → `<ThemeProvider>`
- **Layout hierarchy**: `<Root>` routes between auth pages (header/footer template) and logged-in workspace (team controller + channel controller)
- **Theme**: Runtime CSS custom property injection via `applyTheme()` — Sass variables reference CSS vars

### Route Structure (react-router v5 — non-nested, flat)

| Path Group                                                      | Component                              | Notes                                          |
| --------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------- |
| `/login`, `/signup_user_complete`, `/reset_password*`, `/claim` | Auth routes via `HFRoute`              | Header/footer template, no sidebar             |
| `/admin_console`                                                | `AdminConsole`                         | Separate admin SPA within the SPA              |
| `/select_team`, `/create_team`                                  | Team selection                         | Logged-in, minimal chrome                      |
| `/:team/`                                                       | `TeamController` → `ChannelController` | Primary workspace — sidebar, channel view, RHS |
| `/:team/integrations`, `/:team/emoji`                           | `BackstageController`                  | Integration management                         |
| `/plug/:pluginRoute`                                            | `Pluggable`                            | Plugin route injection                         |
| `/_redirect/pl/:postid`                                         | Redirect → permalink                   | Legacy support                                 |
| `/component_library`                                            | Dev-only component docs                | In-house Storybook alternative                 |

### Component Architecture (~358 component directories/files)

- **Global components** at `components/` root: Textbox, AutosizeTextarea, CopyButton, LoadingScreen, Toggle, SearchableChannelList, FormattedMarkdownMessage, etc.
- **Major groups**:
  - `advanced_text_editor/` — 47 files (TipTap WYSIWYG)
  - `post_view/` — 50 files (reactions, attachments, flags, edit history, timestamps)
  - `sidebar/` — 18 files (categories, channel list, drag-and-drop, filter, unreads)
  - `admin_console/` — 128 entries (settings, users, system config, LDAP, compliance, billing)
  - `channel_info_rhs/`, `channel_header/`, `channel_bookmarks/`, `channel_members_*`
  - `threading/` — 8 files (global threads, virtualized thread viewer)
  - `user_settings/` — 11 pages (display, notifications, sidebar, security, advanced)
  - `common/` — 27 files (scrollbar, accordion, chips, hooks, infinite scroll, radio group)
  - `widgets/` — 19 files (icons, badges, menu, modals, popover, tag, loading)
  - `emoji_picker/`, `gif_picker/`, `code_block/`, `latex_block/`
  - `tours/`, `onboarding_tasklist/`, `drafts/`
  - `quick_switch_modal/`, `keyboard_shortcuts/`
  - `profile_popover/`, `custom_status/`, `status_modal/`
  - `search/`, `search_results/`, `search_bar/`

### Shared UI Packages

| Package                  | Path                       | Contents                                                                                                                      |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `@mattermost/components` | `platform/components/src/` | GenericModal, SkeletonLoader, TourTip, FooterPagination, hooks (useFocusTrap, useStackedModal). Built with styled-components. |
| `@mattermost/client`     | `platform/client/src/`     | Client4.ts (REST + WebSocket client), errors, helpers                                                                         |
| `@mattermost/shared`     | `platform/shared/src/`     | Emoji rendering, tooltip, button, shortcut key display, i18n utils, user agent                                                |
| `@mattermost/types`      | `platform/types/src/`      | 61 type definition files (channels, posts, users, teams, config, etc.)                                                        |

### Styling Architecture

- **~145 Sass files** globally scoped (no CSS modules)
- **`sass/` directory**: utils/ (variables, functions, mixins), base/ (typography, structure, CSS variables), routes/, layout/, components/ (55 files), responsive/ (desktop/tablet/mobile), widgets/
- **3 parallel approaches**: Sass (global), styled-components (component-level, 100+ files), CSS imports (KaTeX, Compass Icons, shared component CSS)
- **No Tailwind CSS**, no CSS modules, no Storybook
- Bootstrap 3.4.1 + Font Awesome 4.7.0 as dependencies
- 150 CSS custom properties at `:root`: 20+ themed colors (with RGB variants), 6 elevations, 7 radii, 3 borders, 10 z-index layers, semantic colors

### Test Structure

- **1,565 test files** total (colocated with components)
- **398 snapshot files** (traditional Jest snapshots)
- Jest 30 + `@testing-library/react` + `redux-mock-store` + `nock`
- Platform packages: 14 additional test files across client, components, shared, types

### Notable Absences

- No Storybook (instead: in-house Component Library at `/component_library`)
- No CSS modules
- No Tailwind
- No TypeScript paths aliasing to the same degree as current repo

---

## 2. Frontend Inventory — Current Repo (chat)

### App Shell

- **Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Socket.io, Supabase
- **Entry**: `apps/web/app/layout.tsx` (server component) → defines metadata, CSP meta, theme/VP/reduced-motion scripts, provider tree
- **Providers chain**: `<ThemeProvider>` → `<PWAProvider>` → `<AuthProvider>` → `<ToastProvider>` → `<AppHeader>` → `<ErrorBoundary>` → `{children}`
- **Layout groups**: `(auth)/` — login, OAuth callback, verify; `(workspace)/` — full sidebar + channel view; root — landing, error pages
- **Theme**: CSS `@media (prefers-color-scheme)` + `html.dark` class toggle, stored in localStorage, applied via inline script

### Route Structure (Next.js App Router — file-system based)

| Path                           | File                                                   | Description                           |
| ------------------------------ | ------------------------------------------------------ | ------------------------------------- |
| `/`                            | `app/page.tsx`                                         | Landing shell / redirect to workspace |
| `/login`                       | `app/(auth)/login/page.tsx`                            | Magic link + OAuth login              |
| `/auth/callback`               | `app/auth/callback/page.tsx`                           | OAuth callback                        |
| `/auth/verify`                 | `app/auth/verify/page.tsx`                             | Email verification                    |
| `/[workspaceSlug]`             | `app/(workspace)/[workspaceSlug]/page.tsx`             | Workspace overview                    |
| `/[workspaceSlug]/[channelId]` | `app/(workspace)/[workspaceSlug]/[channelId]/page.tsx` | Chat channel view                     |
| `/[workspaceSlug]/admin`       | `app/(workspace)/[workspaceSlug]/admin/page.tsx`       | Admin panel                           |
| `/[workspaceSlug]/groups`      | `app/(workspace)/[workspaceSlug]/groups/page.tsx`      | User groups                           |
| `/[workspaceSlug]/saved`       | `app/(workspace)/[workspaceSlug]/saved/page.tsx`       | Saved messages                        |
| `/[workspaceSlug]/scheduled`   | `app/(workspace)/[workspaceSlug]/scheduled/page.tsx`   | Scheduled messages                    |
| `/[workspaceSlug]/search`      | `app/(workspace)/[workspaceSlug]/search/page.tsx`      | Search                                |
| `/[workspaceSlug]/settings`    | `app/(workspace)/[workspaceSlug]/settings/page.tsx`    | User settings                         |
| `/[workspaceSlug]/threads`     | `app/(workspace)/[workspaceSlug]/threads/page.tsx`     | Threads                               |
| `/pl/[postId]`                 | `app/pl/[postId]/page.tsx`                             | Permalink                             |
| `/install`                     | `app/install/page.tsx`                                 | PWA install page                      |

**Total**: 12 route pages across 3 route groups + 5 utility pages

### Component Architecture (49 components + 12 tests + 3 Storybook stories)

| Directory            | Components                                                                                                                                                                                                                                                               | Tests | Stories |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------- |
| `auth/`              | auth-context, avatar-upload, login-form                                                                                                                                                                                                                                  | 1     | —       |
| `channel/`           | channel-list, create-channel-dialog                                                                                                                                                                                                                                      | 1     | —       |
| `chat/`              | channel-bookmarks, channel-info, chat-view, code-block, emoji-picker, file-preview, floating-timestamp, formatting-bar, link-preview, message-input, message-list, notification-preferences-modal, quick-switcher, remind-modal, search-bar, thread-panel, tiptap-editor | 3     | —       |
| `chat/message-list/` | context-menu, delete-dialog, message-item                                                                                                                                                                                                                                | —     | 3       |
| `groups/`            | group-modal, user-picker-modal                                                                                                                                                                                                                                           | —     | —       |
| `home/`              | landing-shell                                                                                                                                                                                                                                                            | 1     | —       |
| `media/`             | media-room                                                                                                                                                                                                                                                               | 1     | —       |
| `notifications/`     | notification-bell                                                                                                                                                                                                                                                        | 1     | —       |
| `pwa/`               | install-prompt, notification-prompt, pwa-provider, update-notification                                                                                                                                                                                                   | 1     | —       |
| `shared/`            | error-boundary, keyboard-shortcuts, profile-popover, status-modal                                                                                                                                                                                                        | 1     | —       |
| `workspace/`         | app-sidebar, create-workspace-dialog, invite-members-modal, onboarding-tour, team-sidebar, workspace-list                                                                                                                                                                | 2     | —       |

### Shared UI Package (`@chat/ui`)

| Module        | Files                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `components/` | avatar, badge, button, dialog, input, sidebar-group, skeleton, theme-toggle, toast (+7 test files, +7 stories) |
| `tokens/`     | index, colors, semantic-colors, typography, spacing, motion, borders, focus, tailwind-theme (+ CSS export)     |
| `hooks/`      | use-theme                                                                                                      |
| `styles.css`  | Tailwind v4 `@theme` block with full design token set + dark mode overrides                                    |

### Styling Architecture

- **Tailwind CSS v4** — CSS-driven via `@theme` blocks (no JS config file)
- **Two-tier token system**:
  1. TypeScript design tokens in `packages/ui/src/tokens/` (colors, typography, spacing, etc.)
  2. CSS custom properties in `apps/web/app/globals.css` (Mattermost-compatible names: `--center-channel-bg`, `--sidebar-bg`, etc.)
- **Dark mode**: `html.dark` class overrides in both `globals.css` and `ui/styles.css`
- **517 lines** of globals.css: Tailwind import, Mattermost variables, utility classes, responsive rules, post/permalink styling, status/channel utilities, animations
- **No Bootstrap, no Font Awesome, no styled-components** — pure Tailwind + CSS vars

### Library Layer (`apps/web/lib/`)

- api.ts (fetch wrapper), socket.ts (Socket.io client), env.ts, sentry.ts, version.ts
- keyboard-shortcut-registry.ts, notification-sound.ts, slash-commands.ts, use-presence.ts, use-swipe-back.ts
- emoji/ (3357 emojis + recent tracking), i18n/ (en.json, 250+ keys), optimistic/ (optimistic UI utilities), pwa/ (service worker), supabase/ (Supabase client)

### Test Structure

- **19 component tests** (12 in web + 7 in ui package), Vitest
- **11 Storybook stories** (3 web + 8 ui)
- **3 E2E tests** (Playwright): auth-workspace-chat, comprehensive, visual-snapshot

### PWA Support

- Service worker with push notifications
- Manifest, install prompt, notification prompt, update notification
- Dedicated `/install` page

---

## 3. Structural Similarities

| Area                          | Similarity                                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth routes**               | Both have dedicated auth route groups (login, OAuth callback, email verify)                                                                                |
| **Channel-centric workspace** | Both route users into a slug-based workspace with channel selection                                                                                        |
| **Design tokens system**      | Both define themed CSS custom properties at root level with similar naming conventions (`--center-channel-bg`, `--sidebar-bg`, `--online-indicator`, etc.) |
| **Component hierarchy**       | Both have a shared UI package with Button, Input, Badge, Modal/Dialog, Avatar, Skeleton                                                                    |
| **Emoji picker**              | Both have searchable emoji pickers with category tabs + skin tones                                                                                         |
| **Message rendering**         | Both have message items with reactions, edit history, timestamps, attachments                                                                              |
| **Quick switcher**            | Both implement Ctrl+K command palette for channel/people search                                                                                            |
| **Keyboard shortcuts**        | Both have keyboard shortcut registries with modal display                                                                                                  |
| **Onboarding**                | Both have task lists / guided tours for new users                                                                                                          |
| **Custom status**             | Both support emoji + text + duration custom user status                                                                                                    |
| **Threading**                 | Both support threaded conversations with dedicated thread views                                                                                            |
| **Search**                    | Both offer message/file search with filters                                                                                                                |
| **Code blocks**               | Both offer syntax-highlighted code blocks with language labels                                                                                             |
| **Profile popover**           | Both have avatar-click popovers with user info                                                                                                             |

---

## 4. Structural Differences

| Area                   | Reference Repo (Mattermost)                          | Current Repo (chat)                                     |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| **Framework**          | React 18 + react-router v5 + Redux                   | Next.js 15 App Router + React 19 (no Redux)             |
| **Styling**            | Sass 145 files + styled-components 100+ files        | Tailwind CSS v4 (entirely CSS-driven)                   |
| **Routing**            | Flat, imperative `<Switch>` in Root + TeamController | File-system based, nested route groups                  |
| **Component count**    | ~358 components                                      | ~49 components                                          |
| **Test count**         | 1,565 test files                                     | 19 component tests + 3 E2E                              |
| **Admin console**      | 128-entry admin console (full-featured)              | Single admin page (user roles + CSV import)             |
| **Plugin system**      | Full plugin architecture with Pluggable routes       | None                                                    |
| **GIF picker**         | Giphy API-based GIF picker                           | None (slash `/gif` command instead)                     |
| **LaTeX rendering**    | LaTeX blocks (KaTeX)                                 | None                                                    |
| **Desktop app**        | Native desktop app integration                       | PWA-only approach                                       |
| **MFA**                | Full MFA support (TOTP, backup codes)                | None                                                    |
| **Storybook**          | In-house Component Library                           | Storybook 8 with 11 stories                             |
| **i18n**               | react-intl, 67+ locales                              | Custom i18n with en.json (250+ keys)                    |
| **State management**   | Redux store (single store, 20+ reducers)             | React hooks + Supabase (no Redux)                       |
| **Multi-team sidebar** | 65px rail with team icons + drag-and-drop            | TeamSidebar component (desktop only)                    |
| **Typography scale**   | `sass/base/_typography.scss`                         | `packages/ui/src/tokens/typography.ts` + Tailwind scale |
| **Breakpoints**        | Custom Sass responsive breakpoints                   | Tailwind default breakpoints (sm/md/lg/xl)              |
| **Modals**             | GenericModal from shared package + ModalController   | Dialog component from `@chat/ui`                        |
| **Loading states**     | LoadingScreen, LoadingImagePreview, SkeletonLoader   | Skeleton component from `@chat/ui` + loading.tsx files  |

---

## 5. Major User-Facing Areas

### Current Repo

| Area                   | Route(s)                                   | Key Components                                                |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **Login & Auth**       | `/login`, `/auth/callback`, `/auth/verify` | LoginForm, AuthProvider, auth-context                         |
| **Landing**            | `/`                                        | LandingShell                                                  |
| **Workspace Overview** | `/[workspaceSlug]`                         | WorkspaceList, AppSidebar                                     |
| **Chat Channel**       | `/[workspaceSlug]/[channelId]`             | ChatView, MessageList, MessageItem, MessageInput, ThreadPanel |
| **Search**             | `/[workspaceSlug]/search`                  | SearchBar, MessageList (filtered)                             |
| **Threads**            | `/[workspaceSlug]/threads`                 | ThreadPanel                                                   |
| **Saved Messages**     | `/[workspaceSlug]/saved`                   | MessageList (filtered)                                        |
| **Scheduled Messages** | `/[workspaceSlug]/scheduled`               | RemindModal, MessageList (filtered)                           |
| **User Groups**        | `/[workspaceSlug]/groups`                  | GroupModal, UserPickerModal                                   |
| **Admin Panel**        | `/[workspaceSlug]/admin`                   | Admin page (user roles + CSV import)                          |
| **Settings**           | `/[workspaceSlug]/settings`                | Settings page                                                 |
| **PWA**                | `/install`                                 | InstallPrompt, NotificationPrompt                             |

### Reference Repo

| Area                   | Route(s)                                               | Key Component Groups                                                               |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **Login & Auth**       | `/login`, `/signup*`, `/mfa`, `/claim`                 | login/, signup/, mfa/, claim/                                                      |
| **Team Selection**     | `/select_team`, `/create_team`, `/preparing-workspace` | select_team/, create_team/, preparing_workspace/                                   |
| **Channel View**       | `/:team/channels/:channel`                             | channel_layout/, channel_view/, center_channel/, post_view/, advanced_text_editor/ |
| **Threads**            | `/:team/:team/threads/:threadId`                       | threading/ (global + per-channel + virtualized viewer)                             |
| **Search**             | `/:team/search`                                        | search/, search_results/, search_bar/                                              |
| **Admin Console**      | `/admin_console`                                       | admin_console/ (128 files, full system config)                                     |
| **Integrations**       | `/:team/integrations`                                  | integrations/, backstage/                                                          |
| **Custom Emoji**       | `/:team/emoji`                                         | BackstageController                                                                |
| **User Settings**      | `/:team/settings`                                      | user_settings/ (11 page types)                                                     |
| **Plugin Marketplace** | Various                                                | plugin_marketplace/                                                                |
| **Onboarding**         | Tour popovers                                          | tours/, onboarding_tasklist/                                                       |
| **Drafts**             | Drafts UI                                              | drafts/                                                                            |
| **GIF Picker**         | Within composer                                        | gif_picker/                                                                        |

---

## 6. Likely Fragile or High-Churn UI Areas

### Current Repo

| Area                 | Fragility   | Reason                                                                                                                                                           |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MessageList**      | High        | Core UX — optimistic updates, real-time Socket.io events, virtual scrolling, reactions, context menu, floating timestamps, pinning, flagging. High blast radius. |
| **MessageInput**     | High        | TipTap editor, slash commands, emoji autocomplete, formatting bar, paste image, draft save/restore. Input handling is the most interacted-with surface.          |
| **ChatView**         | High        | Orchestrates MessageList + MessageInput + ThreadPanel + ChannelInfo. Props flow and state management are complex.                                                |
| **AppSidebar**       | Medium-High | Categories, drag-and-drop, unread badges, resize, mobile/desktop dual mode, keyboard navigation. Many recent P2 accessibility fixes.                             |
| **ThreadPanel**      | Medium      | Reactions UI added recently (UX-035), full reply flow, scroll restoration                                                                                        |
| **globals.css**      | Medium      | 517 lines — CSS vars, utility classes, responsive rules, dark mode. Easy to introduce style conflicts.                                                           |
| **AuthProvider**     | Medium      | Session management, redirects, workspace loading. Auth failures cascade to all routes.                                                                           |
| **Search**           | Medium      | Autocomplete, operator hints, files/messages toggle, pagination                                                                                                  |
| **Workspace Layout** | Medium      | CSS Grid with resizable sidebar, responsive breakpoints, mobile bottom nav, safe-area handling                                                                   |

### Reference Repo

| Area                      | Fragility   | Reason                                                                                           |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| **Root.tsx**              | High        | 515-line class component — central routing orchestrator, modal management, plugin initialization |
| **post_view/**            | High        | 50 files — reactions, attachments, flags, edit history, timestamps. High visual regression risk. |
| **admin_console/**        | High        | 128 entries — complex form state, conditional rendering, deep settings hierarchy                 |
| **advanced_text_editor/** | Medium-High | 47 files — TipTap integration, AI rewrite, formatting bar, schedule send, priority labels        |
| **sass/**                 | Medium      | 145 files, globally scoped — any change can cascade unexpectedly. No CSS module isolation.       |

---

## 7. Unknowns for Later Phases

- **Real-time message pipeline**: How Socket.io events map to UI state updates in MessageList. Race conditions in optimistic update chain.
- **Mobile touch interactions**: Swipe gestures, long-press menus, scroll performance on low-end devices. Actual iOS/Android testing results.
- **Keyboard shortcut conflicts**: Browser-native vs app-level shortcuts. Whether Alt+up/down conflicts with accessibility tools.
- **i18n coverage gaps**: Which UI strings remain hardcoded (non-localized). The `login-form.tsx` recently adopted `t()` but other components may not.
- **Error boundary coverage**: Which page/component subtrees lack error boundaries. Currently only root and workspace layout have them.
- **Focus management completeness**: Which modals/popovers lack focus traps after recent fixes. Need to audit all 9+ modal-like components.
- **Contrast verification**: Which color combinations fail WCAG AA. The `foreground.muted` fix (UX-016) addressed one; others may remain.
- **Storybook coverage gaps**: Only 11 stories. Most components have no isolated rendering or interaction testing documented.
- **Mobile sidebar performance**: Overlay with 80vw width on mobile — animation performance and backdrop rendering.
- **Desktop app readiness**: PWA approach covers native features but gaps (window management, system tray, native notifications) are unknown.
