import { createServer, type IncomingMessage, type Server } from "node:http";
import { logger } from "@chat/config/logger.js";

/**
 * Default bind address for the worker health/metrics server.
 *
 * The server is deliberately loopback-only by default: `docker-compose.prod.yml` and
 * `docker-compose.devremote.yml` do not publish port 4100, and the container healthcheck
 * (`wget http://localhost:4100/healthz`) runs inside the container. Binding to loopback
 * keeps operational metrics off the host/compose network until an operator opts in
 * (see `docs/runbooks/...` / `infra/docker/README.md`).
 */
export const DEFAULT_HEALTH_HOST = "127.0.0.1";

export interface HealthServerOptions {
  /** TCP port to listen on. */
  port: number;
  /** Bind address. Defaults to `HEALTH_HOST`, then loopback. Never `0.0.0.0` by default. */
  host?: string;
  /**
   * When non-empty, `/metrics` requires `Authorization: Bearer <token>` (or an
   * `X-Health-Token` header). Defaults to `HEALTH_TOKEN`.
   */
  metricsToken?: string;
  /** Reports whether Redis is ready (drives `/healthz` status). */
  isRedisReady: () => boolean;
  /** Collects queue metrics for `/metrics`. */
  gatherMetrics: () => Promise<unknown>;
}

function presentedToken(req: IncomingMessage): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim();
  }
  const header = req.headers["x-health-token"];
  return (Array.isArray(header) ? header[0] : header) ?? "";
}

/**
 * Creates (and starts listening on) the worker health/metrics HTTP server.
 *
 * Routes:
 * - `GET /healthz`, `GET /health` — liveness/readiness; always unauthenticated (used by the
 *   container healthcheck), loopback-bound.
 * - `GET /metrics` — queue metrics; requires a token when `HEALTH_TOKEN` is set.
 */
export function createHealthServer(options: HealthServerOptions): Server {
  const {
    port,
    host = process.env.HEALTH_HOST || DEFAULT_HEALTH_HOST,
    metricsToken = process.env.HEALTH_TOKEN || "",
    isRedisReady,
    gatherMetrics,
  } = options;

  const server = createServer(async (req, res) => {
    if (req.url === "/healthz" || req.url === "/health") {
      const redisOk = isRedisReady();
      const status = redisOk ? "healthy" : "degraded";
      const body = JSON.stringify({
        status,
        service: "worker",
        redis: redisOk,
        timestamp: new Date().toISOString(),
      });
      res.writeHead(redisOk ? 200 : 503, { "Content-Type": "application/json" });
      res.end(body);
    } else if (req.url === "/metrics") {
      if (metricsToken && presentedToken(req) !== metricsToken) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }
      try {
        const body = JSON.stringify(await gatherMetrics());
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(body);
      } catch {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "metrics unavailable" }));
      }
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "running", service: "worker" }));
    }
  });

  server.listen(port, host, () => logger.info({ port, host }, "Health server started"));
  return server;
}
