import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — running without Supabase",
    );
    browserClient = createClient("http://localhost:54321", "local", {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return browserClient;
  }

  browserClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return browserClient;
}
