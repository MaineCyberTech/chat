# UI/UX Phase 1 — Frontend Inventory and Structural Baseline

**Run**: 2026-07-09 04:15 UTC
**Reference repo**: `C:\temp\mattermost-master` (Mattermost v11.9.0)
**Current repo**: `C:\temp\chat`

---

## 1. Frontend Inventory — Reference Repo (Mattermost)

### App Shell

- **Monorepo structure** under `webapp/`: channels app, platform types, client, components, shared, Redux
- **Entry**: `webapp/channels/src/root.tsx` → `entry.tsx` → `<App>` → `<Root>`
- **Build**: Webpack 5, Babel, custom scripts
- **Router**: react-router-dom v5 (`<Switch>` + `<Route>`), browser history

### Route Structure

- **Declarative routes** in `root.tsx`, 25+ top-level routes
- **Route guards**: HFRoute (public), LoggedInRoute (auth required), LoggedInHFTRoute
- **Team routes** nested under `TeamController` → `ChannelController`
- **No centralized route config** — routes embedded in component JSX

### Layout Hierarchy

```
<App>
  <Provider (Redux)>
    <Router>
      <Root>
        <RootProvider>
          <WithUserTheme>          (CSS variable theming via user preference)
            <GlobalHeader/>        (top global nav bar)
            <TeamSidebar/>         (team rail, 65px)
            <AnnouncementBarController/>
            <main-wrapper>
              <TeamController>
                <ChannelController>
                  <Sidebar/>       (channel sidebar)
                  <CenterChannel>  (header, PostList, AdvancedTextEditor)
                  <SidebarRight/>  (RHS)
                </ChannelController>
              </TeamController>
            </main-wrapper>
            <AppBar/>              (integration/app bar)
            <ModalController/>     (global modal stack)
          </WithUserTheme>
        </RootProvider>
```

### Component Organization

- **358 component directories** under `components/`
- **Categories**: core layout, sidebar, channel, messages, composer, content, files/media, emoji, search, threads, user, admin console, modals, forms, navigation, onboarding, drafts, notifications, plugins
- **35+ modal components** — individual directories per modal (confirm, invite, settings, etc.)
- **Shared UI**: `@mattermost/components` (GenericModal, SkeletonLoader, TourTip), `@mattermost/shared` (Button, Emoji, Tooltip, ShortcutKey)
- **Widgets**: icons (65 inline SVGs), menu system, popover, inputs, loading, badges, links, tags

### Design System

- **No formal design system** — pattern library via `components/component_library/` (dev-only)
- **No Storybook**
- **SCSS**: 55 component partials, 12 layout partials, 15 route partials, responsive breakpoints (mobile/tablet/desktop)
- **CSS custom properties**: 60+ themed and non-themed variables on `:root`
- **Theme provider**: `<WithUserTheme>` HOC sets CSS variables from user preference
- **Compass Icons**: `@mattermost/compass-icons` (SVG icon library)
- **Font Awesome**: Legacy CSS import
- **Fonts**: Metropolis (headings), Open Sans (body)
- **Typography**: Comprehensive scale via SCSS mixins

### Feedback States

- `InitialLoadingScreen` (full-screen app start)
- `LoadingSpinner`, `LoadingWrapper`, `LoadingImagePreview`
- `CircleSkeletonLoader`, `RectangleSkeletonLoader`
- `NoResultsIndicator`, `SearchHint`
- `ErrorPage`, `WithErrorBoundary`, `MessageSubmitError`
- `AlertBanner`, `SectionNotice`
- `ScrollToBottomToast`, `InfoToast`

### Test Structure

- **Unit**: Jest with co-located `*.test.tsx` files, snapshot tests
- **E2E**: Playwright (37 functional test directories) + Cypress
- **Visual**: Playwright visual regression tests
- **Accessibility**: Playwright accessibility tests

---

## 2. Frontend Inventory — Current Repo (Chat)

### App Shell

