# UI/UX Phase 1 — Frontend Inventory and Structural Baseline

**Run**: 2026-07-09 03:26 UTC
**Reference Repo**: `C:\temp\mattermost-master` (Mattermost v11.9.0)
**Current Repo**: `C:\temp\chat`

---

## 1. Frontend Inventory — Reference Repo (Mattermost)

### App Shell / Route Structure

- **Framework**: Custom React SPA with Webpack 5, Babel, react-router-dom (client-side routing)
- **Entry**: `webapp/channels/src/root.html` → `root.tsx` → `entry.tsx` → `app.tsx`
- **Provider chain**: `CompassDesignProvider` → `ThemeProvider` → `IntlProvider` → `Router` → `Root`
- **Routes**: `<Root>` → `<LoggedIn>` (auth guard) → `<TeamController>` → `<ChannelController>` / `<ChannelIdentifierRouter>`
- **Layout hierarchy**: Global header → Team sidebar (65px rail) → Main content area → RHS panel (threads/search) → Bottom footer elements

### Component Architecture

- **~490+ component directories** in `webapp/channels/src/components/`
- **~128 admin console subdirectories** in `components/admin_console/`
- **Systematic subdirectory pattern**: each component owns its `index.tsx`, `*.test.*`, `*.scss`
- **Widgets library**: `components/widgets/` with 19 subdirectories (icons, inputs, menu, modals, loading, tags, users, etc.)
- **Common library**: `components/common/` with ~70 custom hooks + accordion, carousel, infinite scroll, etc.

### Styling System

- **93 Sass partials** across `sass/`: 55 component, 12 layout, 4 responsive, 15 routes, 7 utils
- **CSS variables** in `sass/base/_css_variables.scss` (Mattermost theme system)
- **Responsive breakpoints** in `sass/responsive/` (desktop, tablet, mobile)
- **Admin console CSS variables** in `sass/admin_console_base/_sys_css_variables.scss`
- **No design tokens package** — colors in SCSS variables + CSS custom properties

### Testing

- **~100+ `.test.*` files** alongside components
- **50 Cypress E2E test categories** in `e2e-tests/cypress/tests/integration/channels/`
- **37 Playwright functional test categories** in `e2e-tests/playwright/specs/functional/channels/`
- **11 Playwright accessibility specs** in `e2e-tests/playwright/specs/accessibility/channels/`

### Theme System

- **`CompassDesignProvider`** wrapping the entire app
- **`ThemeProvider`** with context-based dynamic theme switching
- Theme variables injected via `applyTheme()` in JS, default CSS vars for FOUC prevention
- **68 i18n locale files** in `webapp/channels/src/i18n/`

---

## 2. Frontend Inventory — Current Repo

### App Shell / Route Structure

- **Framework**: Next.js 15 App Router with Turborepo + pnpm workspace
- **Entry**: `apps/web/app/layout.tsx` → `globals.css`, providers chain
- **Provider chain**: `ThemeProvider` → `PWAProvider` → `AuthProvider` → `ToastProvider` → `<main>`
- **Route groups**: `(auth)/` for login, `(workspace)/` for authenticated workspace
- **15 page routes**, 3 layouts, 4 loading states, 4 error boundaries, 2 not-found pages

### Component Architecture

- **47 `.tsx` component files** in `apps/web/components/`
- **10 `.tsx` component files** in `packages/ui/src/components/` (shared library)
- **Subdirectory pattern**: `chat/message-list/`, `workspace/`, `shared/`, `pwa/`, etc.
- **Design token system**: `packages/ui/src/tokens/` with 8 token files (colors, spacing, typography, borders, motion, focus, semantic-colors, tailwind-theme)

### Styling System

- **`globals.css`** (517 lines): CSS variables, dark mode overrides, elevation, radius, borders, utility classes, responsive rules, accessibility
- **`packages/ui/src/styles.css`** (295 lines): Design token CSS variables (light + dark), Tailwind @theme block
- **`packages/ui/src/tokens/tailwind-theme.css`** (42 lines): Maps CSS vars to Tailwind theme
- **PostCSS**: `@tailwindcss/postcss` plugin
- **Tailwind v4**: Using `@import "tailwindcss"` directive (no traditional config file)

### Testing

- **12 Vitest component tests** in `apps/web/components/*/__tests__/`
- **7 Vitest component tests** in `packages/ui/src/components/__tests__/`
- **3 E2E Playwright specs** in `apps/web/e2e/` (auth-workspace-chat, comprehensive, visual-snapshot)
- **6 root-level E2E Playwright specs** in `tests/e2e/` (auth, messaging, home, file-upload, navigation, search)
- **11 Storybook stories** (8 in `packages/ui`, 3 in `apps/web`)

### Theme System

- **CSS variable-based** with `html.dark` class toggle
- **Theme changer**: `packages/ui/src/components/theme-toggle.tsx` + `use-theme.ts` hook
- **1 locale file** (`en.json`, 338 keys) with `t()`, `tn()`, `formatDate()`, `formatNumber()` utilities

---

## 3. Structural Similarities

