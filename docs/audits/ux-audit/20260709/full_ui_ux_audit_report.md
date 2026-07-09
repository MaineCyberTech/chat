# UI/UX Deep Dive Audit Report

**Run Date:** July 9, 2026
**Application:** MaineCyberTech Chat (collaboration/chat platform)
**Repository:** `C:\temp\chat`

---

## 1. Product Understanding

- **Product Type**: Real-time collaboration/chat platform (Mattermost/Slack/Teams-style)
- **Target Users**: Teams and organizations needing secure internal communication
- **Core Workflows**: Send messages, manage channels, collaborate in threads, search conversations, admin
- **User Roles**: Owner, Admin, Member (3 roles with 18 granular permissions)
- **Auth**: Magic link + Google/GitHub OAuth + email/password
- **Design**: Desktop-first with mobile responsive adaptation
- **Critical UX Surfaces**: Message composer, channel sidebar, thread panel, search, admin panel

---

## 2. Repository UI Architecture

| Area | Observed Structure | Strengths | Risks | Recommendations |
|------|-------------------|-----------|-------|-----------------|
| Framework | Next.js 15 App Router + Express + Socket.io | Modern, fast, SSR-capable | Client/server component complexity | — |
| Routing | Route groups `(auth)` and `(workspace)`; catch-all `[workspaceSlug]` | Clean separation; typed params | — | — |
| Components | Domain-organized under `apps/web/components/` + 9 shared `@chat/ui` | Consistent naming; Storybook for UI package | Web app doesn't use Badge from shared package | Audit all imports from `@chat/ui` |
| Layout | CSS Grid root + Flex sidebar/content; TeamSidebar rail + AppSidebar + content | Resizable sidebar; multi-team rail | Overflow hidden on flex container clips children; double backdrop on mobile | Fix overflow clipping; remove duplicate backdrop |
| Styling | Tailwind v4 `@theme` + CSS variables | Design tokens well-defined | Two competing CSS variable namespaces; triple-defined radii | Consolidate to single system |
| Design tokens | 8 token files in `@chat/ui/tokens/` | Comprehensive (colors, spacing, typography, motion, borders, focus) | Tailwind theme mapping duplicates some token definitions | Single source of truth |
| State | React Context (auth + theme) + direct API calls + Socket.io | Lightweight, no Redux overhead | No server state management client library | Acceptable for current scale |
| Testing | Vitest (32 files) + Playwright (8 E2E) + Storybook (11 stories) | Good foundation | No focus trap tests, no keyboard nav tests, no viewport matrix tests | Add recommended E2E test suite |
| Accessibility | Storybook a11y addon, reduced-motion, aria-labels on icon buttons | Good basics | Focus traps missing in 5+ dialogs; hover-reveal not keyboard accessible; low contrast | See accessibility audit |

---

## 3. Route and Surface Inventory

