"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { WorkspaceList } from "./workspace-list";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { ChannelList } from "@/components/channel/channel-list";
import { CreateChannelDialog } from "@/components/channel/create-channel-dialog";
import { Avatar } from "@chat/ui";
import type { Workspace } from "@chat/db";
import { api } from "@/lib/api";

interface Props {
  workspaceSlug?: string;
  channelId?: string;
}

export function AppSidebar({ workspaceSlug, channelId }: Props) {
  const { user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [channelRefreshKey, setChannelRefreshKey] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wsLoading, setWsLoading] = useState(false);

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

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      {/* User area */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-3 dark:border-gray-800">
        <Avatar fallback={user?.email ?? "?"} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{user?.email ?? "Chat"}</span>
        <button
          onClick={signOut}
          className="shrink-0 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          Logout
        </button>
      </div>

      {/* Workspace section */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="mb-1 px-3">
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Workspaces
          </h2>
        </div>
        <div key={refreshKey}>
          <WorkspaceList activeSlug={workspaceSlug} />
        </div>
        <div className="mt-1">
          <CreateWorkspaceDialog onCreated={handleCreated} />
        </div>

        {/* Channel section (shown when a workspace is selected) */}
        {workspaceSlug && (
          <div className="mt-4">
            <div className="mb-1 px-3">
              <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Channels
              </h2>
            </div>
            {wsLoading || !workspace ? (
              <div className="space-y-1 px-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-7 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
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
                <CreateChannelDialog workspaceId={workspace.id} onCreated={handleChannelCreated} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-800">
        <Link
          href="/"
          className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
        >
          Chat Platform
        </Link>
      </div>
    </aside>
  );
}