| Aspect                         | Similarity                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Core layout**                | Both: Team sidebar rail + channel sidebar + main content area + optional RHS panel                           |
| **Auth gate**                  | Both redirect unauthenticated users to login before workspace access                                         |
| **Component organization**     | Both group by domain (auth, channel, chat, workspace)                                                        |
| **CSS variables for theming**  | Both use `--center-channel-bg`, `--sidebar-bg`, `--button-bg`, etc. (current repo mirrors Mattermost naming) |
| **Channel/message model**      | Both have similar channel detail + message list + message input flow                                         |
| **RHS patterns**               | Both use right-hand panels for threads, search results, channel info                                         |
| **Online presence indicators** | Both use `--online-indicator`, `--away-indicator`, `--dnd-indicator` with similar RGB patterns               |

## 4. Structural Differences

| Aspect                | Mattermost (Reference)                  | Current Repo                                          |
| --------------------- | --------------------------------------- | ----------------------------------------------------- |
| **Framework**         | Custom React SPA (Webpack)              | Next.js 15 App Router                                 |
| **Build system**      | Makefile + npm                          | Turborepo + pnpm                                      |
| **Styling approach**  | Sass (93 partials) + CSS variables      | Tailwind v4 + CSS variables + design tokens           |
| **Component library** | ~490+ component directories             | ~57 component files total                             |
| **Design tokens**     | In-SCSS variables only                  | Formal `packages/ui/src/tokens/` package with 8 files |
| **i18n**              | 68 locale files                         | 1 locale file (English)                               |
| **Storybook**         | Not present                             | 11 stories configured                                 |
| **PWA**               | Not present                             | Full PWA with manifest + service worker + push        |
| **State management**  | Redux (mattermost-redux)                | React hooks + optimistic UI hook                      |
| **Admin console**     | Full 128-directory admin panel          | Single `/admin` page                                  |
| **Plugin system**     | Full plugin API + marketplace           | Not implemented                                       |
| **Test count**        | ~100+ unit + 50 Cypress + 37 Playwright | 19 Vitest + 9 Playwright specs                        |
| **Virtualized list**  | `DynamicVirtualizedList` component      | `@tanstack/react-virtual` in `message-list.tsx`       |
| **Rendering cost**    | Heavier (Redux + many components)       | Lighter (hooks + fewer abstractions)                  |

## 5. Major User-Facing Areas

| Area                     | Current Repo Implementation                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| **Authentication**       | Magic link + OAuth (Google/GitHub) + email verification                           |
| **Workspace management** | Create/join workspaces, workspace list                                            |
| **Channel management**   | Create channel, channel list, channel info, channel bookmarks, channel mute       |
| **Messaging**            | Send/edit/delete/forward messages, threaded replies, reactions, pin, flag         |
| **Search**               | Full-text search with filters, autocomplete, file-type toggle                     |
| **User presence**        | Online/away/dnd status, custom status with emoji + duration                       |
| **Notifications**        | In-app + push (VAPID) + notification sounds (9 options) + per-channel preferences |
| **Settings**             | Theme toggle, notification preferences, auto-responder                            |
| **Admin**                | User role management, CSV import/export, billing                                  |
| **Media**                | WebRTC (LiveKit) audio/video rooms                                                |
| **PWA**                  | Install prompt, service worker, push notifications                                |

## 6. Likely Fragile or High-Churn UI Areas

| Area                                   | Risk                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`message-input.tsx`** (1347 lines)   | Largest component, likely to be fragile — high complexity, many features (TipTap, slash commands, emoji, scheduling, AI rewrite, formatting, paste, drag-and-drop) |
| **`chat-view.tsx`** (893 lines)        | Second-largest, orchestrates MessageList + MessageInput + ThreadPanel + SearchBar + ChannelInfo — integration surface is large                                     |
| **`message-item.tsx`** (528 lines)     | Renders every message, many interaction modes (edit, reaction, reply, flag, context menu)                                                                          |
| **`app-sidebar.tsx`**                  | Drag-and-drop categories/channels, keyboard reorder, mobile/responsive, channel CRUD                                                                               |
| **`workspace layout.tsx`** (397 lines) | Responsive shell with resize, swipe-back, keyboard shortcuts, mobile nav — layout issues affect all pages                                                          |
| **`emoji-picker.tsx`** (402 lines)     | Complex state (categories, skin tones, recent, search, keyboard nav)                                                                                               |
| **`formatting-bar.tsx`**               | Inline URL input form, aria-pressed states — small blast radius but actively used                                                                                  |
| **`code-block.tsx`**                   | Syntax highlighting with highlight.js — language detection, copy button                                                                                            |
| **`thread-panel.tsx`**                 | Thread reply reactions, reply input — real-time dependency                                                                                                         |

## 7. Unknowns for Later Phases

- **Actual runtime performance** of message-list virtualization with 10k+ messages
- **Keyboard shortcut discoverability** for end users
- **Mobile gesture conflicts** (swipe-back vs swipe-to-react)
- **Accessibility compliance gaps** beyond what is visible in code review
- **Error recovery paths** for all failure modes (socket disconnect, API 500, stale auth)
- **Dark mode color contrast** validation against WCAG AA/AAA for custom status indicators
- **Loading state coverage** for every async operation
- **Screen reader behavior** for real-time message insertion, reaction toggles, thread panel
- **Internationalization readiness** of date/number formatting across timezones
