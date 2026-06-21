import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: workspaceRoot,
  resolve: {
    alias: {
      "@": resolve(workspaceRoot, "apps/web"),
      "@chat/ui": resolve(workspaceRoot, "packages/ui/src"),
      "@chat/db": resolve(workspaceRoot, "packages/db/src"),
    },
  },
  test: {
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: [
      "apps/*/src/**/*.test.ts",
      "apps/*/src/**/*.test.tsx",
      "apps/*/components/**/*.test.ts",
      "apps/*/components/**/*.test.tsx",
      "packages/*/src/**/*.test.ts",
      "packages/*/src/**/*.test.tsx",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["apps/*/src/**", "packages/*/src/**"],
      thresholds: {
        lines: 40,
        functions: 30,
        branches: 30,
        statements: 40,
      },
    },
  },
});
