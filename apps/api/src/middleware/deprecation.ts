import type { Request, Response, NextFunction } from "express";

interface DeprecatedRouteConfig {
  sunset: string;
  deprecation: string;
  link?: string;
}

const DEPRECATED_ROUTES = new Map<string, DeprecatedRouteConfig>();

export function registerDeprecatedRoute(route: string, config: DeprecatedRouteConfig): void {
  DEPRECATED_ROUTES.set(route, config);
}

export function deprecationMiddleware(req: Request, res: Response, next: NextFunction) {
  const config = DEPRECATED_ROUTES.get(req.path);
  if (config) {
    res.set("Sunset", config.sunset);
    res.set("Deprecation", config.deprecation);
    if (config.link) {
      res.set("Link", `<${config.link}>; rel="deprecation"`);
    }
  }
  next();
}
