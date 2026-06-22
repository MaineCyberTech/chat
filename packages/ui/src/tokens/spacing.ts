export const spacingTokens = {
  space: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
  },
  component: {
    button: {
      sm: { px: "0.75rem", py: "0.375rem", gap: "0.375rem" },
      md: { px: "1rem", py: "0.5rem", gap: "0.5rem" },
      lg: { px: "1.5rem", py: "0.75rem", gap: "0.5rem" },
    },
    input: {
      sm: { px: "0.75rem", py: "0.375rem" },
      md: { px: "0.75rem", py: "0.5rem" },
      lg: { px: "1rem", py: "0.75rem" },
    },
    badge: {
      px: "0.5rem",
      py: "0.125rem",
    },
    avatar: {
      sm: { size: "1.75rem", fontSize: "0.75rem" },
      md: { size: "2.25rem", fontSize: "0.875rem" },
      lg: { size: "3rem", fontSize: "1rem" },
    },
    dialog: {
      padding: "1.5rem",
      maxWidth: "24rem",
    },
    sidebar: {
      groupGap: "0.25rem",
      itemPx: "0.75rem",
      itemPy: "0.25rem",
    },
  },
} as const;

export type SpacingTokens = typeof spacingTokens;

export const density = {
  comfortable: {
    multiplier: 1,
    name: "comfortable",
  },
  compact: {
    multiplier: 0.75,
    name: "compact",
  },
  spacious: {
    multiplier: 1.25,
    name: "spacious",
  },
} as const;

export type Density = typeof density;

export function getSpacing(spaceKey: keyof typeof spacingTokens.space): string {
  return spacingTokens.space[spaceKey];
}

export function getComponentSpacing<T extends keyof typeof spacingTokens.component>(
  component: T,
  variant?: keyof (typeof spacingTokens.component)[T],
):
  | (typeof spacingTokens.component)[T]
  | (typeof spacingTokens.component)[T][keyof (typeof spacingTokens.component)[T]] {
  if (
    variant &&
    typeof spacingTokens.component[component] === "object" &&
    variant in spacingTokens.component[component]
  ) {
    return spacingTokens.component[component][variant];
  }
  return spacingTokens.component[component];
}
