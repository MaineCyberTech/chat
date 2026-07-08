import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";
import { logger } from "./logger.js";

const FETCH_TIMEOUT = 15_000;

function wrapBuilder(builder: object, table: string, label: string): object {
  return new Proxy(builder, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== "function") return value;
      if (prop === "then") {
        return (onfulfilled: unknown, onrejected: unknown) => {
          const start = performance.now();
          const thenFn = (target as PromiseLike<unknown>).then;
          return thenFn.call(target,
            (result: unknown) => {
              const duration = (performance.now() - start).toFixed(1);
              logger.debug("DB query", { table, label, duration: `${duration}ms`, rows: (result as { data?: unknown[] })?.data?.length ?? 0 });
              if (typeof onfulfilled === "function") return onfulfilled(result);
              return result;
            },
            (error: Error) => {
              const duration = (performance.now() - start).toFixed(1);
              logger.warn("DB query failed", { table, label, duration: `${duration}ms`, error: error?.message });
              if (typeof onrejected === "function") return onrejected(error);
              throw error;
            },
          );
        };
      }
      return (...args: unknown[]) => {
        const result = value.apply(target, args);
        if (result != null && typeof (result as Record<string, unknown>).then === "function") {
          return wrapBuilder(result as object, table, label);
        }
        return result;
      };
    },
  });
}

function createLoggedClient(url: string, key: string, label: string, opts?: Record<string, unknown>): SupabaseClient {
  const client = createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: createFetchWithTimeout(FETCH_TIMEOUT) },
    ...opts,
  } as never);
  const handler: ProxyHandler<SupabaseClient> = {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          const builder = Reflect.apply(target.from, target, [table]);
          return wrapBuilder(builder, table, label);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  };
  return new Proxy(client, handler);
}

function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;
let anonUrl: string | null = null;
let anonKey: string | null = null;

export function initSupabase(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required to initialize Supabase");
  }
  anonUrl = env.SUPABASE_URL;
  anonKey = env.SUPABASE_ANON_KEY;
  anonClient = createLoggedClient(anonUrl, anonKey, "anon");

  let connectionCount = 1;
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    adminClient = createLoggedClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, "admin");
    connectionCount++;
  }

  logger.info("Supabase clients initialized", { connectionCount, url: env.SUPABASE_URL });

  return anonClient;
}

export function getSupabase(): SupabaseClient {
  if (!anonClient) {
    throw new Error("Supabase client not initialized. Call initSupabase() first.");
  }
  return anonClient;
}

// Returns a Supabase client with service_role privileges.
// Use for admin operations (user management, bypassing RLS, etc.).
// Requires SUPABASE_SERVICE_ROLE_KEY to be set.
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    throw new Error(
      "Supabase admin client not initialized. Set SUPABASE_SERVICE_ROLE_KEY and call initSupabase() first.",
    );
  }
  return adminClient;
}

// Creates a Supabase client with the user's JWT for RLS-aware queries.
// Each request should get its own client to avoid session conflicts.
// Passes the JWT via Authorization header so RLS policies see auth.uid().
export function getSupabaseForUser(jwt: string): SupabaseClient {
  if (!anonUrl || !anonKey) {
    throw new Error("Supabase not initialized. Call initSupabase() first.");
  }
  return createLoggedClient(anonUrl, anonKey, "user", {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  });
}

export function getAdminOrAnon(): SupabaseClient {
  return adminClient ?? getSupabase();
}
