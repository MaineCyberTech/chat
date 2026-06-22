# Phase 3 — Install UX and Dedicated Install Page

Implement a Progressier-style installation experience on top of the existing frontend.

## Objective

Create a platform-aware install journey that works for both signed-out and signed-in users.

## Required outcomes

Implement:

- install CTA component(s)
- platform/browser detection utilities
- tailored install instructions
- a dedicated `/install` page
- desktop-to-mobile continuation support if practical
- graceful fallback when install is unsupported

## Preferred integration points

Inspect and integrate with:

- `apps/web/app/page.tsx`
- `apps/web/components/home/landing-shell.tsx`
- `apps/web/components/app-header.tsx`
- `apps/web/app/(workspace)/layout.tsx`
- new route `apps/web/app/install/page.tsx`

## UX requirements

- signed-out users should see a clean install path
- signed-in users should be able to install without losing their current workflow
- iOS users should receive tailored “Add to Home Screen” guidance
- Android / desktop users should receive install-friendly CTAs where browser support exists
- unsupported browsers should get explanation rather than a broken CTA

## Implementation constraints

- no broad redesign of home/workspace shell
- no unrelated navigation changes
- no removal of existing header/sidebar/chat structure

## Required output

Emit:

1. exact new components added
2. exact integration points
3. browser/platform handling decisions
4. screenshots or text descriptions if visual changes were made
5. validation results
