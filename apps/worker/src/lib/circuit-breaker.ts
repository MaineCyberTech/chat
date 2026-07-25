import { logger } from "@chat/config/logger.js";

const CB_WINDOW_MS = 30_000;
const CB_MAX_FAILURES = 5;
const failureTracker = new Map<string, number[]>();

function isCircuitOpen(label: string): boolean {
  const now = Date.now();
  const failures = failureTracker.get(label) ?? [];
  const recent = failures.filter((t) => now - t < CB_WINDOW_MS);
  failureTracker.set(label, recent);
  return recent.length >= CB_MAX_FAILURES;
}

function recordFailure(label: string): void {
  const now = Date.now();
  const failures = failureTracker.get(label) ?? [];
  failures.push(now);
  failureTracker.set(label, failures.slice(-CB_MAX_FAILURES * 2));
}

function recordSuccess(label: string): void {
  failureTracker.delete(label);
}

export async function executeWithCircuitBreaker<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (isCircuitOpen(label)) {
    logger.warn({ label }, "Circuit breaker is open");
    throw new Error(`Service temporarily unavailable: ${label}`);
  }
  try {
    const result = await fn();
    recordSuccess(label);
    return result;
  } catch (err) {
    recordFailure(label);
    throw err;
  }
}

export function resetCircuitBreaker(label: string): void {
  failureTracker.delete(label);
}
