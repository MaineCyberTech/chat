import type { Request, Response, NextFunction } from "express";

export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: { code: "REQUEST_TIMEOUT", message: "Request timed out" },
        });
      }
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timer));
    next();
  };
}
