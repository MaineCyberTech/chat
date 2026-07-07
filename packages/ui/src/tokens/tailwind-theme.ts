/**
 * Tailwind CSS v4 theme extension mapping design tokens to CSS variables.
 * Import this in your app's CSS to make tokens available as Tailwind utilities.
 *
 * Usage in CSS:
 *   @import "@chat/ui/tokens/tailwind-theme.css";
 *   or reference in @theme block:
 *   @theme { ...this file's exports }
 */

export const themeExtension = {
  colors: {
    "bg-primary": "var(--color-bg-primary)",
    "bg-secondary": "var(--color-bg-secondary)",
    "text-primary": "var(--color-text-primary)",
    "text-secondary": "var(--color-text-secondary)",
    "brand": "var(--color-brand)",
    "danger": "var(--color-danger)",
    "success": "var(--color-success)",
    "warning": "var(--color-warning)",
    "border": "var(--color-border)",
    "sidebar-bg": "var(--sidebar-bg)",
    "sidebar-text": "var(--sidebar-text)",
    "sidebar-header": "var(--sidebar-header-bg)",
    "channel-bg": "var(--center-channel-bg)",
    "channel-text": "var(--center-channel-color)",
    "button-bg": "var(--button-bg)",
    "link": "var(--link-color)",
    "mention-bg": "var(--mention-bg)",
    "mention-text": "var(--mention-color)",
    "error": "var(--error-text)",
    "warning-text": "var(--warning-text)",
    "online": "var(--online-indicator)",
    "away": "var(--away-indicator)",
    "dnd": "var(--dnd-indicator)",
    "offline": "var(--offline-indicator)",
  },
  borderRadius: {
    "xs": "var(--radius-xs)",
    "sm": "var(--radius-s)",
    "md": "var(--radius-m)",
    "lg": "var(--radius-l)",
    "xl": "var(--radius-xl)",
    "full": "var(--radius-full)",
  },
  boxShadow: {
    "elevation-1": "var(--elevation-1)",
    "elevation-2": "var(--elevation-2)",
    "elevation-3": "var(--elevation-3)",
    "elevation-4": "var(--elevation-4)",
    "elevation-5": "var(--elevation-5)",
    "elevation-6": "var(--elevation-6)",
  },
};

export type ThemeExtension = typeof themeExtension;
