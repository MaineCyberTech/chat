# Component Refactor Plan — July 16, 2026

## Priority 1: Decompose message-input.tsx

**Current:** 1018 lines, handles 12+ concerns in one file
**Risk:** High — race conditions in mention/priority warnings, duplicated send logic

### Proposed Split

| New Component              | Lines Saved | Concern                                               | Props                            |
| -------------------------- | ----------- | ----------------------------------------------------- | -------------------------------- |
| `ChatEditor`               | ~200        | TipTap wrapper + formatting toggle + markdown preview | `channelId, draftKey, editorRef` |
| `AutocompleteManager`      | ~250        | @mentions, :emoji, /slash commands, keyboard nav      | `channelId, members, onInsert`   |
| `FileUploadArea`           | ~100        | Drag-and-drop, paste, file attachment list            | `channelId, onUpload`            |
| `ComposerToolbar`          | ~80         | AI rewrite, priority, schedule buttons                | `editor, onAction`               |
| `MessageInput` (remaining) | ~388        | Orchestration, submit, drafts, typing indicators      | Full props                       |

### Race Condition Fix

```
Current flow:
  handleSubmit → showMentionWarning → "Are you sure?" → user confirms
  ↓
  Problem: pendingMentionText is captured but content may change
  ↓
  confirmMentionSend reads pendingMentionText || content

Fix:
  Capture content at decision point, pass to confirm handler
  Replace two-step with a single "confirm with snapshot" pattern
```

## Priority 2: Extract Shared Pagination Component

**Current:** 3 copies in admin/page.tsx (renderUsers, renderChannels, renderAuditLog)
**Location to create:** `packages/ui/src/components/pagination.tsx`

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

Also adopt in `search/page.tsx` for consistency.

## Priority 3: Extract ToggleRow Component

**Current:** Inline in settings/page.tsx (lines 896-936)
**Location:** `packages/ui/src/components/toggle-row.tsx`
**Props:** `label, description, checked, onChange, id`
**ARIA:** `role="switch"`, `aria-checked`, `aria-labelledby`

## Priority 4: Create Shared HighlightText Utility

**Current:** Duplicated in search-bar.tsx and search/page.tsx
**Location:** `packages/ui/src/utils/highlight-text.tsx`
**API:**

```typescript
function HighlightText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}): JSX.Element;
```

## Priority 5: Add Mobile Tab Navigation to Admin

**Location:** admin/page.tsx — replace sidebar nav with:

- Desktop: sidebar (keep existing)
- Mobile (<768px): `<select>` dropdown or horizontal scroll tabs
- Approx 30 lines of additional code

## Priority 6: Standardize Error Handling Pattern

**Current:** 15+ `console.warn` catch blocks across chat-view, context-menu, quick-switcher, thread-panel
**Target:** Replace with `toast.error()` pattern:

```typescript
.catch((err) => {
  logger.error('Action failed', err);
  toast.error('Failed to perform action. Please try again.');
});
```

## Implementation Order

| Order | Refactor                       | Effort | Risk   | Value       |
| ----- | ------------------------------ | ------ | ------ | ----------- |
| 1     | Admin mobile nav               | XS     | Low    | High (P1)   |
| 2     | Shared Pagination              | S      | Low    | Medium (P2) |
| 3     | ToggleRow extraction           | XS     | Low    | Medium (P2) |
| 4     | highlightText utility          | XS     | Low    | Medium (P2) |
| 5     | Error handling standardization | M      | Medium | High (P2)   |
| 6     | MessageInput decomposition     | XL     | High   | High (P2)   |
