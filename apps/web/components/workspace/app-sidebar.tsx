"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { WorkspaceList } from "./workspace-list";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { ChannelList } from "@/components/channel/channel-list";
import { CreateChannelDialog } from "@/components/channel/create-channel-dialog";
import { Avatar } from "@chat/ui";
import { SidebarGroup } from "@chat/ui";
import type { Workspace } from "@chat/db";
import { api } from "@/lib/api";

interface Props {
  workspaceSlug?: string;
  channelId?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ workspaceSlug, channelId, mobileOpen, onMobileClose }: Props) {
  const { user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [channelRefreshKey, setChannelRefreshKey] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wsLoading, setWsLoading] = useState(false);
  const [sidebarRef, setSidebarRef] = useState<HTMLElement | null>(null);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleChannelCreated = useCallback(() => {
    setChannelRefreshKey((k) => k + 1);
  }, []);

  // Fetch selected workspace by slug to get its ID for channel list
  React.useEffect(() => {
    if (!workspaceSlug) return;
    setWsLoading(true);
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === workspaceSlug);
        setWorkspace(ws ?? null);
      })
      .catch(() => setWorkspace(null))
      .finally(() => setWsLoading(false));
  }, [workspaceSlug]);

  // Focus trap for mobile sidebar
  useEffect(() => {
    if (!mobileOpen || !sidebarRef) return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const container = sidebarRef;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0]!;
      const last = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    const first = container.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, sidebarRef]);

  // Toggle body scroll lock class for mobile sidebar
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.classList.toggle("sidebar-mobile-open", mobileOpen);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[var(--color-dialog-overlay)] md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        ref={setSidebarRef}
        id="sidebar"
        className={`flex h-full w-60 flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] ${
          mobileOpen === undefined
            ? ""
            : mobileOpen
              ? "mobile-open animate-slide-in-left fixed inset-y-0 left-0 z-40"
              : "hidden md:flex"
        }`}
      >
        {/* User area */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] px-3 py-3">
          <Avatar fallback={user?.email ?? "?"} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-foreground-primary)]">
            {user?.email ?? "Chat"}
          </span>
          <button
            onClick={signOut}
            className="shrink-0 rounded px-2 py-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
          >
            Logout
          </button>
        </div>

        {/* Workspace section */}
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarGroup title="Workspaces" defaultOpen>
            <div key={refreshKey}>
              <WorkspaceList activeSlug={workspaceSlug} />
            </div>
            <div className="mt-1">
              <CreateWorkspaceDialog onCreated={handleCreated} />
            </div>
          </SidebarGroup>

          {/* Channel section (shown when a workspace is selected) */}
          {workspaceSlug && (
            <SidebarGroup title="Channels" defaultOpen>
              {wsLoading || !workspace ? (
                <div className="space-y-1 px-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-7 animate-pulse rounded bg-[var(--color-skeleton-bg)]"
                    />
                  ))}
                </div>
              ) : (
                <div key={channelRefreshKey}>
                  <ChannelList
                    workspaceSlug={workspaceSlug}
                    workspaceId={workspace.id}
                    activeChannelId={channelId}
                  />
                </div>
              )}
              {workspace && (
                <div className="mt-1">
                  <CreateChannelDialog
                    workspaceId={workspace.id}
                    onCreated={handleChannelCreated}
                  />
                </div>
              )}
            </SidebarGroup>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border-primary)] px-3 py-2">
          <Link
            href="/"
            className="text-xs text-[var(--color-sidebar-title-fg)] transition-colors hover:text-[var(--color-sidebar-title-fg-hover)]"
          >
            Chat Platform
          </Link>
        </div>
      </aside>
    </>
  );
}
