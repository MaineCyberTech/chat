# UI/UX Phase 1 — Frontend Inventory and Structural Baseline

## 1. Frontend Inventory — Reference Repo (`mainecybertech-portal`)

### App Shell & Layout

- **Root layout**: `app/layout.tsx` — Inter + Orbitron fonts, dark cyber theme (`#0A1118` base), radial gradient backgrounds
- **Route groups**: `(admin)`, `(portal)`, `(public)`, `auth/`
- **Portal layout**: `app/(portal)/layout.tsx` — server component with org branding, logo, header with NotificationBell, PortalHeaderActions, OrgSwitcher, PortalGlobalSearch
- **Admin layout**: server component with admin navigation shell

### Design System

- **Custom design tokens** in `globals.css`: 25+ utility classes (`cyber-page-bg`, `glass-card`, `cyber-heading`, `cyber-button`, `cyber-input`, `cyber-pill`, etc.)
- **No shared UI package** — all styles are inline Tailwind utilities
- **Icons**: lucide-react library
- **Fonts**: Inter (body) + Orbitron (headings) via next/font/google

### Pages (by route group)

- `(portal)/` — dashboard, billing, documents/[documentId], notifications/preferences, profile, projects/[projectId], support/[ticketId], timeline
- `(admin)/` — admin documents, users, organizations, tickets, roles, webhooks, branding
- `(public)/` — marketing landing pages
- `auth/` — login with magic link

### Components

