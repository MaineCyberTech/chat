export const focusRing = {
  width: "2px",
  offset: "2px",
  style: "solid" as const,
  defaultColor: "var(--focus-ring-color, #3b82f6)",
  errorColor: "var(--focus-ring-error, #ef4444)",
  successColor: "var(--focus-ring-success, #22c55e)",
} as const;

export type FocusRing = typeof focusRing;

export const focusStyles = {
  base: `
    outline: none;
    ring: ${focusRing.width} ${focusRing.style} ${focusRing.defaultColor};
    ring-offset: ${focusRing.offset};
  `,
  visible: `
    &:focus-visible {
      outline: none;
      ring: ${focusRing.width} ${focusRing.style} ${focusRing.defaultColor};
      ring-offset: ${focusRing.offset};
    }
  `,
  error: `
    &:focus-visible {
      outline: none;
      ring: ${focusRing.width} ${focusRing.style} ${focusRing.errorColor};
      ring-offset: ${focusRing.offset};
    }
  `,
  success: `
    &:focus-visible {
      outline: none;
      ring: ${focusRing.width} ${focusRing.style} ${focusRing.successColor};
      ring-offset: ${focusRing.offset};
    }
  `,
  inset: `
    &:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 ${focusRing.width} ${focusRing.defaultColor};
    }
  `,
} as const;

export function getFocusStyles(variant: "base" | "error" | "success" | "inset" = "base"): string {
  return focusStyles[variant];
}

export const focusRingCSSVars = {
  default: "--focus-ring-color",
  error: "--focus-ring-error",
  success: "--focus-ring-success",
} as const;
