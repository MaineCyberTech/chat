import { Router } from "express";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { routeRegistry } from "../../route-registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let openApiSpec: Record<string, unknown> | null = null;
try {
  const specPath = join(__dirname, "..", "..", "..", "..", "..", "docs", "api", "openapi.json");
  openApiSpec = JSON.parse(readFileSync(specPath, "utf-8"));
} catch {
  openApiSpec = { info: { title: "Chat API", version: "1.0.0" }, paths: {} };
}

let changelog: Record<string, unknown>[] | null = null;
try {
  const changelogPath = join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "docs",
    "api",
    "changelog.json",
  );
  if (existsSync(changelogPath)) {
    changelog = JSON.parse(readFileSync(changelogPath, "utf-8"));
  }
} catch {
  changelog = null;
}

const router = Router();

function generateDynamicSpec(): Record<string, unknown> {
  const spec = JSON.parse(JSON.stringify(openApiSpec)) as Record<string, unknown>;
  const dynamicPaths: Record<string, Record<string, unknown>> = {};

  for (const entry of routeRegistry) {
    const routerStack = entry.router.stack || [];
    for (const layer of routerStack) {
      if (!layer.route) continue;
      const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
      const methods = Object.keys(route.methods).filter(
        (m) => route.methods[m],
      );
      for (const method of methods) {
        const fullPath = entry.path + route.path;
        if (!dynamicPaths[fullPath]) dynamicPaths[fullPath] = {};
        dynamicPaths[fullPath][method.toLowerCase()] = {
          summary: entry.description || "",
          tags: [entry.path],
          parameters: route.path
            .match(/:([a-zA-Z0-9_]+)/g)
            ?.map((p: string) => ({
              name: p.slice(1),
              in: "path",
              required: true,
              schema: { type: "string" },
            })) ?? [],
          responses: { "200": { description: "Successful response" } },
        };
      }
    }
  }

  spec.paths = { ...(spec.paths as Record<string, unknown> ?? {}), ...dynamicPaths };

  return spec;
}

router.get("/openapi.json", (_req, res) => {
  res.json(generateDynamicSpec());
});

router.get("/changelog", (_req, res) => {
  res.json(changelog ?? []);
});

export default router;
