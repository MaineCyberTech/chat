"use client";

import React, { useState } from "react";
import { redirect, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceSlug?: string; channelId?: string }>();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <AppSidebar
        workspaceSlug={params.workspaceSlug}
        channelId={params.channelId}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2 md:hidden dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
