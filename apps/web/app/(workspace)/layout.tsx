"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Skeleton } from "@chat/ui";
import { api } from "@/lib/api";
import { register } from "@/lib/keyboard-shortcut-registry";
import { Menu, Hash, Settings as SettingsIcon } from "lucide-react";
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
      console.warn("Failed to fetch workspace for breadcrumbs");
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
      console.warn("Failed to fetch channel for breadcrumbs");
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
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);

  // Fetch channels for keyboard navigation
  useEffect(() => {
    if (!user || !params.workspaceSlug) return;
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === params.workspaceSlug);
        if (!ws) return;
        api
          .get<{ channels: Channel[] }>(`/workspaces/${ws.id}/channels`)
          .then((res) => setChannels(res.channels.map((c) => c.slug)))
          .catch(() => console.warn("Failed to fetch channels for keyboard nav"));
      })
      .catch(() => console.warn("Failed to fetch workspace for keyboard nav"));
  }, [user, params.workspaceSlug]);

  // Register keyboard shortcut callbacks
  useEffect(() => {
    if (!params.workspaceSlug) return;
    register("channelUp", () => {
      const current = params.channelId;
      if (!current || channels.length === 0) return;
      const idx = channels.indexOf(current);
      if (idx > 0) {
        router.push(`/${params.workspaceSlug}/${channels[idx - 1]}`);
      }
    });
    register("channelDown", () => {
      const current = params.channelId;
      if (!current || channels.length === 0) return;
      const idx = channels.indexOf(current);
      if (idx < channels.length - 1) {
        router.push(`/${params.workspaceSlug}/${channels[idx + 1]}`);
      }
    });
    register("searchOpen", () => {
      const event = new CustomEvent("chat:search-open");
      document.dispatchEvent(event);
    });
    return () => {
      register("channelUp", null);
      register("channelDown", null);
      register("searchOpen", null);
    };
  }, [params.workspaceSlug, params.channelId, channels, router]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)]" />
          <p className="text-sm text-[var(--color-foreground-secondary)]">Loading workspace...</p>
        </div>
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
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] px-4 py-2 md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-[var(--color-foreground-secondary)] hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            <Menu size={18} />
          </button>
        </div>
        <WorkspaceBreadcrumbsWrapper
          workspaceSlug={params.workspaceSlug}
          channelId={params.channelId}
        />
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-around border-t border-[var(--color-border-primary)] bg-[var(--color-background-primary)] py-2 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-[var(--color-foreground-secondary)]"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
        <Link
          href={params.workspaceSlug ? `/${params.workspaceSlug}` : "/"}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-[var(--color-foreground-secondary)]"
        >
          <Hash size={20} />
          <span>Channels</span>
        </Link>
        <Link
          href={params.workspaceSlug ? `/${params.workspaceSlug}/settings` : "/"}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-[var(--color-foreground-secondary)]"
        >
          <SettingsIcon size={20} />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
