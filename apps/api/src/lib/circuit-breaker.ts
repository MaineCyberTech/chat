import CircuitBreaker from "opossum";
import { logger } from "./logger.js";

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
  name?: string;
}

export interface CircuitBreakerStats {
  name: string;
  status: "open" | "closed" | "half-open";
  failures: number;
  successes: number;
  rejects: number;
  fires: number;
  timeouts: number;
  cacheHits: number;
  cacheMisses: number;
  latencyMean: number;
}

const defaultOptions: CircuitBreakerOptions = {
  timeout: 10000, // 10 second timeout
  errorThresholdPercentage: 50, // Open circuit if 50% errors
  resetTimeout: 30000, // Try again after 30 seconds
  volumeThreshold: 10, // Minimum 10 requests before calculating error rate
};

const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker<T, Args extends unknown[]>(
  name: string,
  fn: (...args: Args) => Promise<T>,
  options: CircuitBreakerOptions = {},
): CircuitBreaker {
  const key = name;
  let breaker = breakers.get(key);

  if (!breaker) {
    const mergedOptions = { ...defaultOptions, ...options, name };
    breaker = new CircuitBreaker(fn, mergedOptions);

    breaker.on("open", () => {
      logger.warn("Circuit breaker opened", { name });
    });

    breaker.on("close", () => {
      logger.info("Circuit breaker closed", { name });
    });

    breaker.on("halfOpen", () => {
      logger.info("Circuit breaker half-open", { name });
    });

    breaker.on("reject", () => {
      logger.warn("Circuit breaker rejected request", { name });
    });

    breaker.on("timeout", () => {
      logger.warn("Circuit breaker timeout", { name });
    });

    breaker.on("failure", (err: Error) => {
      logger.warn("Circuit breaker recorded failure", { name, error: err?.message });
    });

    breakers.set(key, breaker);
  }

  return breaker;
}

export async function executeWithCircuitBreaker<T, Args extends unknown[]>(
  name: string,
  fn: (...args: Args) => Promise<T>,
  args: Args,
  options: CircuitBreakerOptions = {},
): Promise<T> {
  const breaker = getCircuitBreaker(name, fn, options);
  return breaker.fire(...args) as Promise<T>;
}

export function getCircuitBreakerStats(): CircuitBreakerStats[] {
  const stats: CircuitBreakerStats[] = [];
  for (const [name, breaker] of breakers.entries()) {
    const s = breaker.stats;
    stats.push({
      name,
      status: breaker.opened ? "open" : breaker.halfOpen ? "half-open" : "closed",
      failures: s.failures,
      successes: s.successes,
      rejects: s.rejects,
      fires: s.fires,
      timeouts: s.timeouts,
      cacheHits: s.cacheHits,
      cacheMisses: s.cacheMisses,
      latencyMean: s.latencyMean,
    });
  }
  return stats;
}

export function resetCircuitBreaker(name: string): boolean {
  const breaker = breakers.get(name);
  if (breaker) {
    breaker.close();
    return true;
  }
  return false;
}

export function shutdownAllCircuitBreakers(): void {
  for (const [, breaker] of breakers.entries()) {
    breaker.shutdown();
  }
  breakers.clear();
}
