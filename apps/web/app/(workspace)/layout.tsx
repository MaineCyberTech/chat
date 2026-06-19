"use client";

import React from "react";
import { redirect, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppSidebar } from "@/components/workspace/app-sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceSlug?: string; channelId?: string }>();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
    return null;
  }

  return (
    <div className="flex h-screen">
      <AppSidebar workspaceSlug={params.workspaceSlug} channelId={params.channelId} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
