"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@chat/ui";
import { X, Link, ExternalLink, Plus, GripVertical } from "lucide-react";

interface ChannelBookmark {
  id: string;
  channel_id: string;
  message_id: string | null;
  title: string;
  url: string | null;
  emoji: string | null;
  created_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  channelId: string;
}

export function ChannelBookmarks({ channelId }: Props) {
  const [bookmarks, setBookmarks] = useState<ChannelBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setLoading(true);
    api
      .get<{ bookmarks: ChannelBookmark[] }>(`/channels/${channelId}/bookmarks`)
      .then((res) => setBookmarks(res.bookmarks))
      .catch(() =>
        addToast({ title: "Error", description: "Failed to load bookmarks", variant: "error" }),
      )
      .finally(() => setLoading(false));
  }, [channelId, addToast]);

  async function handleCreate() {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    try {
      const res = await api.post<{ bookmark: ChannelBookmark }>(
        `/channels/${channelId}/bookmarks`,
        {
          title: newTitle.trim(),
          url: newUrl.trim() || null,
          emoji: newEmoji.trim() || null,
        },
      );
      setBookmarks((prev) => [...prev, res.bookmark]);
      setNewTitle("");
      setNewUrl("");
      setNewEmoji("");
      setShowForm(false);
      addToast({ title: "Bookmark created", variant: "success", duration: 2000 });
    } catch {
      addToast({ title: "Error", description: "Failed to create bookmark", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/channels/${channelId}/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      setDeleteConfirm(null);
      addToast({ title: "Bookmark deleted", variant: "success", duration: 2000 });
    } catch {
      addToast({ title: "Error", description: "Failed to delete bookmark", variant: "error" });
    }
  }

  async function handleDrop() {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    )
      return;
    const updated = [...bookmarks];
    const [moved] = updated.splice(dragItem.current, 1);
    if (!moved) return;
    updated.splice(dragOverItem.current, 0, moved);
    const reordered = updated.map((bm, i) => ({ ...bm, sort_order: i }));
    setBookmarks(reordered);
    dragItem.current = null;
    dragOverItem.current = null;
    try {
      await Promise.all(
        reordered.map((bm) =>
          api.patch(`/channels/${channelId}/bookmarks/${bm.id}`, { sort_order: bm.sort_order }),
        ),
      );
      addToast({ title: "Bookmarks reordered", variant: "success", duration: 2000 });
    } catch {
      addToast({ title: "Error", description: "Failed to save reorder", variant: "error" });
    }
  }

  return (
    <>
      {/* Inline bookmark bar */}
      {bookmarks.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1 border-b px-3 py-1.5"
          style={{
            borderColor: "rgba(var(--center-channel-color-rgb), 0.08)",
            background: "rgba(var(--center-channel-color-rgb), 0.02)",
          }}
        >
          {bookmarks.map((bm) => (
            <a
              key={bm.id}
              href={bm.url ?? "#"}
              target={bm.url ? "_blank" : undefined}
              rel={bm.url ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors hover:bg-[rgba(var(--button-bg-rgb),0.08)]"
              style={{ color: "var(--button-bg)", background: "rgba(var(--button-bg-rgb),0.06)" }}
            >
              {bm.emoji && <span className="text-sm">{bm.emoji}</span>}
              {bm.title}
              {bm.url && <ExternalLink size={10} className="shrink-0" />}
            </a>
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="ml-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs transition-colors"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            aria-label="Add bookmark"
          >
            <Plus size={12} />
          </button>
        </div>
      )}

      {/* Inline add form */}
      {showForm && (
        <div
          className="border-b px-3 py-2"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.08)" }}
        >
          <div className="mb-1 flex gap-2">
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              placeholder=":emoji:"
              className="w-16 rounded px-1.5 py-1 text-xs"
              style={{
                border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
              aria-label="Emoji"
            />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title *"
              className="flex-1 rounded px-2 py-1 text-xs"
              style={{
                border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
              aria-label="Bookmark title"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>
          <div className="flex gap-2">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="flex-1 rounded px-2 py-1 text-xs"
              style={{
                border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
              }}
              aria-label="Bookmark URL"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <button
              onClick={handleCreate}
              disabled={saving || !newTitle.trim()}
              className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
              style={{ background: "var(--button-bg)" }}
            >
              {saving ? "..." : "Add"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNewTitle("");
                setNewUrl("");
                setNewEmoji("");
              }}
              className="rounded px-2 py-1 text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="max-w-sm rounded-lg bg-[var(--center-channel-bg)] p-6 shadow-[var(--elevation-5)]"
            role="alertdialog"
            aria-label="Delete bookmark"
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
              Delete bookmark?
            </h3>
            <p
              className="mt-1 text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--dnd-indicator)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RHS Bookmark list tab content */}
      {loading ? (
        <div className="animate-pulse space-y-2 p-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-8 rounded"
              style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
            />
          ))}
        </div>
      ) : (
        <div>
          {(bookmarks.length > 0 || reorderMode) && (
            <div className="flex items-center justify-between px-3 py-1.5">
              <span
                className="text-xs"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setReorderMode(!reorderMode)}
                className="text-xs font-medium"
                style={{ color: "var(--button-bg)" }}
              >
                {reorderMode ? "Done" : "Reorder"}
              </button>
            </div>
          )}
          {bookmarks.length > 0 ? (
            <div className="space-y-0.5 px-2">
              {(reorderMode ? [...bookmarks] : bookmarks).map((bm, idx) => (
                <div
                  key={bm.id}
                  draggable={reorderMode}
                  onDragStart={() => {
                    dragItem.current = idx;
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    dragOverItem.current = idx;
                  }}
                  onDrop={handleDrop}
                  onDragEnd={() => {
                    if (!reorderMode) {
                      dragItem.current = null;
                      dragOverItem.current = null;
                    }
                  }}
                  className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${reorderMode ? "cursor-grab border border-dashed active:cursor-grabbing" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"}`}
                  style={{
                    borderColor: reorderMode ? "rgba(var(--button-bg-rgb),0.3)" : "transparent",
                  }}
                >
                  {reorderMode && (
                    <GripVertical
                      size={14}
                      className="shrink-0"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.4)" }}
                    />
                  )}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
                    style={{
                      background: "rgba(var(--button-bg-rgb),0.08)",
                      color: "var(--button-bg)",
                    }}
                  >
                    {bm.emoji ? <span className="text-sm">{bm.emoji}</span> : <Link size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium"
                      style={{ color: "var(--center-channel-color)" }}
                    >
                      {bm.title}
                    </p>
                    {bm.url && (
                      <p
                        className="truncate text-[10px]"
                        style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                      >
                        {bm.url}
                      </p>
                    )}
                  </div>
                  {!reorderMode && (
                    <button
                      onClick={() => setDeleteConfirm(bm.id)}
                      className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[rgba(var(--dnd-indicator-rgb),0.08)]"
                      aria-label="Delete bookmark"
                    >
                      <X size={12} style={{ color: "var(--dnd-indicator)" }} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowForm(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                <Plus size={14} /> Add bookmark
              </button>
            </div>
          ) : (
            <div className="p-4 text-center">
              <div
                className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "rgba(var(--button-bg-rgb), 0.08)" }}
              >
                <Link size={18} style={{ color: "var(--button-bg)" }} />
              </div>
              <p
                className="text-xs"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
              >
                No bookmarks yet
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-xs font-medium"
                style={{ color: "var(--button-bg)" }}
              >
                Add your first bookmark
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
