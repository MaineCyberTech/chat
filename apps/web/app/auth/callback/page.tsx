"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth
      .getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (sessionError || !session) {
          setError("Authentication failed. Please try signing in again.");
        } else {
          router.push("/");
        }
      })
      .catch(() => {
        setError("An unexpected error occurred.");
      });
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-gray-500">Completing sign in...</p>
    </main>
  );
}