| Route/Surface | Purpose | User Role | Main CTA | UX Risk | Notes |
|---------------|---------|-----------|----------|:-------:|-------|
| `/` | Landing/workspace redirect | All | Select workspace | Low | Skeleton loading state |
| `/login` | Auth | Unauthenticated | Sign in / Send magic link | Low | Clean but raw Supabase errors |
| `/auth/callback` | OAuth handler | Unauthenticated | — | Medium | Complex PKCE + hash flow |
| `/auth/verify` | Email verification | Unauthenticated | Resend verification | Low | Raw error messages |
| `/[slug]` | Channel listing | Member | Select channel | Low | Empty state good |
| `/[slug]/[channelId]` | Chat view | Member | Type + send message | **High** | Core surface; iOS keyboard P0 |
| `/[slug]/threads` | Threaded conversations | Member | Reply | Medium | Textarea not TipTap (P2) |
| `/[slug]/search` | Search messages/files | Member | Search query | Medium | Author search requires UUID |
| `/[slug]/settings` | User preferences | Member | Save preferences | Medium | No live theme preview; no per-channel search |
| `/[slug]/saved` | Bookmarked messages | Member | — | Low | Uses spinner instead of skeleton |
| `/[slug]/scheduled` | Scheduled posts | Member | — | Low | No user-facing error on cancel failure |
| `/[slug]/groups` | User groups | Member | Create/edit/delete groups | Low | Card layout good |
| `/[slug]/admin` | Admin panel | Admin | Manage users/export/import | **High** | No user role editing; sidebar not responsive on mobile |
| `/pl/[postId]` | Message permalink | Member | View | Low | — |
| Quick Switcher (Ctrl+K) | Channel/user search (modal) | Member | Navigate | Medium | No focus trap (P1); no fuzzy search |
| Emoji Picker | Emoji selection (modal) | Member | Select emoji | Medium | No focus trap (P1); overflows <340px screens |
| Thread Panel | Threaded replies (RHS panel) | Member | Reply | Medium | Textarea not TipTap (P2); no reactions |
| Channel Info | Channel info (RHS panel) | Member | View members/pins | Low | Empty states lack guidance |
| Delete Dialog | Message deletion (modal) | Member | Confirm delete | Low | Custom dialog duplicates shared component |

---

## 4. UX Scorecard

| Category | Score | Rationale | Priority |
|----------|:-----:|-----------|:--------:|
| Visual Design | 7 | Good design token system; triple-defined radii and competing CSS vars create inconsistency | Medium |
| Layout Consistency | 7 | Clean grid/flex layout; overflow clipping on flex container; double mobile backdrop | Medium |
| Formatting Quality | 8 | Consistent component shapes; good use of design tokens | Low |
| Mobile UX | 5 | **Critical**: iOS keyboard hides input; safe area gaps; touch targets below minimum | **High** |
| Tablet UX | 7 | Sidebar auto-collapse works but user toggle not sticky; admin nav not responsive | Medium |
| Desktop UX | 8 | Full feature set; good use of screen real estate | Low |
| Navigation | 7 | Multi-team rail; sidebar categories; bottom nav | Medium |
| Forms | 7 | Good login form; missing inline validation on blur; no form wrapper on message input | Medium |
| Interaction Design | 7 | Rich TipTap editor; emoji picker; file preview; formatting toolbar uses window.prompt | Medium |
| Accessibility | 5 | **Critical**: Focus traps missing; hover-reveal not accessible; low contrast secondary text | **High** |
| Customization | 7 | Theme toggle; notification prefs; sidebar resize | Low |
| Theme Support | 5 | **Critical**: Dark mode broken when user-selected (not system) | **High** |
| Data Display | 6 | No virtualization in message list; inconsistent date formatting | Medium |
| Admin UX | 6 | No user role editing; no CSV preview; sidebar not responsive | Medium |
| Search and Discovery | 7 | Operators; autocomplete; date filters; good result highlighting | Low |
| Onboarding | 7 | 5-step tour; task list; localStorage-only progress (not synced) | Low |
| Error/Empty/Loading States | 8 | Comprehensive skeleton patterns; error boundaries; recovery actions | Low |
| Performance UX | 6 | No message list virtualization; reactions fetched per-message for batches | Medium |
| Design System Maturity | 7 | Comprehensive tokens; two conflicting namespaces; good component library | Medium |
| Enterprise Readiness | 6 | Missing a11y compliance; mobile UX gaps; no role editing in admin | Medium |
| **Overall UX Maturity** | **7** | Solid foundation; ~50 findings to address for enterprise readiness | — |

---

## 5. Critical P0 Findings

| ID | Category | Finding | Location | Complexity |
|----|----------|---------|----------|:----------:|
| UX-009 | Mobile | iOS keyboard hides message input — no VisualViewport API | `message-input.tsx` | S |

## 6. High Priority P1 Findings

