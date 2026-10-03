import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadEnv, logEnvStatus } from "./config/env.js";
import { initSupabase } from "./lib/supabase.js";
import { initSocket, shutdownSocket } from "./lib/socket.js";
import { initSentry } from "./lib/sentry.js";
import { initErrorLog } from "./modules/admin/error-buffer.js";
import { logger } from "./lib/logger.js";
import { initializeCache, shutdownCache } from "./middleware/cache.js";
import type { Socket } from "node:net";

// Alerting: Prometheus/Alertmanager rules and routing are checked in under
// infra/prometheus/ (see docs/runbooks/alerting.md). Operator tasks:
//   - Deploy the Prometheus + Alertmanager stack and set ALERT_EMAIL /
//     ALERT_WEBHOOK_URL.
//   - Configure DO monitoring alerts (CPU > 80 %, memory > 80 %) via
//     terraform alert_email.
//   - Health check at GET /health (for LB / DO monitoring).

const env = loadEnv();
logEnvStatus(env);
initErrorLog();
initSentry();
if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
  initSupabase(env);
} else {
  logger.warn("SUPABASE_URL or SUPABASE_ANON_KEY not set; running without database");
}

// Set validated FRONTEND_URL so createApp() can use it for CORS
process.env.FRONTEND_URL = env.FRONTEND_URL;
// Surface config flags for middleware access
process.env.SHOW_STACK_TRACES = env.SHOW_STACK_TRACES;

const app = createApp(env.FRONTEND_URL);
const httpServer = createServer(app);
initSocket(httpServer, env.FRONTEND_URL, env.REDIS_URL);
initializeCache();

// Track active connections for graceful draining
const connections = new Set<Socket>();
httpServer.on("connection", (socket: Socket) => {
  connections.add(socket);
  socket.on("close", () => connections.delete(socket));
});

// Track in-flight requests for draining
let inFlightRequests = 0;
httpServer.on("request", (req, res) => {
  inFlightRequests++;
  res.on("finish", () => inFlightRequests--);
});

httpServer.listen(env.PORT, () => {
  logger.info(`API server listening on port ${env.PORT}`, { port: env.PORT });
});

function shutdown(signal: string) {
  logger.info(`Received ${signal} — draining connections...`);

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info("Server closed — no longer accepting new connections");
  });

  // Wait for in-flight requests to complete, then destroy idle connections
  const drain = () => {
    if (inFlightRequests > 0) {
      logger.info(`Waiting for ${inFlightRequests} in-flight request(s) to complete...`);
      setTimeout(drain, 500);
      return;
    }
    logger.info("All in-flight requests completed — destroying idle connections");
    for (const socket of connections) {
      socket.destroy();
    }
    connections.clear();

    shutdownSocket().then(() => {
      shutdownCache();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    });
  };
  drain();

  // Force exit after timeout regardless
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