- **Next.js 15** App Router with Turborepo monorepo
- **Entry**: `apps/web/app/layout.tsx` → route groups → page files
- **Build**: Next.js compiler, Turborepo, pnpm workspaces
- **Styling**: Tailwind CSS v4 via PostCSS

### Route Structure

- **File-system routing** via `app/` directory (Next.js App Router)
- **Route groups**: `(auth)` for login pages, `(workspace)` for authenticated workspace shell
- **15 page files**: home, login, auth/callback, auth/verify, install, pl/[postId], [workspaceSlug] (home, channelId, search, settings, admin, groups, saved, scheduled, threads)
- **Loading/error/not-found boundaries** at multiple levels

### Layout Hierarchy

```
<html>
  <ThemeProvider>                    (light/dark/system via use-theme)
    <PWAProvider>
      <AuthProvider>                 (Supabase auth context)
        <ToastProvider>
          <AppHeader />
          <ErrorBoundary>
            <main>{children}</main>  (route group renders here)
          </ErrorBoundary>
          <VersionBadge />
          <CookieBanner />
          <KeyboardShortcuts />
        </ToastProvider>
      </AuthProvider>
    </PWAProvider>
  </ThemeProvider>
</html>
```

Workspace layout (inside `<main>`):

```
<div class="flex h-screen">
  <TeamSidebar />                   (65px rail, desktop only)
  <AppSidebar />                    (resizable, 200-500px, collapsible to 60px)
  <div class="app__content">
    <ErrorBoundary>{children}</ErrorBoundary>
  </div>
  <nav class="bottom-nav" />        (mobile only)
  <QuickSwitcher />                 (Ctrl+K)
  <OnboardingTour />                (5-step tour)
  <AnnouncementBanner />
</div>
```

### Component Organization

- **9 component directories** under `apps/web/components/`: auth, channel, chat, groups, home, media, notifications, pwa, shared, workspace
- **Core chat**: 25 files (chat-view, message-list, message-input, thread-panel, search-bar, emoji-picker, formatting-bar, tiptap-editor, etc.)
- **11 shared UI components** in `packages/ui/src/components/`: Button, Avatar, Badge, Input, Dialog, Skeleton, EmptyState, Toast, ThemeToggle, SidebarGroup, ScreenReaderOnly, StatusBadge

### Design System

- **Design tokens**: `packages/ui/src/tokens/` — colors, typography, spacing, motion, borders, focus (all with TS types)
- **Tailwind CSS v4** `@theme` block in `styles.css` with full design token mapping
- **Two-layer CSS**: Mattermost-style vars in `globals.css`, design token vars in `styles.css`
- **14 Storybook stories** across shared UI and message-list components
- **Icons**: lucide-react (25+ icons used)
- **No font imports** — system font stack
- **Typography**: Tailwind utility classes

### Feedback States

- `Skeleton`, `SkeletonLine`, `SkeletonCircle` (shared UI)
- `EmptyState` (shared UI with icon/title/description/action)
- `ErrorBoundary` (class-based, Sentry integration)
- **Loading pages** at 5+ levels (root, auth, workspace, per-workspace, per-channel)
- **Error pages** at 5+ levels
- **Not-found pages** at 2+ levels
- `ConnectionBanner` (reconnecting/disconnected)
- Toast system with 5 variants (default/success/error/warning/info)
- `DeleteDialog` error display

### Test Structure

- **Unit**: Vitest with 12 component test files + 7 shared UI test files
- **E2E**: Playwright with 3 spec files
- **Visual**: Playwright visual snapshot spec

---

## 3. Structural Similarities

