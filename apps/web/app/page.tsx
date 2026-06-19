"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { LandingShell } from "@/components/home/landing-shell";
import { Skeleton } from "@chat/ui";
import { api } from "@/lib/api";
import type { Workspace } from "@chat/db";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        if (res.workspaces.length > 0) {
          router.replace(`/${res.workspaces[0].slug}`);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, [user, loading, router]);

  if (loading || (user && checking)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </main>
    );
  }

  if (user) return null;

  return <LandingShell />;
}
