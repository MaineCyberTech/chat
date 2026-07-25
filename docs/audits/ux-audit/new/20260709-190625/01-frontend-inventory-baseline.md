# UI/UX Phase 1 — Frontend Inventory and Structural Baseline

**Run**: 2026-07-09 19:06 UTC
**Reference repo**: `C:\temp\mattermost-master` (Mattermost v11.9.0)
**Current repo**: `C:\temp\chat`

---

## 1. Frontend Inventory — Reference Repo (Mattermost)

### App Shell

- **Monorepo** under `webapp/`: channels app, platform types, client, components, shared, Redux
- **Entry**: `root.tsx` → `entry.tsx` → `<App>` → `<Root>` → React SPA
- **Build**: Webpack 5, Babel
- **Router**: react-router-dom v5 (`<Switch>` + `<Route>`), browser history

### Route Structure

- 25+ top-level routes in `root.tsx`
- Route guards: HFRoute (public), LoggedInRoute (auth), LoggedInHFTRoute
- Team routes nested under `TeamController` → `ChannelController`
- No centralized route config

### Layout Hierarchy

```
<App>
  <Provider (Redux)>
    <Router>
      <Root>
        <RootProvider>
          <WithUserTheme>          (CSS variable theming)
            <GlobalHeader/>
            <TeamSidebar/>         (65px rail)
            <AnnouncementBarController/>
            <main-wrapper>
              <TeamController>
                <ChannelController>
                  <Sidebar/>       (channels)
                  <CenterChannel>  (header, PostList, AdvancedTextEditor)
                  <SidebarRight/>  (RHS)
                </ChannelController>
              </TeamController>
            </main-wrapper>
            <AppBar/>
            <ModalController/>
          </WithUserTheme>
        </RootProvider>
```

### Component Organization

- **358 component directories** under `components/`
- **35+ modal components** — individual directories per modal
- **Shared UI**: `@mattermost/components` (GenericModal, SkeletonLoader, TourTip), `@mattermost/shared` (Button, Emoji, Tooltip)
- **Widgets**: 65 inline SVG icons, menu system, popover, inputs, loading, badges
- **SCSS**: 55 component partials, 12 layout partials, 15 route partials, responsive breakpoints

### Design System

- No formal design system, no Storybook
- Compass Icons + Font Awesome for icons
- Metropolis (headings) + Open Sans (body) fonts

---

## 2. Frontend Inventory — Current Repo (Chat)

### App Shell

- **Next.js 15** App Router with Turborepo + pnpm workspaces
- **Entry**: `app/layout.tsx` → route groups → page files
- **Styling**: Tailwind CSS v4 via PostCSS
- **Build**: Next.js compiler, Turborepo caching

### Route Structure

- **File-system routing** via `app/` directory
- Route groups: `(auth)` for login, `(workspace)` for authenticated shell
- 15 page files across home, login, auth/callback, verify, install, permalink, workspace, channel, search, settings, admin, groups, saved, scheduled, threads
- Loading/error/not-found boundaries at 5+ levels each

### Layout Hierarchy

```
<html>
  <ThemeProvider>
    <PWAProvider>
      <AuthProvider>              (Supabase auth)
        <ToastProvider>           (5 variants, role="alert")
          <AppHeader/>
          <ErrorBoundary>
            <main>{children}</main>
          </ErrorBoundary>
          <VersionBadge/>
          <CookieBanner/>
          <KeyboardShortcuts/>
        </ToastProvider>
      </AuthProvider>
    </PWAProvider>
  </ThemeProvider>
</html>
```

Workspace layout:

```
<div>
  <AnnouncementBanner/>           (dismissible, localStorage persistence)
  <RouteLoadingIndicator/>
  <TeamSidebar/>                  (65px rail, desktop)
  <AppSidebar/>                   (resizable, auto-collapses on tablet)
  <div class="app__content">
    <ErrorBoundary>{children}</ErrorBoundary>
  </div>
  <nav class="bottom-nav"/>       (mobile only)
  <QuickSwitcher/>                (Ctrl+K)
  <OnboardingTour/>              (5-step)
</div>
```

