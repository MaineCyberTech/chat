"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Skeleton } from "@chat/ui";
import type { Channel } from "@chat/db";

interface Props {
  workspaceSlug: string;
  workspaceId: string;
  activeChannelId?: string;
}

export function ChannelList({ workspaceSlug, workspaceId, activeChannelId }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ channels: Channel[] }>(`/workspaces/${workspaceId}/channels`)
      .then((res) => setChannels(res.channels))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="space-y-1 px-2">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-7 w-5/6" />
      </div>
    );
  }

  if (channels.length === 0) {
    return <p className="px-2 text-sm text-[var(--color-foreground-tertiary)]">No channels yet</p>;
  }

  return (
    <ul className="space-y-0.5" role="listbox" aria-label="Channels">
      {channels.map((ch) => (
        <li key={ch.id} role="option" aria-selected={activeChannelId === ch.id}>
          <Link
            href={`/${workspaceSlug}/${ch.slug}`}
            className={`block rounded-md px-3 py-1 text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
              activeChannelId === ch.id
                ? "bg-[var(--color-background-tertiary)] font-medium"
                : "text-[var(--color-foreground-secondary)]"
            }`}
          >
            # {ch.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
