import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";

const FETCH_TIMEOUT = 15_000;

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
  anonClient = createClient(anonUrl, anonKey, {
    auth: { persistSession: false },
    global: { fetch: createFetchWithTimeout(FETCH_TIMEOUT) },
  });

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: createFetchWithTimeout(FETCH_TIMEOUT) },
    });
  }

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
  if (!anonClient || !anonUrl || !anonKey) {
    throw new Error("Supabase not initialized. Call initSupabase() first.");
  }
  return createClient(anonUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      fetch: createFetchWithTimeout(FETCH_TIMEOUT),
    },
    auth: { persistSession: false },
  });
}

export function getAdminOrAnon(): SupabaseClient {
  return adminClient ?? getSupabase();
}
