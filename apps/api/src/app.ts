import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type ErrorRequestHandler,
} from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestId } from "./middleware/request-id.js";
import { deprecationMiddleware } from "./middleware/deprecation.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import { securityHeaders } from "./middleware/security-headers.js";
import { doubleSubmitCookieCsrf } from "./middleware/csrf.js";
import { requestTimeout } from "./middleware/request-timeout.js";
import { register, httpRequestsTotal, httpRequestDuration } from "./lib/metrics.js";
import { sentryErrorMiddleware } from "./lib/sentry.js";
import { logger } from "./lib/logger.js";
import { requireMetricsAccess } from "./middleware/metrics-auth.js";
import { inputSanitizer } from "./middleware/input-sanitizer.js";
import { routeRegistry } from "./route-registry.js";
import { healthService } from "./modules/health/service.js";

function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    // `req.route` is only populated once a route has matched, so the label must
    // be resolved here rather than at middleware time. Labelling with the raw
    // path (e.g. /v1/messages/<uuid>) would make Prometheus cardinality unbounded.
    const routePath = req.route?.path;
    const route = routePath ? `${req.baseUrl ?? ""}${String(routePath)}` : "unmatched";
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration,
    );
    if (duration > 5) {
      logger.warn("Slow API response", {
        method: req.method,
        route,
        duration,
        status_code: res.statusCode,
      });
    }
  });

  next();
}

export function createApp(frontendUrl: string): Express {
  const app = express();

  app.set("trust proxy", 1);

  app.use(compression());

  // Health endpoint before CORS so Docker health checks (origin-less) work
  app.get("/healthz", async (_req, res) => {
    const result = await healthService.getFullHealth();
    const statusCode = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;
    res.status(statusCode).json(result);
  });

  app.use((req, res, next) => {
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return callback(null, true);
          return callback(new Error("Origin header required for this method"));
        }
        if (origin === frontendUrl) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    })(req, res, next);
  });
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(securityHeaders);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.use(inputSanitizer);
  app.use(cookieParser());
  app.use(doubleSubmitCookieCsrf);
  app.use(requestId);
  app.use(apiLimiter);
  app.use(metricsMiddleware);
  app.use(deprecationMiddleware);
  app.use(requestTimeout(30000));

  // Issues the double-submit CSRF cookie.
  //
  // The web client must not bootstrap this from `/`: in every deployed topology
  // `/` is served by the Next.js app, not by this API (Caddy sends only /v1*,
  // /health* and /rest/v1 here), so no cookie was ever set and every mutating
  // request failed with 403. This endpoint is behind the CSRF middleware above,
  // which sets the cookie on GET.
  app.get("/v1/csrf-token", (_req: Request, res: Response) => {
    res.status(204).end();
  });

  for (const { path, router } of routeRegistry) {
    app.use(path, router);
  }

  app.get("/", async (_req, res) => {
    const result = await healthService.getFullHealth();
    const statusCode = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;
    res.status(statusCode).json(result);
  });

  app.get("/metrics", requireMetricsAccess, async (_req: Request, res: Response) => {
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  });

  app.use(sentryErrorMiddleware as unknown as ErrorRequestHandler);
  app.use(errorHandler);

  return app;
}
