import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger.js";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" },
  },
  handler: (req, res, next, options) => {
    const userId = (req as { userId?: string }).userId;
    logger.warn("Rate limit hit", { ip: req.ip, userId, path: req.path });
    res.status(options.statusCode).json(options.message);
  },
});

function compositeKey(req: { ip?: string; userId?: string }): string {
  const ip = req.ip ?? "unknown";
  return req.userId ? `${req.userId}:${ip}` : ip;
}

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many auth attempts" } },
  keyGenerator: compositeKey,
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many search requests" } },
  keyGenerator: compositeKey,
});
