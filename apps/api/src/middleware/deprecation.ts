import type { Request, Response, NextFunction } from "express";

const DEPRECATED_ROUTES: Record<string, { sunset: string; deprecation: string; link?: string }> =
  {};

export function deprecationMiddleware(req: Request, res: Response, next: NextFunction) {
  const route = req.path;
  const config = DEPRECATED_ROUTES[route];
  if (config) {
    res.set("Sunset", config.sunset);
    res.set("Deprecation", config.deprecation);
    if (config.link) {
      res.set("Link", `<${config.link}>; rel="deprecation"`);
    }
  }
  next();
}
