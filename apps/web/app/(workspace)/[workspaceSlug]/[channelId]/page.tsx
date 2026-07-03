"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ChatView } from "@/components/chat/chat-view";
import { api } from "@/lib/api";
import { Skeleton } from "@chat/ui";
import type { Channel, Workspace } from "@chat/db";

const CACHE_TTL = 60_000;
let workspacesCache: { data: Workspace[]; ts: number } | null = null;

async function getCachedWorkspaces(): Promise<Workspace[]> {
  const now = Date.now();
  if (workspacesCache && now - workspacesCache.ts < CACHE_TTL) {
    return workspacesCache.data;
  }
  const res = await api.get<{ workspaces: Workspace[] }>("/workspaces");
  workspacesCache = { data: res.workspaces, ts: now };
  return res.workspaces;
}

const channelsCaches = new Map<string, { data: Channel[]; ts: number }>();

async function getCachedChannels(wsId: string): Promise<Channel[]> {
  const now = Date.now();
  const cached = channelsCaches.get(wsId);
  if (cached && now - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  const res = await api.get<{ channels: Channel[] }>(`/workspaces/${wsId}/channels`);
  channelsCaches.set(wsId, { data: res.channels, ts: now });
  return res.channels;
}

export default function ChannelPageClient() {
  const params = useParams<{ workspaceSlug: string; channelId: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    getCachedWorkspaces()
      .then((workspaces) => {
        const ws = workspaces.find((w) => w.slug === params.workspaceSlug);
        if (!ws) {
          setError(true);
          return;
        }
        setWorkspaceId(ws.id);
        return getCachedChannels(ws.id);
      })
      .then((channels) => {
        if (!channels) return;
        const found =
          channels.find((ch) => ch.slug === params.channelId) ??
          channels.find((ch) => ch.id === params.channelId);
        if (found) setChannel(found);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => {
        fetchingRef.current = false;
      });
  }, [params.workspaceSlug, params.channelId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-foreground-tertiary)]">
        <p>Channel not found</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-16 w-2/3" />
      </div>
    );
  }

  return (
    <ChatView
      channelId={channel.id}
      channelName={channel.name}
      workspaceId={workspaceId ?? channel.workspace_id}
      workspaceSlug={params.workspaceSlug}
    />
  );
}
