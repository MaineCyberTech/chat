"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Skeleton, useToast } from "@chat/ui";
import { Trash2 } from "lucide-react";
import type { Channel } from "@chat/db";

interface Props {
  workspaceSlug: string;
  workspaceId: string;
  activeChannelId?: string;
}

export function ChannelList({ workspaceSlug, workspaceId, activeChannelId }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api
      .get<{ channels: Channel[] }>(`/workspaces/${workspaceId}/channels`)
      .then((res) => setChannels(res.channels))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  async function handleDelete(channelId: string) {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/channels/${channelId}`);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setDeleteConfirmId(null);
      addToast({ title: "Channel deleted", variant: "success", duration: 3000 });
    } catch {
      setDeleteError("Failed to delete channel.");
      addToast({ title: "Error", description: "Failed to delete channel.", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

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
    <>
      <ul className="space-y-0.5" role="listbox" aria-label="Channels">
        {channels.map((ch) => (
          <li key={ch.id} role="option" aria-selected={activeChannelId === ch.id}>
            <div className="group flex items-center">
              <Link
                href={`/${workspaceSlug}/${ch.slug}`}
                className={`block flex-1 rounded-md px-3 py-1 text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
                  activeChannelId === ch.id
                    ? "bg-[var(--color-background-tertiary)] font-medium"
                    : "text-[var(--color-foreground-secondary)]"
                }`}
              >
                # {ch.name}
              </Link>
              <button
                onClick={() => setDeleteConfirmId(ch.id)}
                className="mr-1 flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--color-background-tertiary)]"
                aria-label={`Delete channel ${ch.name}`}
              >
                <Trash2 size={12} className="text-[var(--color-foreground-tertiary)]" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-lg bg-[var(--color-dialog-bg)] p-6 shadow-[var(--shadow-xl)]"
            role="alertdialog"
            aria-label="Delete channel"
          >
            <h3 className="text-sm font-semibold text-[var(--color-foreground-primary)]">
              Delete channel?
            </h3>
            <p className="mt-1 text-xs text-[var(--color-foreground-secondary)]">
              This will permanently delete the channel and all its messages. This cannot be undone.
            </p>
            {deleteError && (
              <p className="mt-2 text-xs text-[var(--color-status-danger-fg)]" role="alert">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteError("");
                }}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-foreground-secondary)] hover:bg-[var(--color-background-tertiary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="rounded-md bg-[var(--color-status-danger-fg)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
