import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(() => {
    throw new Error("File not found");
  }),
}));

describe("OpenAPI routes", () => {
  let router: import("express").Router;

  beforeEach(async () => {
    vi.resetModules();
    router = (await import("../routes.js")).default;
  });

  it("exports a router", () => {
    expect(router).toBeDefined();
    expect(typeof router.get).toBe("function");
  });

  it("serves fallback spec when openapi.json is unavailable", async () => {
    const { default: router } = await import("../routes.js");
    let responseData: unknown;
    const req = {} as any;
    const res = {
      json: vi.fn((data: unknown) => {
        responseData = data;
      }),
    } as any;

    router.stack
      .filter((layer: any) => layer.route?.path === "/openapi.json" && layer.route.methods.get)
      .forEach((layer: any) => layer.route.stack[0].handle(req, res));

    expect(res.json).toHaveBeenCalled();
    const spec = responseData as Record<string, unknown>;
    expect(spec.info).toBeDefined();
    expect((spec.info as Record<string, unknown>).title).toBe("Chat API");
  });
});
