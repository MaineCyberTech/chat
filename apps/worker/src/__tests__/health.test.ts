import { afterEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

vi.mock("@chat/config/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createHealthServer, DEFAULT_HEALTH_HOST, type HealthServerOptions } from "../health.js";

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections?.();
          server.close(() => resolve());
        }),
    ),
  );
});

function start(overrides: Partial<HealthServerOptions> = {}) {
  const server = createHealthServer({
    port: 0,
    host: "127.0.0.1",
    isRedisReady: () => true,
    gatherMetrics: async () => ({ webhook: { waiting: 0 } }),
    ...overrides,
  });
  servers.push(server);
  return new Promise<{ server: Server; port: number }>((resolve) => {
    server.once("listening", () => {
      resolve({ server, port: (server.address() as AddressInfo).port });
    });
  });
}

describe("worker health server", () => {
  it("binds to loopback by default and reports healthy", async () => {
    const { server, port } = await start();
    const address = server.address() as AddressInfo;
    expect(address.address).toBe(DEFAULT_HEALTH_HOST);

    const res = await fetch(`http://127.0.0.1:${port}/healthz`);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      status: "healthy",
      redis: true,
      service: "worker",
    });
  });

  it("returns 503 when Redis is not ready", async () => {
    const { port } = await start({ isRedisReady: () => false });
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ status: "degraded" });
  });

  it("hides /metrics (404) when no token is configured", async () => {
    const { port } = await start({ metricsToken: "" });
    const res = await fetch(`http://127.0.0.1:${port}/metrics`);
    expect(res.status).toBe(404);
  });

  it("requires the configured token for /metrics", async () => {
    const { port } = await start({ metricsToken: "s3cret" });

    const unauthenticated = await fetch(`http://127.0.0.1:${port}/metrics`);
    expect(unauthenticated.status).toBe(401);

    const wrongToken = await fetch(`http://127.0.0.1:${port}/metrics`, {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(wrongToken.status).toBe(401);

    const authorized = await fetch(`http://127.0.0.1:${port}/metrics`, {
      headers: { Authorization: "Bearer s3cret" },
    });
    expect(authorized.status).toBe(200);
    await expect(authorized.json()).resolves.toMatchObject({ webhook: { waiting: 0 } });
  });

  it("accepts the X-Metrics-Token header", async () => {
    const { port } = await start({ metricsToken: "abc" });
    const res = await fetch(`http://127.0.0.1:${port}/metrics`, {
      headers: { "X-Metrics-Token": "abc" },
    });
    expect(res.status).toBe(200);
  });

  it("returns 500 when metric collection fails", async () => {
    const { port } = await start({
      metricsToken: "s3cret",
      gatherMetrics: async () => {
        throw new Error("redis down");
      },
    });
    const res = await fetch(`http://127.0.0.1:${port}/metrics`, {
      headers: { Authorization: "Bearer s3cret" },
    });
    expect(res.status).toBe(500);
  });
});
