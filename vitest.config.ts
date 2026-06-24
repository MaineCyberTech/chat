import { defineConfig } from "vitest/config";
import baseConfig from "./packages/config/vitest.config.base.ts";

export default defineConfig({
  ...baseConfig,
  root: import.meta.dirname,
});
