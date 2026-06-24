# Cookie Banner Implementation

## Requirements

- GDPR Art. 7 consent
- ePrivacy Directive compliance
- Granular consent per category
- Accessible (WCAG 2.1 AA)
- No dark patterns

## Cookie Categories

| Category   | Purpose                          | Cookies                 | Required                |
| ---------- | -------------------------------- | ----------------------- | ----------------------- |
| Essential  | Session, auth, CSRF              | `session`, `csrf_token` | Yes (no consent needed) |
| Functional | Preferences, language            | `theme`, `language`     | Opt-in                  |
| Analytics  | Usage metrics, product analytics | `_ga`, `_gid`, `_gat`   | Opt-in                  |
| Marketing  | Personalized ads, remarketing    | `_fbp`, `_gcl_au`       | Opt-in                  |

## Banner UI Requirements

### First Layer (Banner)

- Clear accept/reject all buttons (equal prominence)
- "Customize" link to second layer
- Link to cookie policy
- Link to privacy policy
- No pre-checked boxes for optional categories

### Second Layer (Preferences Panel)

- Toggle per category
- Description of each category
- List of cookies per category
- "Save preferences" button
- "Accept all" / "Reject all" buttons

## Technical Implementation

### Banner Component

```tsx
// apps/web/components/cookie-banner.tsx
// Shows on first visit if no consent cookie
// Injects into portal at body level
```

### Consent Storage

```javascript
// Cookie: consent_preferences (1 year)
// Format: { essential: true, functional: true, analytics: true, marketing: false }
// Also stored in user_preferences for logged-in users
```

### Cookie Consent API

```typescript
// GET /v1/cookie-consent - Get current consent
// POST /v1/cookie-consent - Update consent
// DELETE /v1/cookie-consent - Reset to defaults
```

## Accessibility

- ARIA labels on all controls
- Focus trap in preferences panel
- Keyboard navigation
- Screen reader announcements
- Color contrast (4.5:1 minimum)

## Testing

- Verify banner shows on first visit
- Verify preferences persist
- Verify cookies blocked until consent
- Verify rejection blocks non-essential cookies
- Test keyboard navigation
- Test screen reader

## Compliance Checklist

- [ ] Equal prominence accept/reject
- [ ] No pre-ticked optional boxes
- [ ] Granular category controls
- [ ] Easy withdrawal at any time
- [ ] Cookie policy link
- [ ] Records of consent
- [ ] No cookie walls
