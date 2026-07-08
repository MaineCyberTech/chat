import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger.js";

function compositeKey(req: { ip?: string; userId?: string }): string {
  const ip = req.ip ?? "unknown";
  return req.userId ? `${req.userId}:${ip}` : ip;
}

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: compositeKey,
  message: {
    error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" },
  },
  handler: (req, res, next, options) => {
    const userId = (req as { userId?: string }).userId;
    logger.warn("Rate limit hit", { ip: req.ip, userId, path: req.path });
    res.setHeader("RateLimit-Limit", String(options.max));
    res.setHeader("RateLimit-Remaining", "0");
    res.setHeader("RateLimit-Reset", String(Math.ceil(Date.now() / 1000) + options.windowMs / 1000));
    res.status(options.statusCode).json(options.message);
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
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

export const magicLinkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many magic link requests. Please wait before requesting another." } },
  keyGenerator: (req) => req.ip ?? "unknown",
});
