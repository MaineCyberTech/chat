"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import { api } from "@/lib/api";
import type { Workspace } from "@chat/db";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        if (res.workspaces.length > 0) {
          const first = res.workspaces[0];
          if (first) {
            router.push(`/${first.slug}`);
            return;
          }
        }
        router.push("/?new=true");
      })
      .catch(() => {
        setFetchError(true);
      });
  }, [user, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (user && fetchError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-gray-500">Unable to load your workspaces.</p>
          <p className="text-sm text-gray-400">Please try refreshing the page.</p>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <p className="text-gray-500">Redirecting to your workspace...</p>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full animate-pulse rounded-full bg-blue-600"
              style={{ width: "60%" }}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Sign in with email and password, or use a magic link.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
