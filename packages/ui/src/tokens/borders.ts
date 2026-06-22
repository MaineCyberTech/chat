export const borderRadiusTokens = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

export type BorderRadiusTokens = typeof borderRadiusTokens;

export const shadowTokens = {
  none: "none",
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  focus: "0 0 0 2px var(--focus-ring-color, #3b82f6)",
  focusInset: "inset 0 0 0 2px var(--focus-ring-color, #3b82f6)",
} as const;

export type ShadowTokens = typeof shadowTokens;

export const componentBorderRadius = {
  button: borderRadiusTokens.lg,
  input: borderRadiusTokens.lg,
  badge: borderRadiusTokens.full,
  avatar: borderRadiusTokens.full,
  dialog: borderRadiusTokens.xl,
  skeleton: borderRadiusTokens.md,
  dropdown: borderRadiusTokens.lg,
  tooltip: borderRadiusTokens.md,
} as const;

export const componentShadows = {
  dialog: shadowTokens.xl,
  dropdown: shadowTokens.lg,
  tooltip: shadowTokens.md,
  skeleton: shadowTokens.none,
} as const;
