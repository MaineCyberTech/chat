/**
 * W3C Trace Context helpers (https://www.w3.org/TR/trace-context/).
 *
 * OBS-P2-004: correlation previously stopped at `x-request-id`, which is
 * request-scoped and not understood by tracing backends. These helpers let the
 * API:
 *   - continue an inbound `traceparent` from an upstream caller instead of
 *     starting a fresh chain at every hop,
 *   - emit a standards-shaped `traceparent` on the way out so an
 *     OpenTelemetry-compatible collector can stitch API -> worker -> Supabase
 *     spans together, and
 *   - stamp `trace_id` / `span_id` onto structured logs.
 */
import { randomBytes } from "node:crypto";

export interface TraceContext {
  /** 32 lowercase hex chars. Stable for the whole distributed trace. */
  traceId: string;
  /** 16 lowercase hex chars identifying this service's span. */
  spanId: string;
  /** Whether the trace is sampled (traceparent flags bit 0). */
  sampled: boolean;
}

// version-trace_id-parent_id-trace_flags
const TRACEPARENT = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

/** Start a new trace (no usable inbound context). */
export function newTraceContext(sampled = true): TraceContext {
  return { traceId: randomHex(16), spanId: randomHex(8), sampled };
}

/**
 * Parse a W3C `traceparent` header. Returns `null` when the value is missing,
 * malformed, uses the invalid `ff` version, or carries an all-zero trace/span
 * id (all of which MUST be rejected per the spec).
 */
export function parseTraceparent(header: string | undefined | null): TraceContext | null {
  if (!header) return null;
  const value = header.trim().toLowerCase();
  if (value.length > 55) return null;

  const match = TRACEPARENT.exec(value);
  if (!match) return null;

  const [, version, traceId, parentId, flags] = match;
  if (version === "ff") return null;
  if (/^0+$/.test(traceId) || /^0+$/.test(parentId)) return null;

  return {
    traceId,
    spanId: randomHex(8),
    sampled: (parseInt(flags, 16) & 0x01) === 0x01,
  };
}

/** Format a context as a version-`00` `traceparent` value. */
export function formatTraceparent(context: TraceContext): string {
  return `00-${context.traceId}-${context.spanId}-${context.sampled ? "01" : "00"}`;
}

/**
 * Resolve the trace context for a request: continue a valid inbound
 * `traceparent`, otherwise start a new trace.
 */
export function resolveTraceContext(
  traceparentHeader: string | string[] | undefined,
): TraceContext {
  const inbound = typeof traceparentHeader === "string" ? traceparentHeader : undefined;
  return parseTraceparent(inbound) ?? newTraceContext();
}