| ID | Category | Finding | Location | Complexity |
|----|----------|---------|----------|:----------:|
| UX-001 | Theme | Dark mode CSS variables not defined (no .dark overrides) | `globals.css` | XS |
| UX-002 | Theme | Theme toggle uses .dark class but dark theme uses media query | `use-theme.tsx` + `styles.css` | S |
| UX-006 | A11y/Mobile | Bottom nav lacks safe area bottom padding | `layout.tsx` | XS |
| UX-007 | A11y/Mobile | Mobile header lacks safe area top padding | `layout.tsx` | XS |
| UX-008 | A11y/Mobile | Landscape nav height 40px below 44px minimum | `globals.css` | XS |
| UX-010 | A11y | Quick Switcher has no focus trap | `quick-switcher.tsx` | S |
| UX-011 | A11y | Emoji Picker has no focus trap | `emoji-picker.tsx` | S |
| UX-012 | A11y | Hover-reveal action buttons not keyboard accessible | `globals.css` + `message-item.tsx` | S |
| UX-013 | A11y | Formatting toolbar buttons lack aria-pressed | `formatting-bar.tsx` | XS |
| UX-014 | A11y | ProfilePopover has no focus management | `profile-popover.tsx` | S |
| UX-015 | A11y | ContextMenu has no focus management | `context-menu.tsx` | S |
| UX-016 | Contrast | foreground.muted (#a3a3a3) fails WCAG AA (2.7:1) | `semantic-colors.ts` | S |
| UX-017 | Contrast | rgba(..., 0.56) pattern fails WCAG AA (~3.2:1) | 20+ files | M |
| UX-018 | i18n | i18n t() function never imported or used anywhere | All components | XL |

## 7. Medium Priority P2 Findings

| ID | Category | Finding | Location | Complexity |
|----|----------|---------|----------|:----------:|
| UX-003 | Visual Design | Triple-defined radius values | `globals.css` + `styles.css` + `tailwind-theme.css` | M |
| UX-004 | Layout | No centralized z-index system | 20+ files | S |
| UX-005 | Theme | Hardcoded #fff in 5+ files | `search/page.tsx`, `admin/page.tsx`, etc. | XS |
| UX-019 | Admin | No user role management in admin | `admin/page.tsx` | M |
| UX-020 | Admin | No CSV validation before import | `admin/page.tsx` | S |
| UX-021 | Data Display | No message list virtualization | `message-list.tsx` | L |
| UX-022 | Interaction | window.prompt() for link/image URLs | `formatting-bar.tsx` | S |
| UX-023 | A11y | Category drag-and-drop no keyboard alternative | `app-sidebar.tsx` | M |
| UX-024 | A11y | Channel drag-and-drop no keyboard alternative | `channel-list.tsx` | M |
| UX-025 | A11y | Resizable sidebar mouse-only | `layout.tsx` | S |
| UX-026 | Design System | DeleteDialog duplicates shared Dialog | `delete-dialog.tsx` | M |
| UX-027 | Mobile | Double backdrop overlay on mobile sidebar | `layout.tsx` + `app-sidebar.tsx` | XS |
| UX-036 | Message Actions | Forward action missing from context menu | `context-menu.tsx` | S |
| UX-037 | Message Actions | Pin action missing from context menu | `context-menu.tsx` | S |
| UX-035 | Thread Panel | No reactions on thread replies | `thread-panel.tsx` | M |
| UX-034 | Thread Panel | Reply uses textarea, not TipTap | `thread-panel.tsx` | M |
| UX-039 | Mobile | Channel sidebar items 32px below touch target | `channel-list.tsx` | S |
| UX-040 | Mobile | Multiple icon buttons below 44px minimum | 8+ components | M |
| UX-041 | Mobile | Context menu overflows viewport | `channel-list.tsx` | S |
| UX-042 | Layout | overflow:hidden clips child elements | `layout.tsx` | S |
| UX-043 | Theme | Hardcoded black shadow not theme-aware | `floating-timestamp.tsx` | XS |
| UX-044 | Theme | Thread/channel info hardcoded shadow | `chat-view.tsx` | XS |
| UX-045 | Visual Design | Avatar no onError handler | `avatar.tsx` | XS |
| UX-046 | A11y | "Jump to" div as button no keyboard handling | `app-sidebar.tsx` | XS |
| UX-047 | A11y | Category rename only via double-click | `app-sidebar.tsx` | XS |
| UX-048 | A11y | Delete channel visible only on hover | `channel-list.tsx` | XS |
| UX-049 | i18n | Raw Supabase errors displayed to users | Auth components | S |

## 8. Low Priority P3 Findings

| ID | Category | Finding | Location | Complexity |
|----|----------|---------|----------|:----------:|
| UX-028 | Performance | Per-message reaction fetch for batches | `message-item.tsx` | M |
| UX-029 | Data Display | Inconsistent date formatting | Multiple files | M |
| UX-030 | Notifications | No "Mark all read" | `notification-bell.tsx` | S |
| UX-031 | Notifications | Error silently logged on save failure | `notification-preferences-modal.tsx` | XS |
| UX-032 | Status | Status emoji "??" never selectable | `status-modal.tsx` | S |
| UX-033 | Onboarding | Onboarding progress not synced to server | `onboarding-tour.tsx` | S |
| UX-038 | Message Input | No character count indicator | `message-input.tsx` | S |
| UX-050 | Content | Empty states lack actionable microcopy | `channel-info.tsx` | XS |

---

## 9. Collaboration UX Deep Dive

| Area | Current Experience | Issue | Severity | Recommendation |
|------|-------------------|-------|:--------:|----------------|
| Message composer | TipTap editor, 15 formatting buttons, slash commands, emoji picker, paste images | Formatting toolbar uses window.prompt() for URLs | P2 | Replace with inline URL input |
| Message list | Relatively flat map; reactions; actions; floating timestamps | No virtualization; hover-reveal not keyboard accessible | P1/P2 | Virtualize; fix keyboard access |
| Thread panel | Collapsible replies; typing indicators; edit/delete | Basic textarea; no reactions; no follow | P2/P3 | TipTap in threads; add reactions |
| Search | Operators; autocomplete; date filters; type toggle | Author filter requires UUID; no fuzzy search | P3 | User autocomplete; fuzzy search |
| Notifications | Bell badge; channel prefs; global settings; 9 sounds | No mark-all-read; not clickable; no push | P3 | Mark-all-read; click to navigate; push |
| Workspace navigation | Multi-team rail; sidebar categories; drag-and-drop | Drag not touch/accessible; no mobile team switcher | P2 | Touch drag; keyboard reorder; mobile switcher |
| File preview | Full-screen viewer; zoom; pan; prev/next; metadata | No image rotation; no scroll-wheel zoom | P3 | Rotation; +/- keyboard shortcuts |
| Profile popover | Avatar click → positioned popover | No status; join date "Unknown"; no DM/call | P3 | Fetch join date; add status; add actions |
| Quick switcher | Ctrl+K; channel+user search; keyboard nav | No focus trap; no fuzzy; no recent channels | P1/P3 | Focus trap; fuzzy; recent section |
| Keyboard shortcuts | Modal with categories; Ctrl+K; arrow nav | No shortcut customization | P3 | Customizable shortcuts |
| Responsive/mobile | Bottom nav; overlay sidebar; swipe-back | Keyboard hides input; safe area gaps; touch targets | P0/P1/P2 | VisualViewport; safe areas; target audit |

## Strengths (Exceeding Mattermost/Slack)
- AI Rewrite (5 actions: fix-spelling, shorter, formal, concise, friendly)
- Message Scheduling (3 presets + custom datetime)
- Priority System (standard/important/urgent/critical with badges)
- Optimistic UI with retry on failure
- 3357 emoji picker with 11 categories + 5 skin tones
- Code blocks with highlight.js + copy button
- Resizable sidebar persisted to localStorage
- Trigger words CRUD
