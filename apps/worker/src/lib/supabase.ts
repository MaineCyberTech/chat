import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { executeWithCircuitBreaker } from "./circuit-breaker.js";
import { logger } from "@chat/config/logger.js";

let sharedClient: SupabaseClient | null = null;

/**
 * Guards a PostgREST builder with the circuit breaker at *await* time.
 *
 * The previous implementation wrapped every function on the client, which turned
 * `supabase.from("t")` into a Promise — so the builder chain broke with
 * `TypeError: supabase.from(...).select is not a function`, and every worker
 * database operation failed. Only the terminal `then` is intercepted here;
 * intermediate builder methods pass through and keep returning builders.
 */
function wrapBuilder(builder: object, label: string): object {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "then") {
        return (
          onFulfilled?: (value: unknown) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) =>
          executeWithCircuitBreaker(label, () =>
            (value as (f?: unknown, r?: unknown) => Promise<unknown>).call(target),
          ).then(onFulfilled, onRejected);
      }

      if (typeof value !== "function") return value;

      return (...args: unknown[]) => {
        const result = Reflect.apply(value, target, args);
        // Builder methods return the next builder; keep that one guarded too.
        if (
          result !== null &&
          typeof result === "object" &&
          typeof (result as { then?: unknown }).then === "function"
        ) {
          return wrapBuilder(result as object, label);
        }
        return result;
      };
    },
  });
}

function createCircuitBreakerProxy<T extends object>(raw: T, label: string): T {
  return new Proxy(raw, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      // `from` and `rpc` return builders. Guard the builder, not the call.
      if (prop === "from" || prop === "rpc") {
        return (...args: unknown[]) => {
          const result = Reflect.apply(value as (...a: unknown[]) => unknown, target, args);
          return wrapBuilder(result as object, label);
        };
      }

      // auth / storage / everything else passes through untouched.
      return value;
    },
  });
}

export function createSupabaseClient(): SupabaseClient {
  if (sharedClient) return sharedClient;
  const env = loadEnv();
  const raw = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  sharedClient = createCircuitBreakerProxy(raw, "supabase:query");
  logger.info("Supabase client created with circuit breaker protection");
  return sharedClient;
}

export { executeWithCircuitBreaker } from "./circuit-breaker.js";

export async function supabaseQuery<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return executeWithCircuitBreaker(`supabase:${label}`, fn);
}
