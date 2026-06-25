import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "../config/env.js";

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function initSupabase(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required to initialize Supabase");
  }
  anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
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
export function getSupabaseForUser(jwt: string): SupabaseClient {
  if (!anonClient) {
    throw new Error("Supabase not initialized. Call initSupabase() first.");
  }
  return createClient(anonClient.supabaseUrl, anonClient.supabaseKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function getAdminOrAnon(): SupabaseClient {
  return adminClient ?? getSupabase();
}
