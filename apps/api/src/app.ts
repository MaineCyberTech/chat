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
import { deprecationMiddleware } from "./middleware/deprecation.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import { securityHeaders } from "./middleware/security-headers.js";
import { doubleSubmitCookieCsrf } from "./middleware/csrf.js";
import { register, httpRequestsTotal, httpRequestDuration } from "./lib/metrics.js";
import { sentryErrorMiddleware } from "./lib/sentry.js";
import { authenticate } from "./middleware/authenticate.js";
import { inputSanitizer } from "./middleware/input-sanitizer.js";
import { routeRegistry } from "./route-registry.js";

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

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: (origin, callback) => {
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
  app.use(inputSanitizer);
  app.use(cookieParser());
  app.use(doubleSubmitCookieCsrf);
  app.use(requestId);
  app.use(apiLimiter);
  app.use(metricsMiddleware);
  app.use(deprecationMiddleware);

  for (const { path, router } of routeRegistry) {
    app.use(path, router);
  }

  app.get("/", (_req, res) => {
    res.json({ name: "chat-api", status: "running" });
  });

  app.get("/metrics", authenticate, async (_req: Request, res: Response) => {
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  });

  app.use(sentryErrorMiddleware as unknown as ErrorRequestHandler);
  app.use(errorHandler);

  return app;
}
