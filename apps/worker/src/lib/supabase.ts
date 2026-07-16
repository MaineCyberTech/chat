import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "@chat/config/env-schema.js";
import { executeWithCircuitBreaker } from "./circuit-breaker.js";

let sharedClient: SupabaseClient | null = null;

export function createSupabaseClient(): SupabaseClient {
  if (sharedClient) return sharedClient;
  const env = loadEnv();
  sharedClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return sharedClient;
}

export async function supabaseQuery<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return executeWithCircuitBreaker(`supabase:${label}`, fn);
}