| Aspect                    | Both Have                                   |
| ------------------------- | ------------------------------------------- |
| **3-panel layout**        | Team rail + sidebar + content area          |
| **Route guards**          | Auth-gated vs public pages                  |
| **Modal/dialog patterns** | Overlay dialogs with focus traps            |
| **Context menus**         | Right-click menus with actions              |
| **Toast notifications**   | Auto-dismissing user feedback               |
| **Skeleton loading**      | Placeholder loading states                  |
| **Empty states**          | No-results / empty-content messaging        |
| **Channel sidebar**       | Categorized channel list with unread badges |
| **Thread panel**          | Right-hand side conversation threading      |
| **Emoji picker**          | Category tabs, skin tones, search           |
| **Search**                | Message/file search with filters            |
| **User status**           | Online/away/DND/offline indicators          |
| **File preview**          | Image/file preview with zoom                |
| **Keyboard shortcuts**    | Ctrl+K quick switcher, shortcut modal       |

---

## 4. Structural Differences

| Aspect               | Mattermost                       | Chat                                     |
| -------------------- | -------------------------------- | ---------------------------------------- |
| **Framework**        | React SPA (Webpack)              | Next.js 15 (SSR/SSG)                     |
| **State management** | Redux (mattermost-redux)         | React hooks + optimistic updates         |
| **Styling approach** | SCSS + CSS variables             | Tailwind CSS v4 + CSS variables          |
| **Component count**  | 358+ component directories       | ~60 component files                      |
| **Design system**    | Ad-hoc (component library page)  | Formal design tokens + Storybook         |
| **Icon library**     | Compass Icons + Font Awesome     | lucide-react                             |
| **Routing**          | react-router v5 (declarative)    | File-system (App Router)                 |
| **Test framework**   | Jest + snapshots                 | Vitest                                   |
| **E2E**              | Playwright (37 suites) + Cypress | Playwright (3 suites)                    |
| **Modal system**     | 35+ individual modal components  | Shared Dialog component + modal variants |
| **Plugin system**    | Full plugin marketplace + API    | None                                     |
| **Admin console**    | 128 sub-directories              | Single admin page                        |
| **i18n**             | 67 locales                       | English only (en.json)                   |
| **Desktop app**      | Native Electron app              | PWA only                                 |
| **Fonts**            | Metropolis + Open Sans           | System font stack                        |

---

## 5. Major User-Facing Areas

### Both Repos

1. **Authentication**: Login/signup/verification flows
2. **Workspace/home**: Channel list, workspace selection
3. **Messaging**: Channel view, message list, composer
4. **Threads**: Threaded conversations (RHS)
5. **Search**: Full-text search with filters
6. **User profiles**: Profile popovers, status, avatars
7. **Settings**: Notification preferences, theme
8. **Admin**: User management, invitations

### Mattermost Only

9. **Plugin marketplace**: Discover and install plugins
10. **Integrations**: Webhooks, commands, OAuth apps, bots
11. **Cloud billing**: Subscription management, trials
12. **Compliance export**: Regulatory compliance
13. **Analytics dashboard**: System/team analytics charts
14. **Boards/playbooks**: Project management

### Chat Only (via PWA)

9. **PWA installation**: Install prompt, service worker, offline
10. **Media rooms**: LiveKit WebRTC calls
11. **AI rewrite**: Sparkles button for AI message actions

---

## 6. Likely Fragile or High-Churn UI Areas

| Area                             | Why Fragile                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `message-input.tsx` (1026 lines) | Highest complexity, TipTap + format bar + emoji + slash commands + scheduling + priorities + AI + drafts |
| `app-sidebar.tsx` (1191 lines)   | Categories, channels, DMs, drag-and-drop, resize, status, user picker                                    |
| `chat-view.tsx` (905 lines)      | Core orchestration: messages, thread, search, channel info, connection, media                            |
| `globals.css`                    | 517 lines of CSS utilities, must stay in sync with token system                                          |
| `Dark mode`                      | CSS variables in 3 locations (globals.css, styles.css, semantic-colors.ts) must all align                |

---

## 7. Unknowns for Later Phases

- Actual user testing data (no analytics on click paths or drop-off)
- Real-world accessibility audit data (no axe/Pa11y results)
- Mobile device testing beyond Chrome DevTools emulation
- Internationalization coverage gaps (en.json exists but untested for RTL)
- Performance metrics (LCP, FCP, CLS for critical flows)
