import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.requestId = (req.headers["x-request-id"] as string) ?? randomUUID();
  next();
}
