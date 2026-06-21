# Visual Baseline Index

No visual baselines (screenshots, recordings) currently exist for the current repo. All visual/UX recommendations in the UI/UX audit are based on code inspection only.

## Impact

- UI polish recommendations (icon replacement, toast placement, dialog close button) are low-risk and can be validated without baselines.
- Responsive design recommendations (sidebar collapse) should be treated more conservatively — manual QA on actual devices is required.
- Dialog focus trap and error boundary changes can be validated with automated tests + keyboard-only QA.

## Recommendation

Capture baseline screenshots of the 4 primary screens before making Phase 2 visual changes:

- Landing shell (`/`)
- Login form (`/login`)
- Workspace home (`/[slug]`)
- Channel view (`/[slug]/[channelId]`)

This ensures any visual regression can be detected before/after.
