import sharedConfig from "./packages/config/eslint.config.mjs";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default tseslint.config(...sharedConfig, {
  files: ["apps/web/**/*.{ts,tsx}"],
  plugins: { "@next/next": nextPlugin },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs["core-web-vitals"].rules,
  },
});
