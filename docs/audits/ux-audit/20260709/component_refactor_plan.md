# Component Refactoring Plan

## Phase 1: Consolidate Duplicates (Days 1-3)

### DeleteDialog → Shared Dialog

**Current**: `apps/web/components/chat/message-list/delete-dialog.tsx` — custom dialog with its own focus trap, hardcoded `rgba(0,0,0,0.5)` overlay, and hardcoded English strings.

**Target**: Use `Dialog` from `@chat/ui`:

```tsx
<Dialog open={open} onClose={onClose}>
  <DialogTitle>Delete message?</DialogTitle>
  <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
  <div className="flex justify-end gap-2">
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
  </div>
</Dialog>
```

Remove: `delete-dialog.tsx`, `delete-dialog.stories.tsx`

### Inline Modals in MessageInput → Shared Dialog

**Current**: `message-input.tsx` lines 1232-1330 — @everyone warning and priority warning use hand-rolled fixed overlays.

**Target**: Refactor both to use `Dialog` from `@chat/ui` with custom body content.

---

## Phase 2: Complete Component States (Days 4-7)

### Button Loading State

Add `loading` prop:

```tsx
<Button loading>Send</Button>  // Shows spinner, disables interaction
```

Update `button.tsx`:
```diff
+ interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
+   loading?: boolean;
+ }

+ {loading && <Spinner size="sm" className="mr-2" />}
+ {!loading && children}
```

### Avatar Error Fallback

```tsx
const [imgError, setImgError] = useState(false);

{src && !imgError ? (
  <img src={src} alt={alt} onError={() => setImgError(true)} />
) : (
  <span className="avatar-initials">{initials}</span>
)}
```

---

## Phase 3: CSS Variable Migration (Days 8-14)

### Replace Hardcoded `#fff`

5 files with `color: "#fff"` on button backgrounds → replace with `color: "var(--button-color)"`:
- `search/page.tsx:154`
- `admin/page.tsx:506`
- `user-picker-modal.tsx:158`
- `message-input.tsx:1188`
- `login-form.tsx` (tab active state)

### Replace Inline `rgba(...)` Patterns

100+ occurrences of `rgba(var(--center-channel-color-rgb), 0.56)` and similar → create a CSS variable layer:

```css
:root {
  --text-secondary: rgba(var(--center-channel-color-rgb), 0.72);
  --text-tertiary: rgba(var(--center-channel-color-rgb), 0.56);
  --border-light: rgba(var(--center-channel-color-rgb), 0.12);
  --border-default: rgba(var(--center-channel-color-rgb), 0.16);
}
```

Then replace inline 0.56 alpha values with `var(--text-tertiary)`.

### Migrate Away from Mattermost Legacy Vars

Step 1: Create mapping in `globals.css`:
```css
:root {
  --color-foreground-primary: var(--center-channel-color);
  --color-background-primary: var(--center-channel-bg);
}
```

Step 2: Over time, move components to reference `--color-*` variables.

---

## Phase 4: New Components to Build (Days 15-21)

| Component | Priority | Purpose |
|-----------|----------|---------|
| `CharacterCounter` | P3 | Shows message character count near send button |
| `InlineUrlInput` | P1 | Replaces `window.prompt()` for link/image URL entry in formatting toolbar |
| `MarkAllReadButton` | P3 | Bulk dismiss notifications |
| `EmptyStateGuidance` | P3 | Enhanced empty states with actionable microcopy |
| `KeyboardReorder` | P2 | "Move up/down" buttons for drag-and-drop alternatives |
| `SafeAreaWrapper` | P1 | Centralizes safe area padding for mobile layouts |

---

## Phase 5: Z-Index Layer System (Day 22)

Create centralized map in `globals.css`:

```css
:root {
  --z-base: 1;
  --z-sticky: 10;
  --z-overlay: 30;
  --z-dialog: 40;
  --z-toast: 50;
  --z-tooltip: 60;
  --z-context-menu: 80;
  --z-max: 100;
}
```

Replace all inline z-index values with `style={{ zIndex: "var(--z-dialog)" }}`.
