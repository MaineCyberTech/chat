import { type Request, type Response, type NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_NAME = "csrf_token";

interface CSRFRequest extends Request {
  csrfToken?: string;
}

function generateToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

function parseTokenFromHeader(req: Request): string | undefined {
  return req.headers[CSRF_HEADER_NAME] as string | undefined;
}

function parseTokenFromBody(req: Request): string | undefined {
  if (req.body && typeof req.body === "object") {
    return req.body._csrf as string | undefined;
  }
  return undefined;
}

export function csrfProtection(
  options: {
    cookie?: boolean;
    ignoredMethods?: string[];
  } = {},
) {
  const { cookie = false, ignoredMethods = ["GET", "HEAD", "OPTIONS"] } = options;

  return (req: CSRFRequest, res: Response, next: NextFunction) => {
    if (ignoredMethods.includes(req.method)) {
      return next();
    }

    const token = req.csrfToken ?? parseTokenFromHeader(req) ?? parseTokenFromBody(req);

    if (!token) {
      return res.status(403).json({
        error: { code: "CSRF_INVALID", message: "Missing CSRF token" },
      });
    }

    const expectedToken = cookie ? req.cookies?.[CSRF_COOKIE_NAME] : undefined;

    if (!expectedToken || !timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
      return res.status(403).json({
        error: { code: "CSRF_INVALID", message: "Invalid CSRF token" },
      });
    }

    next();
  };
}

export function generateCsrfToken(): string {
  return generateToken();
}

export function csrfMiddleware(req: CSRFRequest, res: Response, next: NextFunction) {
  req.csrfToken = generateCsrfToken();
  res.locals.csrfToken = req.csrfToken;
  next();
}

export function doubleSubmitCookieCsrf(req: CSRFRequest, res: Response, next: NextFunction) {
  // Origin/referer check as defense-in-depth
  const origin = req.headers["origin"];
  const referer = req.headers["referer"];
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const source = origin || referer || "";
    if (source && !source.startsWith(frontendUrl.replace(/\/$/, ""))) {
      return res.status(403).json({
        error: { code: "CSRF_INVALID", message: "Cross-origin request rejected" },
      });
    }
  }

  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    const token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    req.csrfToken = token;
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers["x-csrf-token"] as string | undefined;

  if (
    !cookieToken ||
    !headerToken ||
    !timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
  ) {
    return res.status(403).json({
      error: { code: "CSRF_INVALID", message: "Invalid CSRF token" },
    });
  }

  next();
}
