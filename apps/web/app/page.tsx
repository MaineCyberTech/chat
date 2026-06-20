"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { LandingShell } from "@/components/home/landing-shell";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { Button, Skeleton } from "@chat/ui";
import { api } from "@/lib/api";
import type { Workspace } from "@chat/db";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [noWorkspace, setNoWorkspace] = useState(false);

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
          const first = res.workspaces[0];
          if (first) {
            router.replace(`/${first.slug}`);
            return;
          }
        }
        setNoWorkspace(true);
        setChecking(false);
      })
      .catch(() => {
        setNoWorkspace(true);
        setChecking(false);
      });
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

  if (user && noWorkspace) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome!</h1>
          <p className="max-w-md text-gray-500 dark:text-gray-400">
            Create your first workspace to get started.
          </p>
        </div>
        <CreateWorkspaceDialog>
          <Button>Create Workspace</Button>
        </CreateWorkspaceDialog>
      </main>
    );
  }

  if (user) return null;

  return <LandingShell />;
}
