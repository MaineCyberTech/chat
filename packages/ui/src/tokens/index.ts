import { colorTokens, type ColorToken } from "./colors";
import {
  semanticColors,
  darkSemanticColors,
  type SemanticColors,
  type DarkSemanticColors,
} from "./semantic-colors";
import { typographyTokens, typeScale, type TypographyTokens, type TypeScale } from "./typography";
import { spacingTokens, getSpacing, getComponentSpacing, type SpacingTokens } from "./spacing";
import {
  motionTokens,
  componentTransitions,
  type MotionTokens,
  type ComponentTransitions,
} from "./motion";
import {
  borderRadiusTokens,
  shadowTokens,
  componentBorderRadius,
  componentShadows,
  type BorderRadiusTokens,
  type ShadowTokens,
} from "./borders";
import { focusRing, focusStyles, getFocusStyles, focusRingCSSVars, type FocusRing } from "./focus";

export {
  colorTokens,
  type ColorToken,
  semanticColors,
  darkSemanticColors,
  type SemanticColors,
  type DarkSemanticColors,
  typographyTokens,
  typeScale,
  type TypographyTokens,
  type TypeScale,
  spacingTokens,
  getSpacing,
  getComponentSpacing,
  type SpacingTokens,
  motionTokens,
  componentTransitions,
  type MotionTokens,
  type ComponentTransitions,
  borderRadiusTokens,
  shadowTokens,
  componentBorderRadius,
  componentShadows,
  type BorderRadiusTokens,
  type ShadowTokens,
  focusRing,
  focusStyles,
  getFocusStyles,
  focusRingCSSVars,
  type FocusRing,
};

export { themeExtension } from "./tailwind-theme";
export type { ThemeExtension } from "./tailwind-theme";

export const theme = {
  colors: {
    light: semanticColors,
    dark: darkSemanticColors,
  },
  typography: typographyTokens,
  typeScale,
  spacing: spacingTokens,
  motion: motionTokens,
  borderRadius: borderRadiusTokens,
  shadows: shadowTokens,
  focusRing,
} as const;

export type Theme = typeof theme;

export function generateCSSVariables(
  themeMode: "light" | "dark" = "light",
): Record<string, string> {
  const colors = themeMode === "light" ? semanticColors : darkSemanticColors;
  const vars: Record<string, string> = {};

  function flatten(obj: Record<string, unknown>, prefix = ""): void {
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}-${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        flatten(value as Record<string, unknown>, newKey);
      } else {
        vars[`--${newKey}`] = String(value);
      }
    }
  }

  flatten({ color: colors });
  flatten({ spacing: spacingTokens.space }, "space");
  flatten({ radius: borderRadiusTokens }, "radius");
  flatten({ shadow: shadowTokens }, "shadow");
  flatten({ duration: motionTokens.duration }, "duration");
  flatten({ easing: motionTokens.easing }, "easing");
  flatten({ fontSize: typographyTokens.fontSize }, "font-size");
  flatten({ fontWeight: typographyTokens.fontWeight }, "font-weight");
  flatten({ lineHeight: typographyTokens.lineHeight }, "line-height");
  flatten({ letterSpacing: typographyTokens.letterSpacing }, "letter-spacing");

  return vars;
}

export function getCSSVariableString(themeMode: "light" | "dark" = "light"): string {
  const vars = generateCSSVariables(themeMode);
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
}
