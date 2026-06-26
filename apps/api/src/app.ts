import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type ErrorRequestHandler,
} from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import { securityHeaders } from "./middleware/security-headers.js";
import { doubleSubmitCookieCsrf } from "./middleware/csrf.js";
import { register, httpRequestsTotal, httpRequestDuration } from "./lib/metrics.js";
import { sentryErrorMiddleware } from "./lib/sentry.js";
import healthRoutes from "./modules/health/routes.js";
import authRoutes from "./modules/auth/routes.js";
import workspaceRoutes from "./modules/workspaces/routes.js";
import channelRoutes from "./modules/channels/routes.js";
import messageRoutes from "./modules/messages/routes.js";
import webhookRoutes from "./modules/webhooks/routes.js";
import notificationRoutes from "./modules/notifications/routes.js";
import preferencesRoutes from "./modules/preferences/routes.js";
import reactionRoutes from "./modules/reactions/routes.js";
import featureFlagRoutes from "./modules/feature-flags/routes.js";

function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const route = req.route?.path ?? req.path;

  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration,
    );
  });

  next();
}

export function createApp(frontendUrl: string): Express {
  const app = express();

  app.set("trust proxy", true);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (origin === frontendUrl) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    }),
  );
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(securityHeaders);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.use(cookieParser());

  // Test endpoint with only express.json()
  app.post("/v1/test-body", (req, res) => {
    console.log("TEST BODY:", { body: req.body, headers: req.headers });
    res.json({ received: req.body });
  });

  // Debug: echo raw body for POST /v1/workspaces
  app.use("/v1/workspaces", (req, res, next) => {
    if (req.method === "POST") {
      console.log("DEBUG POST /v1/workspaces:", {
        contentType: req.get("Content-Type"),
        contentLength: req.get("Content-Length"),
        body: req.body,
      });
    }
    next();
  });

  app.use(doubleSubmitCookieCsrf);
  app.use(requestId);
  app.use(apiLimiter);
  app.use(metricsMiddleware);

  app.use(healthRoutes);
  app.use("/v1/auth", authRoutes);
  app.use("/v1/workspaces", workspaceRoutes);
  app.use("/v1", channelRoutes);
  app.use("/v1", messageRoutes);
  app.use("/v1", webhookRoutes);
  app.use("/v1", notificationRoutes);
  app.use("/v1/auth", preferencesRoutes);
  app.use("/v1", reactionRoutes);
  app.use("/v1", featureFlagRoutes);

  app.get("/", (_req, res) => {
    res.json({ name: "chat-api", status: "running" });
  });

  app.get("/metrics", async (_req: Request, res: Response) => {
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  });

  app.use(sentryErrorMiddleware as unknown as ErrorRequestHandler);
  app.use(errorHandler);

  return app;
}
