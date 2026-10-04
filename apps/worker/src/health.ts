import { createServer, type Server } from "node:http";
import { logger } from "@chat/config/logger.js";
import { checkMetricsAccess } from "./lib/metrics-auth.js";

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
   * Token required for `/metrics`. Defaults to the shared `METRICS_TOKEN`
   * scraper token. The endpoint fails closed: when no token is configured it
   * responds 404, and a missing/incorrect token gets 401.
   */
  metricsToken?: string;
  /** Reports whether Redis is ready (drives `/healthz` status). */
  isRedisReady: () => boolean;
  /** Collects queue metrics for `/metrics`. */
  gatherMetrics: () => Promise<unknown>;
}

/**
 * Creates (and starts listening on) the worker health/metrics HTTP server.
 *
 * Routes:
 * - `GET /healthz`, `GET /health` — liveness/readiness; always unauthenticated (used by the
 *   container healthcheck), loopback-bound.
 * - `GET /metrics` — queue metrics; requires the shared `METRICS_TOKEN` scraper token
 *   (`X-Metrics-Token` header or `Authorization: Bearer`). Fails closed when unset.
 */
export function createHealthServer(options: HealthServerOptions): Server {
  const {
    port,
    host = process.env.HEALTH_HOST || DEFAULT_HEALTH_HOST,
    metricsToken = process.env.METRICS_TOKEN || "",
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
      const access = checkMetricsAccess(req, metricsToken);
      if (!access.ok) {
        res.writeHead(access.status, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: {
              code: access.status === 404 ? "NOT_FOUND" : "UNAUTHORIZED",
              message: access.status === 404 ? "Not found" : "Invalid metrics token",
            },
          }),
        );
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