### Component Organization (apps/web/components/)

| Directory            | Files       | Purpose                                                                                                                                                        |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth/`              | 3 + tests   | Auth context, login form, avatar upload                                                                                                                        |
| `channel/`           | 2 + tests   | Channel list, create dialog                                                                                                                                    |
| `chat/`              | 25 files    | Core messaging (chat-view, message-list, message-input, thread-panel, search-bar, emoji-picker, formatting-bar, tiptap-editor, code-block, file-preview, etc.) |
| `chat/message-list/` | 4 + stories | MessageItem, ContextMenu, DeleteDialog                                                                                                                         |
| `groups/`            | 2           | Group modal, user picker                                                                                                                                       |
| `home/`              | 1 + tests   | Landing shell                                                                                                                                                  |
| `media/`             | 1 + tests   | LiveKit media room                                                                                                                                             |
| `notifications/`     | 1 + tests   | Notification bell                                                                                                                                              |
| `pwa/`               | 4 + tests   | Install, notification prompts, update notification                                                                                                             |
| `shared/`            | 4 + tests   | ErrorBoundary, KeyboardShortcuts, ProfilePopover, StatusModal                                                                                                  |
| `workspace/`         | 7 + tests   | AppSidebar (1191 lines), TeamSidebar, WorkspaceList, CreateWorkspaceDialog, InviteMembersModal, OnboardingTour                                                 |

### Shared UI Package (packages/ui/src/components/)

| Component                                | Props                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Button                                   | variant (primary/secondary/ghost/danger), size (sm/md/lg)                            |
| Avatar                                   | img onError fallback                                                                 |
| Badge                                    | variant (default/success/warning/danger)                                             |
| Input                                    | styled with focus ring                                                               |
| Dialog                                   | open/onClose/title, focus trap, Escape, overlay, auto-focus                          |
| Skeleton / SkeletonLine / SkeletonCircle | animate-pulse                                                                        |
| EmptyState                               | icon/title/description/action                                                        |
| Toast / useToast                         | 5 variants (default/success/error/warning/info), role="alert", action button support |
| ThemeToggle                              | light/dark/system cycle                                                              |
| SidebarGroup                             | collapsible category                                                                 |
| ScreenReaderOnly                         | sr-only accessible text                                                              |
| StatusBadge                              | online/away/dnd/offline with aria-label                                              |

All 12 components have Storybook stories.

### Design Tokens (packages/ui/src/tokens/)

| File               | Exports                                                            |
| ------------------ | ------------------------------------------------------------------ |
| colors.ts          | colorTokens (neutral/blue/green/yellow/red scales)                 |
| semantic-colors.ts | semanticColors + darkSemanticColors (light/dark mappings)          |
| typography.ts      | font family, size, weight, line-height, letter-spacing             |
| spacing.ts         | spacing scale 0-24, density modes                                  |
| motion.ts          | duration (instant-fast-normal-slow), easing (linear-in-out-spring) |
| borders.ts         | radius (none-full), shadows (xs-2xl, focus, inner)                 |
| focus.ts           | focus ring width/offset/color                                      |
| tailwind-theme.ts  | CSS variable → Tailwind utility mapping                            |

### Theme & Styling

- **Two-layer CSS**: Mattermost-style vars in `globals.css`, design token vars in `styles.css`
- **Z-index system**: `--z-base` (1) through `--z-max` (100)
- **Elevation**: `--elevation-1` through `--elevation-6`
- **Text opacity**: `--text-secondary-alpha` (0.72), `--text-tertiary-alpha` (0.56)
- **Borders**: `--border-default`, `--border-light`, `--border-dark`
- **Semantic colors**: info/success/warning/danger as RGB tuples
- **Dark mode**: `html.dark` class, 60+ vars redefined
- **High-contrast mode**: `@media (prefers-contrast: high)` block with enhanced contrast
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables animations
- **iOS safe areas**: `env(safe-area-inset-*)` on header/bottom nav
- **iOS keyboard**: VisualViewport API for `--vh` recalculation

### Icons

- **lucide-react** — consistent 14-20px monoline icons
- Used in both `@chat/web` and `@chat/ui`

---

## 3. Structural Similarities

| Aspect                | Both Have                                    |
| --------------------- | -------------------------------------------- |
| 3-panel layout        | Team rail + sidebar + content + optional RHS |
| Route guards          | Auth-gated vs public                         |
| Modal/dialog patterns | Overlay with focus traps                     |
| Context menus         | Right-click with viewport clamping           |
| Toast notifications   | Auto-dismiss, role="alert"                   |
| Skeleton loading      | Placeholder loading                          |
| Channel sidebar       | Categories, unread badges, drag-and-drop     |
| Thread panel          | RHS conversation threading                   |
| Emoji picker          | Categories, skin tones, search               |
| Search                | Messages/files toggle, filters               |
| User status           | Online/away/DND/offline                      |
| File preview          | Zoom, navigation, metadata                   |

---

## 4. Structural Differences

| Aspect           | Mattermost                       | Chat                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| Framework        | React SPA (Webpack)              | Next.js 15 (SSR/SSG, App Router)       |
| State management | Redux (mattermost-redux)         | React hooks + optimistic updates       |
| Styling          | SCSS + CSS variables             | Tailwind CSS v4 + design tokens        |
| Components       | 358+ directories                 | ~60 files + 12 shared UI               |
| Design system    | Ad-hoc (dev component library)   | Formal tokens + Storybook (14 stories) |
| Icons            | Compass Icons + Font Awesome     | lucide-react (consistent)              |
| Routing          | react-router v5 (declarative)    | File-system (Next.js App Router)       |
| Testing          | Jest + snapshots                 | Vitest                                 |
| E2E              | Playwright (37 suites) + Cypress | Playwright (3 suites)                  |
| Modals           | 35+ individual components        | Shared Dialog + variants               |
| Plugin system    | Full marketplace + API           | None                                   |
| Admin            | 128 sub-directories              | Single page                            |
| i18n             | 67 locales                       | English only                           |
| Desktop          | Native Electron app              | PWA only                               |
| Fonts            | Metropolis + Open Sans           | System font stack                      |

---

## 5. Major User-Facing Areas

### Both

1. Authentication (login/signup/verification)
2. Workspace/home (channel list, workspace selection)
3. Messaging (channel view, message list, composer)
4. Threads (RHS threaded conversations)
5. Search (full-text with filters)
6. User profiles (popovers, avatars, status)
7. Settings (notifications, theme)
8. Admin (user management, invitations)

### Chat Only

- PWA installation + service worker + offline
- LiveKit WebRTC media rooms
- AI rewrite (Sparkles button)

### Mattermost Only

- Plugin marketplace + integrations
- Cloud billing + subscription management
- Compliance export
- Analytics dashboard
- Boards/playbooks

---

## 6. Likely Fragile or High-Churn UI Areas

| Area                | Why Fragile                                                                                             | Lines |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ----- |
| `message-input.tsx` | TipTap + format bar + emoji + slash + scheduling + priorities + AI + drafts                             | 1026  |
| `app-sidebar.tsx`   | Categories, channels, DMs, drag-and-drop, resize, status, user picker                                   | 1191  |
| `chat-view.tsx`     | Core orchestration: messages, thread, search, channel info, connection, media, topic editing, file drop | 1119  |
| `thread-panel.tsx`  | Replies, reactions, emoji picker, typing indicator, participants                                        | 353   |
| `search-bar.tsx`    | Operator hints, autocomplete, file extensions, user/channel suggestions                                 | ~850  |

---

## 7. Unknowns for Later Phases

- Actual user testing data (no analytics on click paths or drop-off)
- Real-world accessibility audit data (no axe/Pa11y results)
- Mobile device testing beyond Chrome DevTools emulation
- Internationalization coverage gaps (en.json exists but untested for RTL)
- Performance metrics (LCP, FCP, CLS for critical flows)
- File upload progress indicator UX
