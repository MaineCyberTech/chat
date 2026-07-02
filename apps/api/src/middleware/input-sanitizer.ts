import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../lib/app-error.js";
import { logger } from "../lib/logger.js";

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /vbscript:/i,
  /expression\s*\(/i,
  /url\s*\(/i,
  /<!--/,
  /-->/,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute|xp_|sp_|0x)\b)/i,
  /(--|;|\/\*|\*\/|@@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|exec|execute|fetch|kill|sys|sysobjects|syscolumns)/i,
  /('(\s|%20)*(or|and)(\s|%20)')/i,
];

const EXEMPT_FIELDS = new Set(["content"]);

function containsDangerousContent(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
}

function containsSqlInjection(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

export function inputSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    for (const [key, value] of Object.entries(req.body)) {
      if (EXEMPT_FIELDS.has(key)) continue;

      if (containsDangerousContent(value)) {
        logger.warn("Blocked XSS attempt", { key, ip: req.ip, path: req.path });
        throw new AppError("Input contains potentially dangerous content", 400, "VALIDATION");
      }
      if (containsSqlInjection(value)) {
        logger.warn("Blocked SQL injection attempt", { key, ip: req.ip, path: req.path });
        throw new AppError("Input contains invalid characters", 400, "VALIDATION");
      }

      if (typeof value === "object" && value !== null) {
        checkNested(value as Record<string, unknown>, key);
      }
    }
  }

  if (req.query && typeof req.query === "object") {
    for (const [key, value] of Object.entries(req.query)) {
      if (EXEMPT_FIELDS.has(key)) continue;

      if (containsDangerousContent(value)) {
        logger.warn("Blocked XSS in query params", { key, ip: req.ip, path: req.path });
        throw new AppError(
          "Query parameter contains potentially dangerous content",
          400,
          "VALIDATION",
        );
      }
    }
  }

  next();
}

function checkNested(obj: Record<string, unknown>, parentKey: string) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = `${parentKey}.${key}`;
    if (EXEMPT_FIELDS.has(key)) continue;

    if (containsDangerousContent(value)) {
      logger.warn("Blocked XSS in nested field", { key: fullKey });
      throw new AppError("Input contains potentially dangerous content", 400, "VALIDATION");
    }
    if (containsSqlInjection(value)) {
      logger.warn("Blocked SQL injection in nested field", { key: fullKey });
      throw new AppError("Input contains invalid characters", 400, "VALIDATION");
    }

    if (typeof value === "object" && value !== null) {
      checkNested(value as Record<string, unknown>, fullKey);
    }
  }
}
