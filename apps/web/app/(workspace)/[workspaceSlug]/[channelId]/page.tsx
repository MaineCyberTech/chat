"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatView } from "@/components/chat/chat-view";
import { api } from "@/lib/api";
import type { Channel, Workspace } from "@chat/db";

export default function ChannelPageClient() {
  const params = useParams<{ workspaceSlug: string; channelId: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === params.workspaceSlug);
        if (!ws) {
          setError(true);
          return;
        }
        setWorkspaceId(ws.id);
        return api.get<{ channels: Channel[] }>(`/workspaces/${ws.id}/channels`);
      })
      .then((chRes) => {
        if (!chRes) return;
        const found =
          chRes.channels.find((ch) => ch.slug === params.channelId) ??
          chRes.channels.find((ch) => ch.id === params.channelId);
        if (found) setChannel(found);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [params.workspaceSlug, params.channelId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <p>Channel not found</p>
      </div>
    );
  }

  if (!channel) {
    return <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <ChatView
      channelId={channel.id}
      workspaceId={workspaceId ?? channel.workspace_id}
      workspaceSlug={params.workspaceSlug}
    />
  );
}
