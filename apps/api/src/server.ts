import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initSupabase } from "./lib/supabase.js";
import { initSocket } from "./lib/socket.js";
import { initSentry } from "./lib/sentry.js";
import { logger } from "./lib/logger.js";

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
initSocket(httpServer, env.FRONTEND_URL);

httpServer.listen(env.PORT, () => {
  logger.info(`API server listening on port ${env.PORT}`, { port: env.PORT });
});

function shutdown(signal: string) {
  logger.info(`Received ${signal} — draining connections...`);
  httpServer.close(() => {
    logger.info("All connections closed — shutting down");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
