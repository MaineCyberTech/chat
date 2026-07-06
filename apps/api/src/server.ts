import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initSupabase } from "./lib/supabase.js";
import { initSocket, shutdownSocket } from "./lib/socket.js";
import { initSentry } from "./lib/sentry.js";
import { logger } from "./lib/logger.js";
import { initializeCache, shutdownCache } from "./middleware/cache.js";
import type { Socket } from "node:net";

const env = loadEnv();
initSentry();
if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
  initSupabase(env);
} else {
  logger.warn("SUPABASE_URL or SUPABASE_ANON_KEY not set; running without database");
}

// Set validated FRONTEND_URL so createApp() can use it for CORS
process.env.FRONTEND_URL = env.FRONTEND_URL;

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

httpServer.listen(env.PORT, () => {
  logger.info(`API server listening on port ${env.PORT}`, { port: env.PORT });
});

function shutdown(signal: string) {
  logger.info(`Received ${signal} — draining connections...`);

  // Stop accepting new connections
  httpServer.close(async () => {
    await shutdownSocket();
    shutdownCache();
    logger.info("All connections closed — shutting down");
    process.exit(0);
  });

  // Destroy all active keep-alive connections
  for (const socket of connections) {
    socket.destroy();
  }
  connections.clear();

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
