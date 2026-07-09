"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Skeleton, useToast } from "@chat/ui";
import {
  Trash2,
  Hash,
  Lock,
  GripVertical,
  Link2,
  Copy,
  ExternalLink,
  Bookmark,
  Bell,
  BellOff,
  LogOut,
  CheckCheck,
} from "lucide-react";
import type { Channel } from "@chat/db";
import { useAuth } from "@/components/auth/auth-context";

interface UnreadInfo {
  count: number;
  mentions: number;
}

interface Props {
  workspaceSlug: string;
  workspaceId: string;
  activeChannelId?: string;
  showUnreads?: boolean;
  unreadChannels?: Set<string>;
  unreads?: Map<string, UnreadInfo>;
  categories?: Array<{ id: string; name: string }>;
  onMoveToCategory?: (channelId: string, categoryId: string) => void;
}

export function ChannelList({
  workspaceSlug,
  workspaceId,
  activeChannelId,
  showUnreads,
  unreadChannels,
  unreads,
  categories,
  onMoveToCategory,
}: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; channel: Channel } | null>(
    null,
  );
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mutedChannels, setMutedChannels] = useState<Set<string>>(new Set());
  const [subMenu, setSubMenu] = useState<{ type: "move-category"; channelId: string } | null>(null);

  useEffect(() => {
    api
      .get<{ channels: Channel[] }>(`/workspaces/${workspaceId}/channels`)
      .then((res) => setChannels(res.channels))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node))
        setContextMenu(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setContextMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

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

  function handleMarkAsRead(channelId: string) {
    document.dispatchEvent(new CustomEvent("chat:mark-read", { detail: { channelId } }));
    setContextMenu(null);
  }

  async function handleToggleFavorite(channelId: string) {
    const isFav = favorites.has(channelId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
    setContextMenu(null);
    try {
      await api.patch(`/channels/${channelId}`, { favorite: !isFav });
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(channelId);
        else next.delete(channelId);
        return next;
      });
      console.warn(
        "Favorite API not available. Suggested: PATCH /channels/:id with { favorite: boolean }",
      );
    }
  }

  async function handleToggleMute(channelId: string) {
    const isMuted = mutedChannels.has(channelId);
    setMutedChannels((prev) => {
      const next = new Set(prev);
      if (isMuted) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
    setContextMenu(null);
    try {
      await api.put(`/channels/${channelId}/notification-preference`, { notify: isMuted });
    } catch {
      setMutedChannels((prev) => {
        const next = new Set(prev);
        if (isMuted) next.add(channelId);
        else next.delete(channelId);
        return next;
      });
      addToast({
        title: "Error",
        description: "Failed to update mute preference",
        variant: "error",
      });
    }
  }

  async function handleLeaveChannel(channelId: string) {
    if (!user) return;
    setContextMenu(null);
    try {
      await api.delete(`/channels/${channelId}/members/${user.id}`);
      addToast({ title: "Left channel", variant: "success", duration: 2000 });
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
    } catch {
      addToast({ title: "Error", description: "Failed to leave channel", variant: "error" });
    }
  }

  function handleDragStart(e: React.DragEvent, channelId: string) {
    dragNode.current = e.target as HTMLElement;
    setDragId(channelId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, channelId: string) {
    e.preventDefault();
    setDragOverId(channelId);
  }

  function handleDragEnd() {
    if (!dragId || !dragOverId || dragId === dragOverId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const reordered = [...channels];
    const fromIdx = reordered.findIndex((c) => c.id === dragId);
    const toIdx = reordered.findIndex((c) => c.id === dragOverId);
    if (fromIdx === -1 || toIdx === -1) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const [moved] = reordered.splice(fromIdx, 1);
    if (!moved) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    reordered.splice(toIdx, 0, moved);
    setChannels(reordered);
    setDragId(null);
    setDragOverId(null);
    // Persist new order
    const newOrder = reordered.map((c) => c.id);
    api.patch(`/workspaces/${workspaceId}/channels/reorder`, { channelIds: newOrder }).catch(() => {
      addToast({ title: "Error", description: "Failed to save channel order", variant: "error" });
    });
  }

  function channelIcon(ch: Channel) {
    if (ch.channel_type === "dm" || ch.name.startsWith("dm-")) {
      return <span className="channel-type-icon mr-2 text-xs">&#x1f464;</span>;
    }
    if (ch.channel_type === "group" || ch.name.startsWith("gm-")) {
      return <span className="channel-type-icon mr-2 text-xs">&#x1f465;</span>;
    }
    if (ch.channel_type === "private" || ch.is_private) {
      return <Lock size={14} className="channel-type-icon mr-2" />;
    }
    return <Hash size={14} className="channel-type-icon mr-2" />;
  }

  if (loading) {
    return (
      <div className="space-y-1 px-3">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-7 w-3/4" />
      </div>
    );
  }

  const filteredChannels =
    showUnreads && unreadChannels ? channels.filter((c) => unreadChannels.has(c.id)) : channels;

  if (showUnreads && filteredChannels.length === 0) {
    return (
      <p className="px-5 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
        No unread channels
      </p>
    );
  }

  if (channels.length === 0) {
    return (
      <p className="px-5 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
        No channels yet
      </p>
    );
  }

  return (
    <>
      <ul role="listbox" aria-label="Channels">
        {filteredChannels.map((ch) => {
          const isActive = activeChannelId === ch.id;
          const isDragging = dragId === ch.id;
          const isDragOver = dragOverId === ch.id;
          const unreadInfo = unreads?.get(ch.id);
          const hasUnread = unreadInfo && unreadInfo.count > 0 && !isActive;
          return (
            <li
              key={ch.id}
              role="option"
              aria-selected={isActive}
              draggable
              onDragStart={(e) => handleDragStart(e, ch.id)}
              onDragOver={(e) => handleDragOver(e, ch.id)}
              onDragEnd={handleDragEnd}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, channel: ch });
              }}
              style={{
                opacity: isDragging ? 0.5 : 1,
                borderTop: isDragOver
                  ? "2px solid var(--sidebar-text-active-border)"
                  : "2px solid transparent",
              }}
            >
              <div className="group mm-sidebar-channel">
                <Link
                  href={`/${workspaceSlug}/${ch.slug}`}
                  className="flex w-full items-center px-5 text-sm transition-colors"
                  style={{
                    height: 32,
                    color: isActive ? "var(--sidebar-text-active-color)" : "var(--sidebar-text)",
                    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    paddingLeft: isActive ? 14 : 17,
                    borderLeft: isActive
                      ? "4px solid var(--sidebar-text-active-border)"
                      : "4px solid transparent",
                    borderRadius: "0 4px 4px 0",
                  }}
                >
                  <GripVertical
                    size={10}
                    className="mr-1 opacity-0 transition-opacity group-hover:opacity-40"
                    style={{ color: "rgba(255,255,255,0.5)", cursor: "grab" }}
                  />
                  {channelIcon(ch)}
                  <span
                    className="truncate"
                    style={{
                      fontWeight: hasUnread ? 600 : 400,
                      color: hasUnread ? "var(--sidebar-unread-text)" : undefined,
                    }}
                  >
                    {ch.name}
                  </span>
                  {hasUnread && <span className="sidebar-unread-dot ml-auto" />}
                  {unreadInfo && unreadInfo.mentions > 0 && !isActive && (
                    <span className="sidebar-unread-badge ml-auto">
                      {unreadInfo.mentions > 99 ? "99+" : unreadInfo.mentions}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setDeleteConfirmId(ch.id)}
                  className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  aria-label={`Delete channel ${ch.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {contextMenu && !subMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 w-48 rounded-lg border py-1 shadow-[var(--elevation-4)]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          }}
        >
          <button
            onClick={() => {
              const url = `${window.location.origin}/${workspaceSlug}/${contextMenu.channel.slug}`;
              navigator.clipboard
                .writeText(url)
                .then(() => {
                  addToast({ title: "Link copied", variant: "success", duration: 2000 });
                })
                .catch(() => {});
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--center-channel-color)" }}
          >
            <Link2 size={14} />
            Copy link
          </button>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(contextMenu.channel.name)
                .then(() => {
                  addToast({ title: "Name copied", variant: "success", duration: 2000 });
                })
                .catch(() => {});
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--center-channel-color)" }}
          >
            <Copy size={14} />
            Copy name
          </button>
          <button
            onClick={() => {
              router.push(`/${workspaceSlug}/${contextMenu.channel.slug}`);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--center-channel-color)" }}
          >
            <ExternalLink size={14} />
            Go to channel
          </button>
          <div
            className="my-1"
            style={{ borderTop: "1px solid rgba(var(--center-channel-color-rgb), 0.08)" }}
          />
          {unreads?.get(contextMenu.channel.id) &&
            unreads.get(contextMenu.channel.id)!.count > 0 && (
              <button
                onClick={() => handleMarkAsRead(contextMenu.channel.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                style={{ color: "var(--center-channel-color)" }}
              >
                <CheckCheck size={14} />
                Mark as read
              </button>
            )}
          <button
            onClick={() => handleToggleFavorite(contextMenu.channel.id)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{
              color: favorites.has(contextMenu.channel.id)
                ? "var(--button-bg)"
                : "var(--center-channel-color)",
            }}
          >
            <Bookmark
              size={14}
              fill={favorites.has(contextMenu.channel.id) ? "var(--button-bg)" : "none"}
            />
            {favorites.has(contextMenu.channel.id) ? "Unfavorite" : "Favorite"}
          </button>
          <button
            onClick={() => handleToggleMute(contextMenu.channel.id)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--center-channel-color)" }}
          >
            {mutedChannels.has(contextMenu.channel.id) ? <Bell size={14} /> : <BellOff size={14} />}
            {mutedChannels.has(contextMenu.channel.id) ? "Unmute" : "Mute"}
          </button>
          {categories && categories.length > 0 && onMoveToCategory && (
            <button
              onClick={() =>
                setSubMenu({ type: "move-category", channelId: contextMenu.channel.id })
              }
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
              style={{ color: "var(--center-channel-color)" }}
            >
              <ExternalLink size={14} />
              Move to category
              <span
                className="ml-auto"
                style={{ color: "rgba(var(--center-channel-color-rgb),0.4)" }}
              >
                â–¶
              </span>
            </button>
          )}
          <div
            className="my-1"
            style={{ borderTop: "1px solid rgba(var(--center-channel-color-rgb), 0.08)" }}
          />
          <button
            onClick={() => handleLeaveChannel(contextMenu.channel.id)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--center-channel-color)" }}
          >
            <LogOut size={14} />
            Leave channel
          </button>
          <div
            className="my-1"
            style={{ borderTop: "1px solid rgba(var(--center-channel-color-rgb), 0.08)" }}
          />
          <button
            onClick={() => {
              setDeleteConfirmId(contextMenu.channel.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--dnd-indicator-rgb,235,66,90),0.08)]"
            style={{ color: "var(--dnd-indicator)" }}
          >
            <Trash2 size={14} />
            Delete channel
          </button>
        </div>
      )}

      {subMenu && subMenu.type === "move-category" && contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 w-48 rounded-lg border py-1 shadow-[var(--elevation-4)]"
          style={{
            left: contextMenu.x + 192,
            top: contextMenu.y,
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          }}
        >
          <button
            onClick={() => setSubMenu(null)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--center-channel-color)" }}
          >
            â† Back
          </button>
          <div
            className="my-1"
            style={{ borderTop: "1px solid rgba(var(--center-channel-color-rgb), 0.08)" }}
          />
          {(categories ?? []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onMoveToCategory?.(subMenu.channelId, cat.id);
                setSubMenu(null);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
              style={{ color: "var(--center-channel-color)" }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-lg p-6"
            style={{ background: "var(--center-channel-bg)" }}
            role="alertdialog"
            aria-label="Delete channel"
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
              Delete channel?
            </h3>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              This will permanently delete the channel and all its messages.
            </p>
            {deleteError && (
              <p className="mt-2 text-xs" style={{ color: "var(--error-text)" }} role="alert">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteError("");
                }}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--dnd-indicator)" }}
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
