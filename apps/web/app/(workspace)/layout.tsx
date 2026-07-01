"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Skeleton } from "@chat/ui";
import { api } from "@/lib/api";
import type { Workspace, Channel } from "@chat/db";

function WorkspaceBreadcrumbs({
  workspaceSlug,
  channelId,
}: {
  workspaceSlug?: string;
  channelId?: string;
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspace = useCallback(async (slug: string) => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get<{ workspaces: Workspace[] }>("/workspaces");
      const ws = res.workspaces.find((w) => w.slug === slug);
      setWorkspace(ws ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChannel = useCallback(async (wsId: string, chId: string) => {
    if (!wsId || !chId) return;
    try {
      const res = await api.get<{ channels: Channel[] }>(`/workspaces/${wsId}/channels`);
      const ch = res.channels.find((c) => c.id === chId);
      setChannel(ch ?? null);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    fetchWorkspace(workspaceSlug ?? "");
  }, [workspaceSlug, fetchWorkspace]);

  React.useEffect(() => {
    if (workspace && channelId) {
      fetchChannel(workspace.id, channelId);
    }
  }, [workspace, channelId, fetchChannel]);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-4 py-2 text-sm md:px-6">
      <Link
        href="/"
        className="text-[var(--color-foreground-tertiary)] transition-colors hover:text-[var(--color-foreground-primary)]"
      >
        Home
      </Link>
      {workspaceSlug && (
        <>
          <span aria-hidden="true" className="text-[var(--color-foreground-tertiary)]">
            /
          </span>
          <Link
            href={`/${workspaceSlug}`}
            className={
              loading
                ? "cursor-wait text-[var(--color-foreground-tertiary)]"
                : "text-[var(--color-foreground-tertiary)] transition-colors hover:text-[var(--color-foreground-primary)]"
            }
          >
            {loading ? <Skeleton className="h-4 w-20" /> : `# ${workspace?.name ?? workspaceSlug}`}
          </Link>
        </>
      )}
      {channelId && (
        <>
          <span aria-hidden="true" className="text-[var(--color-foreground-tertiary)]">
            /
          </span>
          <span className="max-w-[200px] truncate font-medium text-[var(--color-foreground-primary)]">
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              `# ${channel?.name ?? channelId.slice(0, 8)}`
            )}
          </span>
        </>
      )}
    </nav>
  );
}

function WorkspaceBreadcrumbsWrapper({
  workspaceSlug,
  channelId,
}: {
  workspaceSlug?: string;
  channelId?: string;
}) {
  return <WorkspaceBreadcrumbs workspaceSlug={workspaceSlug} channelId={channelId} />;
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceSlug?: string; channelId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background-primary)]">
        <p className="text-[var(--color-foreground-secondary)]">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // redirect handled by auth context
  }

  return (
    <div className="flex h-screen bg-[var(--color-background-primary)]">
      <AppSidebar
        workspaceSlug={params.workspaceSlug}
        channelId={params.channelId}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <WorkspaceBreadcrumbsWrapper
          workspaceSlug={params.workspaceSlug}
          channelId={params.channelId}
        />
        <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] px-4 py-2 md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded p-1 text-[var(--color-foreground-secondary)] hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            â˜°
          </button>
        </div>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
