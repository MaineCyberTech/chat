import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { executeWithCircuitBreaker } from "./circuit-breaker.js";
import { logger } from "@chat/config/logger.js";

let sharedClient: SupabaseClient | null = null;

function createCircuitBreakerProxy<T extends object>(raw: T, label: string): T {
  return new Proxy(raw, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return new Proxy(value, {
          apply(fn, thisArg, args) {
            return executeWithCircuitBreaker(label, () => Reflect.apply(fn, thisArg, args));
          },
        });
      }
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
