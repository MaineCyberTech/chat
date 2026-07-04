# Principal Audit Report

- Prompt: **ux_ui_master**
- Domain: **uxui**
- Run ID: **ux_ui_master_20260703_055959**
- Generated: **2026-07-03T06:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **2**
- P2: **3**, P3: **0**
- Readiness: **0.00**

## Findings

### P0 — Dark mode CSS only uses @media (prefers-color-scheme: dark) but no .dark class selector

- **File:** `packages/ui/src/styles.css`
- **Category:** Design System
- **Impact:** ThemeProvider applies .dark class on manual toggle, but CSS never matches it. Manual light/dark selection is completely broken - app always follows OS preference.
- **Fix:** Add .dark and :root:not(.light) selectors alongside the media query to support class-based theme switching

### P1 — Thread replies lack edit, delete, and reaction support

- **File:** `apps/web/components/chat/thread-panel.tsx`
- **Category:** Chat UX
- **Impact:** Users cannot edit or delete their thread replies, and cannot react to thread replies. Major UX gap compared to primary message thread.
- **Fix:** Add edit/delete actions (same pattern as message-list.tsx) and reaction support to thread panel

### P1 — No per-user online/offline presence indicators

- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** Presence
- **Impact:** Users cannot see who is currently online. Only an aggregate 'N online' count is shown in the channel header.
- **Fix:** Implement per-user green dot indicators next to user names in message list and member panels

### P2 — No member list or member management UI in frontend

- **File:** `apps/web/app/(workspace)/`
- **Category:** Social
- **Impact:** Users cannot view workspace/channel members, see roles, or invite/remove members from the UI.
- **Fix:** Create a members page and member management components

### P2 — No profile editing beyond avatar upload

- **File:** `apps/web/components/auth/avatar-upload.tsx`
- **Category:** Profile
- **Impact:** Users cannot change display name, status, or bio. Display name is auto-generated from email prefix.
- **Fix:** Add profile editing modal/page with display name, status message, and bio fields

### P2 — Dialog and sidebar-group use raw Unicode icons instead of lucide-react icons

- **File:** `packages/ui/src/components/dialog.tsx`
- **Category:** Visual Consistency
- **Impact:** Inconsistent visual style - most of the app uses lucide-react icons, but dialog close is '✕' and sidebar-group chevron is '▸'.
- **Fix:** Replace Unicode icons with lucide-react X and ChevronRight components
