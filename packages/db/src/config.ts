import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createSupabaseClient(supabaseUrl: string, supabaseKey: string): SupabaseClient {
  client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  return client;
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error(
      "Supabase client not initialized. Call createSupabaseClient() first with valid credentials.",
    );
  }
  return client;
}
