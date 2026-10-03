import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

type RouteRegistry = typeof import("../../../route-registry.js").routeRegistry;

let routeRegistry: RouteRegistry;
let generateDynamicSpec: typeof import("../routes.js").generateDynamicSpec;

interface OpenApiOperation {
  [method: string]: unknown;
}

function mountedRoutes(registry: RouteRegistry): Set<string> {
  const routes = new Set<string>();
  for (const entry of registry) {
    const stack = ((entry.router as unknown as { stack?: unknown[] }).stack ?? []) as Array<{
      route?: { path: string; methods: Record<string, boolean> };
    }>;
    for (const layer of stack) {
      if (!layer.route) continue;
      for (const method of Object.keys(layer.route.methods)) {
        if (layer.route.methods[method]) {
          routes.add(`${method.toUpperCase()} ${entry.path}${layer.route.path}`);
        }
      }
    }
  }
  return routes;
}

function documentedRoutes(spec: Record<string, unknown>): Set<string> {
  const routes = new Set<string>();
  const paths = (spec.paths ?? {}) as Record<string, Record<string, OpenApiOperation>>;
  for (const [path, operations] of Object.entries(paths)) {
    for (const method of Object.keys(operations ?? {})) {
      routes.add(`${method.toUpperCase()} ${path}`);
    }
  }
  return routes;
}

beforeAll(async () => {
  vi.stubEnv("LIVEKIT_API_KEY", "test-key");
  vi.stubEnv("LIVEKIT_API_SECRET", "test-secret");
  ({ routeRegistry } = await import("../../../route-registry.js"));
  ({ generateDynamicSpec } = await import("../routes.js"));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("OpenAPI route coverage", () => {
  it("registers routes to check (guards against an empty registry)", () => {
    expect(mountedRoutes(routeRegistry).size).toBeGreaterThan(0);
  });

  it("documents every route exposed by the route registry", () => {
    const documented = documentedRoutes(generateDynamicSpec());
    const missing = [...mountedRoutes(routeRegistry)].filter((route) => !documented.has(route));
    expect(missing).toEqual([]);
  });
});
