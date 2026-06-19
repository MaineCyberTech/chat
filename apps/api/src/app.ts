import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import healthRoutes from "./modules/health/routes.js";
import authRoutes from "./modules/auth/routes.js";
import workspaceRoutes from "./modules/workspaces/routes.js";
import channelRoutes from "./modules/channels/routes.js";
import messageRoutes from "./modules/messages/routes.js";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(helmet());
  app.use(express.json());
  app.use(requestId);
  app.use(apiLimiter);

  app.use(healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/workspaces", workspaceRoutes);
  app.use(channelRoutes);
  app.use(messageRoutes);

  app.get("/", (_req, res) => {
    res.json({ name: "chat-api", status: "running" });
  });

  app.use(errorHandler);

  return app;
}
