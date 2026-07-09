import { colorTokens } from "./colors";

export const semanticColors = {
  background: {
    primary: colorTokens.base.white,
    secondary: colorTokens.neutral[50],
    tertiary: colorTokens.neutral[100],
    inverse: colorTokens.neutral[950],
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  foreground: {
    primary: colorTokens.neutral[950],
    secondary: colorTokens.neutral[600],
    tertiary: colorTokens.neutral[500],
    inverse: colorTokens.base.white,
    muted: colorTokens.neutral[500],
  },
  border: {
    primary: colorTokens.neutral[200],
    secondary: colorTokens.neutral[300],
    focus: colorTokens.blue[500],
    error: colorTokens.red[500],
    success: colorTokens.green[500],
  },
  brand: {
    primary: colorTokens.blue[600],
    primaryHover: colorTokens.blue[700],
    primaryActive: colorTokens.blue[800],
    primaryLight: colorTokens.blue[100],
    primaryForeground: colorTokens.base.white,
  },
  status: {
    success: {
      bg: colorTokens.green[100],
      fg: colorTokens.green[700],
      border: colorTokens.green[300],
    },
    warning: {
      bg: colorTokens.yellow[100],
      fg: colorTokens.yellow[700],
      border: colorTokens.yellow[300],
    },
    danger: {
      bg: colorTokens.red[100],
      fg: colorTokens.red[700],
      border: colorTokens.red[300],
    },
    info: {
      bg: colorTokens.blue[100],
      fg: colorTokens.blue[700],
      border: colorTokens.blue[300],
    },
  },
  component: {
    button: {
      primary: {
        bg: colorTokens.blue[600],
        bgHover: colorTokens.blue[700],
        bgActive: colorTokens.blue[800],
        fg: colorTokens.base.white,
        border: colorTokens.blue[600],
        focusRing: colorTokens.blue[500],
      },
      secondary: {
        bg: colorTokens.neutral[100],
        bgHover: colorTokens.neutral[200],
        bgActive: colorTokens.neutral[300],
        fg: colorTokens.neutral[900],
        border: colorTokens.neutral[200],
        focusRing: colorTokens.neutral[500],
      },
      ghost: {
        bg: colorTokens.base.transparent,
        bgHover: colorTokens.neutral[100],
        bgActive: colorTokens.neutral[200],
        fg: colorTokens.neutral[700],
        border: colorTokens.base.transparent,
        focusRing: colorTokens.neutral[500],
      },
    },
    input: {
      bg: colorTokens.base.white,
      border: colorTokens.neutral[300],
      borderHover: colorTokens.neutral[400],
      borderFocus: colorTokens.blue[500],
      borderError: colorTokens.red[500],
      fg: colorTokens.neutral[950],
      placeholder: colorTokens.neutral[400],
      errorFg: colorTokens.red[600],
      focusRing: colorTokens.blue[500],
    },
    avatar: {
      bg: colorTokens.neutral[300],
      fg: colorTokens.neutral[700],
    },
    badge: {
      default: {
        bg: colorTokens.neutral[100],
        fg: colorTokens.neutral[700],
      },
      success: {
        bg: colorTokens.green[100],
        fg: colorTokens.green[700],
      },
      warning: {
        bg: colorTokens.yellow[100],
        fg: colorTokens.yellow[700],
      },
      danger: {
        bg: colorTokens.red[100],
        fg: colorTokens.red[700],
      },
    },
    skeleton: {
      bg: colorTokens.neutral[200],
    },
    dialog: {
      overlay: "rgba(0, 0, 0, 0.5)",
      bg: colorTokens.base.white,
      closeBtnBgHover: colorTokens.neutral[100],
      closeBtnFg: colorTokens.neutral[400],
      closeBtnFgHover: colorTokens.neutral[600],
    },
    sidebar: {
      titleFg: colorTokens.neutral[400],
      titleFgHover: colorTokens.neutral[600],
    },
  },
} as const;

export type SemanticColors = typeof semanticColors;

export const darkSemanticColors = {
  background: {
    primary: colorTokens.neutral[950],
    secondary: colorTokens.neutral[900],
    tertiary: colorTokens.neutral[800],
    inverse: colorTokens.base.white,
    overlay: "rgba(0, 0, 0, 0.7)",
  },
  foreground: {
    primary: colorTokens.base.white,
    secondary: colorTokens.neutral[300],
    tertiary: colorTokens.neutral[500],
    inverse: colorTokens.neutral[950],
    muted: colorTokens.neutral[500],
  },
  border: {
    primary: colorTokens.neutral[700],
    secondary: colorTokens.neutral[600],
    focus: colorTokens.blue[400],
    error: colorTokens.red[400],
    success: colorTokens.green[400],
  },
  brand: {
    primary: colorTokens.blue[500],
    primaryHover: colorTokens.blue[400],
    primaryActive: colorTokens.blue[600],
    primaryLight: colorTokens.blue[900],
    primaryForeground: colorTokens.base.white,
  },
  status: {
    success: {
      bg: colorTokens.green[900],
      fg: colorTokens.green[300],
      border: colorTokens.green[700],
    },
    warning: {
      bg: colorTokens.yellow[900],
      fg: colorTokens.yellow[300],
      border: colorTokens.yellow[700],
    },
    danger: {
      bg: colorTokens.red[900],
      fg: colorTokens.red[300],
      border: colorTokens.red[700],
    },
    info: {
      bg: colorTokens.blue[900],
      fg: colorTokens.blue[300],
      border: colorTokens.blue[700],
    },
  },
  component: {
    button: {
      primary: {
        bg: colorTokens.blue[500],
        bgHover: colorTokens.blue[400],
        bgActive: colorTokens.blue[600],
        fg: colorTokens.base.white,
        border: colorTokens.blue[500],
        focusRing: colorTokens.blue[400],
      },
      secondary: {
        bg: colorTokens.neutral[800],
        bgHover: colorTokens.neutral[700],
        bgActive: colorTokens.neutral[600],
        fg: colorTokens.neutral[100],
        border: colorTokens.neutral[700],
        focusRing: colorTokens.neutral[400],
      },
      ghost: {
        bg: colorTokens.base.transparent,
        bgHover: colorTokens.neutral[800],
        bgActive: colorTokens.neutral[700],
        fg: colorTokens.neutral[300],
        border: colorTokens.base.transparent,
        focusRing: colorTokens.neutral[400],
      },
    },
    input: {
      bg: colorTokens.neutral[800],
      border: colorTokens.neutral[700],
      borderHover: colorTokens.neutral[600],
      borderFocus: colorTokens.blue[400],
      borderError: colorTokens.red[400],
      fg: colorTokens.neutral[100],
      placeholder: colorTokens.neutral[500],
      errorFg: colorTokens.red[400],
      focusRing: colorTokens.blue[400],
    },
    avatar: {
      bg: colorTokens.neutral[700],
      fg: colorTokens.neutral[300],
    },
    badge: {
      default: {
        bg: colorTokens.neutral[800],
        fg: colorTokens.neutral[300],
      },
      success: {
        bg: colorTokens.green[900],
        fg: colorTokens.green[300],
      },
      warning: {
        bg: colorTokens.yellow[900],
        fg: colorTokens.yellow[300],
      },
      danger: {
        bg: colorTokens.red[900],
        fg: colorTokens.red[300],
      },
    },
    skeleton: {
      bg: colorTokens.neutral[800],
    },
    dialog: {
      overlay: "rgba(0, 0, 0, 0.7)",
      bg: colorTokens.neutral[900],
      closeBtnBgHover: colorTokens.neutral[800],
      closeBtnFg: colorTokens.neutral[400],
      closeBtnFgHover: colorTokens.neutral[300],
    },
    sidebar: {
      titleFg: colorTokens.neutral[500],
      titleFgHover: colorTokens.neutral[300],
    },
  },
} as const;

export type DarkSemanticColors = typeof darkSemanticColors;
