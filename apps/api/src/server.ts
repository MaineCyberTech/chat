import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initSupabase } from "./lib/supabase.js";
import { initSocket } from "./lib/socket.js";
import { logger } from "./lib/logger.js";

const env = loadEnv();
if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
  initSupabase(env);
} else {
  logger.warn("SUPABASE_URL or SUPABASE_ANON_KEY not set; running without database");
}

// Set validated FRONTEND_URL so createApp() can use it for CORS
process.env.FRONTEND_URL = env.FRONTEND_URL;

const app = createApp();
const httpServer = createServer(app);
initSocket(httpServer, env.FRONTEND_URL);

httpServer.listen(env.PORT, () => {
  logger.info(`API server listening on port ${env.PORT}`, { port: env.PORT });
});
