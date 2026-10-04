import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { formatTraceparent, resolveTraceContext } from "../lib/trace-context.js";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      traceId: string;
      spanId: string;
      traceparent: string;
      log: ReturnType<typeof logger.child>;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = (req.headers["x-request-id"] as string) ?? randomUUID();

  // Continue an inbound W3C trace context (OBS-P2-004) or start a new trace,
  // then echo it so clients and collectors can correlate the response.
  const trace = resolveTraceContext(req.headers["traceparent"]);
  req.traceId = trace.traceId;
  req.spanId = trace.spanId;
  req.traceparent = formatTraceparent(trace);
  res.setHeader("traceparent", req.traceparent);

  req.log = logger.child({
    requestId: req.requestId,
    trace_id: req.traceId,
    span_id: req.spanId,
  });
  next();
}
