import { type Request, type Response, type NextFunction } from "express";

const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  res.setHeader("Content-Security-Policy", CSP_POLICY);

  // HTTP Strict Transport Security (HSTS) — 1 year, include subdomains, preload
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Deprecated but still used by some browsers as fallback
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — restrict sensitive APIs
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // DNS prefetch control
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // Cross-Origin Isolation headers
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  // Remove Express default header
  res.removeHeader("X-Powered-By");

  next();
}
