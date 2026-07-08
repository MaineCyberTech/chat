import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: ReturnType<typeof logger.child>;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.requestId = (req.headers["x-request-id"] as string) ?? randomUUID();
  req.log = logger.child({ requestId: req.requestId });
  next();
}
