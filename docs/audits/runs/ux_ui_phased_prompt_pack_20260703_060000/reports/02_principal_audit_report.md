# Principal Audit Report

- Prompt: **ux_ui_phased_prompt_pack**
- Domain: **uxui**
- Run ID: **ux_ui_phased_prompt_pack_20260703_060000**
- Generated: **2026-07-03T06:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **2**
- P2: **3**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — User theme preference (light/dark manual toggle) has no CSS selector - .dark class never matched

- **File:** `packages/ui/src/styles.css`
- **Category:** Design System
- **Impact:** Theme toggle cycles modes but has zero visual effect. All theme CSS is inside @media (prefers-color-scheme: dark) only. Phase 1 (design system foundations) is incomplete.
- **Fix:** Add .dark and :root:not(.light) selectors alongside the media query

### P1 — No member list, invite, or member management UI exists in the frontend

- **File:** `apps/web/app/(workspace)/`
- **Category:** Social
- **Impact:** Phase 3 (channel/chat surfaces) and Phase 4 (search/profile/settings) are incomplete. Users cannot discover workspace members or manage access.
- **Fix:** Create /members route page with member list, role display, role management, and invite flow

### P1 — No profile editing for display name, status, or bio - only avatar upload available

- **File:** `apps/web/components/auth/avatar-upload.tsx`
- **Category:** Profile
- **Impact:** Phase 4 (profile surfaces) is incomplete. Display name is auto-derived from email, cannot be changed. User identity is permanently tied to email prefix.
- **Fix:** Create profile settings page with editable display name, status message, and bio fields

### P2 — No route-group-specific not-found.tsx pages for (workspace) or (auth) route groups

- **File:** `apps/web/app/(workspace)/`
- **Category:** Error Handling
- **Impact:** Invalid workspace slugs or channel IDs show simple inline text ('Channel not found') instead of proper 404 UX with navigation options. Only root not-found.tsx exists.
- **Fix:** Add not-found.tsx to (workspace) and (auth) route groups with relevant navigation links

### P2 — Settings page only has appearance and notification preferences - no account, profile, workspace, or channel settings

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Settings
- **Impact:** Phase 4 (settings surfaces) is incomplete. Users cannot change password, manage workspaces, configure channel defaults, or manage billing.
- **Fix:** Expand settings with account section (profile, password), workspace section (name, slug, avatar), and channel defaults

### P2 — Ctrl+1-9 workspace switching listed in keyboard shortcut help but not implemented in the handler

- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** Keyboard
- **Impact:** Misleading help dialog shows shortcuts that do nothing. Phase 5 (interaction polish) incomplete.
- **Fix:** Either implement workspace switching shortcuts or remove them from the help dialog

### P3 — Keyboard shortcuts not discoverable - no '?' hint or shortcut icon visible in any UI element

- **File:** `apps/web/app/(workspace)/layout.tsx`
- **Category:** Keyboard
- **Impact:** Users may never discover the keyboard shortcut dialog exists. Phase 5 (interaction polish) could improve here.
- **Fix:** Add a small '?' button or keyboard icon to the app header or sidebar footer that opens the shortcuts dialog
