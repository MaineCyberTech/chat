# Frontend Release Gate Report

- Prompt: **frontend_accessibility_release_audit**
- Domain: **frontend**
- Run ID: **frontend_accessibility_release_audit_20260703_054840**
- Generated: **2026-07-03T01:44:57Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **2**, P3: **1**
- Readiness: **80.00**

## Findings

### P1 — Message log uses aria-live='polite' instead of 'assertive' for real-time chat
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** screen_reader
- **Impact:** Screen readers may delay or omit announcing new messages in a high-velocity real-time chat context, causing users to miss incoming content.
- **Fix:** Change aria-live to 'assertive' or use a dedicated live region that flips between 'polite' and 'off' to prevent excessive queuing.

### P1 — Password input missing autocomplete attribute for password manager compatibility
- **File:** `apps/web/components/auth/login-form.tsx`
- **Category:** keyboard_navigation
- **Impact:** Users relying on password managers cannot auto-fill credentials, creating a barrier for sign-in on repeat visits.
- **Fix:** Add autocomplete='current-password' to the password input in sign-in mode and autocomplete='new-password' in sign-up mode.

### P2 — Keyboard shortcuts dialog does not return focus to the triggering element on close
- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** focus_management
- **Impact:** Keyboard and screen reader users lose their place in the document after dismissing the shortcuts dialog.
- **Fix:** Store the previously focused element in a ref before opening and call .focus() on it when the dialog closes.

### P2 — Notification menu does not programmatically focus the first item when opened
- **File:** `apps/web/components/notifications/notification-bell.tsx`
- **Category:** focus_management
- **Impact:** Keyboard users must tab through the entire document to reach the notification list.
- **Fix:** After setting open=true, use requestAnimationFrame to call menuRef.current.querySelector('button, [href]')?.focus().

### P3 — Auth loading spinner uses raw Tailwind class border-foreground instead of CSS custom property
- **File:** `apps/web/app/(auth)/loading.tsx`
- **Category:** screen_reader
- **Impact:** The border-foreground class may not respect dark mode theme if not mapped to a CSS variable, reducing visual consistency.
- **Fix:** Replace border-foreground with border-[var(--color-border-primary)] and border-t-transparent to match the rest of the codebase.
