"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Avatar, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import type { Message, UserProfile } from "@chat/db";

const GROUP_GAP_MS = 5 * 60 * 1000;
const QUICK_EMOJIS = ["👍", "❤️", "😄", "😮", "😢", "🎉"];

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface Props {
  messages: Message[];
  currentUserId?: string;
  profiles: Map<string, UserProfile>;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onThreadOpen?: (message: Message) => void;
  replyCounts?: Map<string, number>;
  sendingIds?: Set<string>;
}

function authorName(userId: string, profiles: Map<string, UserProfile>): string {
  const p = profiles.get(userId);
  return p?.display_name ?? p?.email?.split("@")[0] ?? userId.slice(0, 8);
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avatarUrl(userId: string, profiles: Map<string, UserProfile>): string | undefined {
  return profiles.get(userId)?.avatar_url ?? undefined;
}

interface MessageMeta extends Message {
  showDate?: boolean;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  profiles,
  onReply,
  onEdit,
  onDelete,
  onThreadOpen,
  replyCounts,
  sendingIds,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [editError, setEditError] = useState("");

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const { addToast } = useToast();

  // Fetch reactions for visible messages
  useEffect(() => {
    const messageIds = messages.map((m) => m.id);
    if (messageIds.length === 0) return;
    if (messageIds.length <= 20) {
      // Use batch endpoint for efficiency (avoids N+1 fetches)
      api
        .get<{ reactions: Record<string, Reaction[]> }>(
          `/reactions/batch?message_ids=${messageIds.join(",")}`,
        )
        .then((res) => {
          const map = new Map<string, Reaction[]>();
          for (const [id, reactionList] of Object.entries(res.reactions)) {
            map.set(id, reactionList);
          }
          setReactions(map);
        })
        .catch(() => {
          // Fallback to per-message fetches
          Promise.all(
            messageIds.map((id) =>
              api
                .get<{ reactions: Reaction[] }>(`/messages/${id}/reactions`)
                .then((res) => ({ id, reactions: res.reactions }))
                .catch(() => ({ id, reactions: [] as Reaction[] })),
            ),
          ).then((results) => {
            const map = new Map<string, Reaction[]>();
            results.forEach((r) => map.set(r.id, r.reactions));
            setReactions(map);
          });
        });
    } else {
      // For very large sets, use per-message fetches
      Promise.all(
        messageIds.map((id) =>
          api
            .get<{ reactions: Reaction[] }>(`/messages/${id}/reactions`)
            .then((res) => ({ id, reactions: res.reactions }))
            .catch(() => ({ id, reactions: [] as Reaction[] })),
        ),
      ).then((results) => {
        const map = new Map<string, Reaction[]>();
        results.forEach((r) => map.set(r.id, r.reactions));
        setReactions(map);
      });
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const list = listRef.current;
    list?.addEventListener("scroll", handleScroll);
    return () => list?.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditContent(msg.content);
  }

  async function submitEdit() {
    if (!editingId || !onEdit) return;
    setEditError("");
    try {
      await onEdit(editingId, editContent);
      setEditingId(null);
      addToast({ title: "Message edited", variant: "success", duration: 3000 });
    } catch {
      setEditError("Failed to edit message. Please try again.");
      addToast({ title: "Error", description: "Failed to edit message.", variant: "error" });
    }
  }

  async function confirmDelete() {
    if (!deleteConfirmId || !onDelete) return;
    setDeleteError("");
    try {
      await onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
      addToast({ title: "Message deleted", variant: "success", duration: 3000 });
    } catch {
      setDeleteError("Failed to delete message. Please try again.");
      addToast({ title: "Error", description: "Failed to delete message.", variant: "error" });
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const msgReactions = reactions.get(messageId) ?? [];
    const existing = msgReactions.find((r) => r.user_id === currentUserId && r.emoji === emoji);

    if (existing) {
      await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
      setReactions((prev) => {
        const next = new Map(prev);
        next.set(
          messageId,
          (next.get(messageId) ?? []).filter((r) => r.id !== existing.id),
        );
        return next;
      });
    } else {
      const res = await api.post<{ reaction: Reaction }>(`/messages/${messageId}/reactions`, {
        emoji,
      });
      setReactions((prev) => {
        const next = new Map(prev);
        next.set(messageId, [...(next.get(messageId) ?? []), res.reaction]);
        return next;
      });
    }
  }

  // Aggregate reactions grouped by emoji for display
  function aggregatedReactions(
    messageId: string,
  ): { emoji: string; count: number; hasMine: boolean }[] {
    const msgReactions = reactions.get(messageId) ?? [];
    const grouped = new Map<string, { count: number; hasMine: boolean }>();
    for (const r of msgReactions) {
      const entry = grouped.get(r.emoji) ?? { count: 0, hasMine: false };
      entry.count++;
      if (r.user_id === currentUserId) entry.hasMine = true;
      grouped.set(r.emoji, entry);
    }
    return Array.from(grouped.entries()).map(([emoji, data]) => ({ emoji, ...data }));
  }

  const messagesWithMeta = React.useMemo(() => {
    const result: MessageMeta[] = [];
    let lastDate: string | null = null;
    let lastUserId: string | null = null;
    let lastUserTime: number | null = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.created_at).toDateString();
      const msgTime = new Date(msg.created_at).getTime();
      const isNewDate = msgDate !== lastDate;
      const isSameUser = msg.user_id === lastUserId;
      const gap = lastUserTime ? msgTime - lastUserTime : Infinity;
      const isGroupStart = isNewDate || !isSameUser || gap > GROUP_GAP_MS;

      if (result.length > 0) {
        const prev = result[result.length - 1];
        if (prev) prev.isGroupEnd = isGroupStart;
      }

      result.push({ ...msg, showDate: isNewDate, isGroupStart, isGroupEnd: true });
      lastDate = msgDate;
      lastUserId = msg.user_id;
      lastUserTime = msgTime;
    }
    return result;
  }, [messages]);

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 md:px-6" onScroll={handleScroll}>
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-[var(--color-foreground-tertiary)]">
            No messages yet. Start the conversation!
          </p>
        </div>
      ) : (
        messagesWithMeta.map((msg) => {
          const isOwn = msg.user_id === currentUserId;
          const showDate = msg.showDate;
          const showAuthor = !isOwn && msg.isGroupStart;
          const name = authorName(msg.user_id, profiles);
          const avatar = avatarUrl(msg.user_id, profiles);
          const isHovered = hoveredId === msg.id;
          const aggr = aggregatedReactions(msg.id);

          const isSystem = (msg as unknown as Record<string, unknown>).type === "system";
          if (isSystem) {
            return (
              <React.Fragment key={msg.id}>
                <div className="my-2 text-center">
                  <span className="text-xs text-[var(--color-foreground-tertiary)] italic">
                    {msg.content}
                  </span>
                </div>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-0.5 text-xs font-medium text-[var(--color-foreground-tertiary)]">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div
                className={`group flex ${isOwn ? "flex-row-reverse" : "flex-row"} ${
                  msg.isGroupStart ? "mt-3" : "mt-0.5"
                }`}
                onMouseEnter={() => {
                  setHoveredId(msg.id);
                  setPickerMessageId(null);
                }}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className={`flex w-9 shrink-0 ${isOwn ? "ml-2" : "mr-2"}`}>
                  {showAuthor ? (
                    <Avatar src={avatar} fallback={name.charAt(0).toUpperCase()} size="sm" />
                  ) : (
                    <div className="w-8" />
                  )}
                </div>

                <div className={`flex min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {showAuthor && (
                    <p className="mb-0.5 px-1 text-xs font-medium text-[var(--color-foreground-tertiary)]">
                      {name}
                    </p>
                  )}

                  <div className="flex items-start gap-1">
                    {editingId === msg.id ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex w-full gap-1">
                          <input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditingId(null);
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submitEdit();
                              }
                            }}
                            className="flex-1 rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-1 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none"
                            autoFocus
                            aria-label="Edit message"
                          />
                          <button
                            onClick={submitEdit}
                            className="shrink-0 text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="shrink-0 text-xs text-[var(--color-foreground-tertiary)] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                        {editError && (
                          <p className="text-xs text-[var(--color-status-danger-fg)]" role="alert">
                            {editError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col rounded-lg px-3 py-1.5 ${
                          isOwn
                            ? "bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-foreground)]"
                            : "bg-[var(--color-background-tertiary)] text-[var(--color-foreground-primary)]"
                        }`}
                      >
                        {msg.parent_id && (
                          <p className="mb-0.5 text-xs italic opacity-70">↳ Reply</p>
                        )}
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                        {msg.edited_at && <p className="mt-0.5 text-xs opacity-70">edited</p>}
                        {sendingIds?.has(msg.id) && (
                          <p className="mt-0.5 text-xs italic opacity-60">sending...</p>
                        )}
                        {msg.isGroupEnd || isHovered ? (
                          <p className="mt-0.5 text-right text-xs opacity-50">
                            {formatTime(msg.created_at)}
                          </p>
                        ) : null}
                        {!msg.parent_id && onThreadOpen && replyCounts?.has(msg.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onThreadOpen(msg);
                            }}
                            className="mt-0.5 self-start text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
                          >
                            {replyCounts.get(msg.id)}{" "}
                            {replyCounts.get(msg.id) === 1 ? "reply" : "replies"}
                          </button>
                        )}
                      </div>
                    )}

                    <div
                      className={`flex shrink-0 flex-col gap-0.5 transition-opacity ${
                        isHovered || editingId === msg.id
                          ? "opacity-100"
                          : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                      }`}
                    >
                      {onReply && (
                        <button
                          onClick={() => onReply(msg)}
                          className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded px-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                          aria-label="Reply to message"
                        >
                          ↩
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setPickerMessageId(pickerMessageId === msg.id ? null : msg.id)
                        }
                        className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded px-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                        aria-label="Add reaction"
                      >
                        😊
                      </button>
                      {isOwn && onEdit && (
                        <button
                          onClick={() => startEdit(msg)}
                          className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded px-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                          aria-label="Edit message"
                        >
                          ✎
                        </button>
                      )}
                      {isOwn && onDelete && (
                        <button
                          onClick={() => {
                            setDeleteConfirmId(msg.id);
                            setDeleteError("");
                          }}
                          className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded px-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-status-danger-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                          aria-label="Delete message"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reaction pills */}
                  {aggr.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {aggr.map(({ emoji, count, hasMine }) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={`inline-flex min-h-[44px] min-w-[44px] items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none ${
                            hasMine
                              ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)]"
                              : "border-[var(--color-border-primary)] hover:bg-[var(--color-background-tertiary)]"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[var(--color-foreground-tertiary)]">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Emoji picker */}
                  {pickerMessageId === msg.id && (
                    <div className="relative mt-1">
                      <div className="absolute top-0 left-0 z-10 flex gap-0.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-primary)] p-1 shadow-[var(--shadow-xl)]">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              toggleReaction(msg.id, emoji);
                              setPickerMessageId(null);
                            }}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1 text-lg leading-none transition-colors hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                            aria-label={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })
      )}
      <div ref={bottomRef} />

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-dialog-overlay)]">
          <div
            className="mx-4 max-w-sm rounded-lg bg-[var(--color-dialog-bg)] p-6 shadow-[var(--shadow-xl)]"
            role="dialog"
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
          >
            <h2
              id="delete-dialog-title"
              className="text-lg font-semibold text-[var(--color-foreground-primary)]"
            >
              Delete message?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-foreground-secondary)]">
              This action cannot be undone. The message will be removed for everyone.
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
                className="rounded-lg border border-[var(--color-border-primary)] px-4 py-2 text-sm font-medium text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-[var(--color-status-danger-fg)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-status-danger-fg)] focus-visible:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