- **admin/** — 18 components (AdminDocumentsCenterClient 93KB, AdminTicketCenterClient 30KB, AdminUsersClient, etc.)
- **portal/** — 12 components (PortalDocumentsCenterClient 15KB, SupportCenterClient 11KB, PortalGlobalSearch, etc.)
- **marketing/** — 4 components (ContactForm, MarketingHeader, ParticleBackground, ServiceCard)
- **Root**: CommentBody, DocumentPreview, EmptyState, HealthDashboardClient, NotificationBell (12KB), NotificationsPageClient (8KB)

### State & Data Flow

- `lib/api.ts` — Server-side API client (fetcher pattern)
- `lib/client-api.ts` — Client-side API calls
- `lib/auth/` — admin.ts, auth-actions.ts, membership.ts
- Server-side auth in portal layout (redirects on no membership)
- React Server Components for data fetching

### Forms

- Custom inline form components (no shared form library)
- Org branding form, bulk invite form, webhook form, profile form
- Validation via server-side Zod

### Loading/Empty/Error States

- `loading.tsx` files per route group
- Skeleton-style loading via inline Tailwind
- EmptyState component

---

## 2. Frontend Inventory — Current Repo (`chat`)

### App Shell & Layout

- **Root layout**: `app/layout.tsx` — system-ui font stack, AuthProvider wrapper, AppHeader
- **Route groups**: `(auth)`, `(workspace)`
- **Workspace layout**: `app/(workspace)/layout.tsx` — client component, auth guard (redirects to /login), h-screen flex with AppSidebar + main
- **No admin, no public/marketing route groups**

### Design System

- **Minimal CSS**: `app/globals.css` — 30 lines, dark mode via `prefers-color-scheme`, system-ui font stack
- **Shared UI package**: `packages/ui/` with 7 components (Button, Avatar, Input, Badge, Skeleton, Dialog, SidebarGroup)
- **No custom design tokens** — all Tailwind utility classes
- **Icons**: inline Unicode symbols (↩, ✎, ✕, 📎)
- **Fonts**: system-ui stack only

### Pages (by route group)

- **Root** (`/`): `page.tsx` — auth-aware landing shell (redirects to workspace if logged in, shows LandingShell if not)
- **(workspace)/[workspaceSlug]/**: workspace home page (welcome state + create channel)
- **(workspace)/[workspaceSlug]/[channelId]/**: channel page → ChatView component
- **Auth**: login page with magic link form

### Components

- **auth/** — auth-context.tsx (69 lines), login-form.tsx (57 lines), (1 test)
- **workspace/** — app-sidebar.tsx (119 lines), workspace-list.tsx (53 lines), create-workspace-dialog.tsx (86 lines), (2 tests)
- **channel/** — channel-list.tsx (60 lines), create-channel-dialog.tsx (78 lines)
- **chat/** — chat-view.tsx (223 lines), message-list.tsx (142 lines), message-input.tsx (107 lines), search-bar.tsx (87 lines), (3 tests)
- **home/** — landing-shell.tsx (30 lines), (1 test)
- **Root**: app-header.tsx (35 lines)

### State & Data Flow

- `lib/supabase/client.ts` — Supabase browser client singleton
- `lib/api.ts` — Client-side API helper with JWT token injection, 401 handling
- `lib/socket.ts` — Socket.io client singleton with reconnection
- `lib/sentry.ts` — Sentry initialization
- `lib/env.ts` — Environment variable access
- Client-side auth via React context (`auth-context.tsx`)
- No server components — all client components

### Forms

- Magic link login form (email only)
- Create workspace dialog (name + submit)
- Create channel dialog (name + topic + submit)
- Message input (textarea + file upload)
- No shared form validation library

### Loading/Empty/Error States

- Skeleton components from shared UI package
- Inline loading states with "Loading..." text
- Error states with inline messages
- Empty states with descriptive text + CTA

---

## 3. Structural Similarities

| Aspect            | Reference                           | Current                      |
| ----------------- | ----------------------------------- | ---------------------------- |
| Framework         | Next.js 15                          | Next.js 15                   |
| Styling           | Tailwind CSS                        | Tailwind CSS (v4)            |
| Auth              | Supabase magic link                 | Supabase magic link          |
| Font loading      | next/font/google (Inter + Orbitron) | System-ui stack              |
| Client components | Use client for interactivity        | Use client for interactivity |
| Route groups      | (admin), (portal), (public), auth   | (auth), (workspace)          |
| Dialog pattern    | Custom modal overlays               | Shared Dialog component      |
| API calls         | lib/api.ts fetch wrapper            | lib/api.ts fetch wrapper     |
| Dark mode         | Always dark                         | System preference            |

---

## 4. Structural Differences

| Dimension          | Reference                                                  | Current                                          |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------ |
| **Theme**          | Dark-only cyber aesthetic (#0A1118 base, emerald accents)  | Light/dark via system preference                 |
| **Design tokens**  | 25 custom utility classes (glass-card, cyber-\*)           | No custom tokens — pure Tailwind                 |
| **Shared UI**      | None (all inline)                                          | 7 components in packages/ui/                     |
| **Icons**          | lucide-react icons                                         | Unicode symbols (↩, ✎, ✕, 📎)                    |
| **Fonts**          | Inter + Orbitron (Google Fonts)                            | System-ui stack                                  |
| **Components**     | Portal (20 admin + 12 portal + 4 marketing + 6 root = ~42) | Chat-focused (5 groups, ~17 components total)    |
| **Layout model**   | Server components + async data fetching                    | All client components                            |
| **Auth gating**    | Server-side redirect in layout                             | Client-side redirect in layout                   |
| **Loading states** | loading.tsx per route                                      | Inline useState + Skeleton                       |
| **Forms**          | Custom inline with server validation                       | Input component + inline validation              |
| **Search**         | PortalGlobalSearch (full portal search)                    | SearchBar (message search only)                  |
| **Navigation**     | Header + OrgSwitcher + sub-nav tabs                        | Sidebar + workspace/channel lists                |
| **Responsiveness** | Responsive grid with sm/lg breakpoints                     | Not visible in current components                |
| **Accessibility**  | aria attributes in some components                         | role="dialog", aria-modal, focus-visible rings   |
| **Test structure** | Jest unit tests per component                              | Vitest tests co-located (7 component test files) |

---

## 5. Major User-Facing Areas

### Current Repo

| Area           | Path                  | Key Component       | Description                                                 |
| -------------- | --------------------- | ------------------- | ----------------------------------------------------------- |
| Landing/home   | `/`                   | LandingShell        | Unauthenticated landing with Get Started + Learn More       |
| Login          | `/login`              | LoginForm           | Magic link email form                                       |
| Workspace home | `/[slug]`             | WorkspacePageClient | Welcome state, channel list, create channel                 |
| Channel view   | `/[slug]/[channelId]` | ChatView            | Real-time messaging, search, typing indicators, file upload |
| Sidebar        | All workspace pages   | AppSidebar          | User info, workspace list, channel list, create dialogs     |
| App header     | All pages             | AppHeader           | Email display, logout (logged-in only)                      |

### Reference Repo

| Area             | Path                             | Description                         |
| ---------------- | -------------------------------- | ----------------------------------- |
| Public landing   | `/` (public)                     | Marketing home page                 |
| Login            | `/login`                         | Auth page                           |
| Portal dashboard | `/portal/dashboard`              | Aggregated project/ticket view      |
| Projects         | `/portal/projects/[projectId]`   | Project task list with timeline     |
| Support/tickets  | `/portal/support/[ticketId]`     | Ticket view with comments           |
| Documents        | `/portal/documents/[documentId]` | Document viewer with versioning     |
| Billing          | `/portal/billing`                | Stripe subscription management      |
| Admin center     | `/admin/`                        | User/org/ticket/document management |
| Notifications    | `/portal/notifications`          | In-app notifications + preferences  |

---

## 6. Likely Fragile or High-Churn UI Areas

### Current Repo

| Area                                                                      | Why Fragile                                                                                                                   |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `chat-view.tsx` (223 lines)                                               | Core real-time component — Socket.io event handling, state management, file upload, reply/typing — most complex frontend file |
| `message-list.tsx` (142 lines)                                            | Inline editing mode, reply/delete/edit hover actions, message grouping                                                        |
| `app-sidebar.tsx` (119 lines)                                             | Multiple API calls, workspace/channel refresh keys, conditional rendering                                                     |
| `auth-context.tsx`                                                        | Single source of truth for auth state — any regression breaks the entire app                                                  |
| **None of these use a state management library** — all useState/useEffect | Risk of stale state, race conditions, complex re-renders                                                                      |

### Reference Repo

| Area                                    | Why Fragile                                          |
| --------------------------------------- | ---------------------------------------------------- |
| `AdminDocumentsCenterClient.tsx` (93KB) | Extremely large single file — impossible to maintain |
| `AdminTicketCenterClient.tsx` (30KB)    | Same issue — god component                           |
| `ProjectTaskListV5.tsx` (30KB)          | Complex project management UI                        |
| `NotificationBell.tsx` (12KB)           | Real-time notification polling                       |

---

## 7. Unknowns for Later Phases

| Unknown                                                     | Why                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Actual color palette / design tokens used across components | No design token system in current repo (only inline Tailwind classes)                 |
| Responsive breakpoint handling                              | Current components don't show mobile-specific layouts                                 |
| Keyboard navigation completeness                            | Need to test all interactive elements                                                 |
| Screen reader compatibility                                 | Need to audit aria labels, roles, live regions                                        |
| Focus management in dialogs                                 | Need to check trap focus inside Dialog component                                      |
| Form validation UX                                          | Current forms have basic error display — no debounced validation, no success feedback |
| Real-time message ordering                                  | Need to verify insertion order is correct (server timestamp vs client time)           |
| File upload progress                                        | Current upload has no progress indicator                                              |
