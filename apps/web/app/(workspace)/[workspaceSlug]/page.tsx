"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CreateChannelDialog } from "@/components/channel/create-channel-dialog";
import type { Workspace } from "@chat/db";

export default function WorkspacePageClient() {
  const params = useParams<{ workspaceSlug: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channelRefresh, setChannelRefresh] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === params.workspaceSlug);
        setWorkspace(ws ?? null);
      })
      .catch(() => setWorkspace(null))
      .finally(() => setLoading(false));
  }, [params.workspaceSlug]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>;
  }

  if (!workspace) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Workspace not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-6 py-3 dark:border-gray-800">
        <h1 className="text-lg font-semibold"># {workspace.name}</h1>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold">Welcome to {workspace.name}</h2>
        <p className="max-w-md text-gray-500 dark:text-gray-400">
          Select a channel from the sidebar or create a new one to start messaging.
        </p>
        <div key={channelRefresh}>
          <CreateChannelDialog
            workspaceId={workspace.id}
            onCreated={() => setChannelRefresh((k) => k + 1)}
          />
        </div>
      </div>
    </div>
  );
}
