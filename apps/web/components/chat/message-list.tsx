"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Avatar, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import { Reply, Pencil, X, Smile } from "lucide-react";
import type { Message, UserProfile } from "@chat/db";

const GROUP_GAP_MS = 5 * 60 * 1000;
const QUICK_EMOJIS = ["👍", "❤️", "😄", "😮", "😢", "🎉"];
const ESTIMATED_ROW_HEIGHT = 64;
const OVERSCAN = 10;
const TOP_TRIGGER_OFFSET = 200;

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
  onLoadOlder?: () => void;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
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

const MessageItem = React.memo(function MessageItem({
  msg,
  currentUserId,
  profiles,
  editingId,
  editContent,
  hoveredId,
  reactions,
  pickerMessageId,
  editError,
  replyCounts = new Map(),
  sendingIds,
  onReply,
  onEdit,
  onDelete,
  onThreadOpen,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  onSetEditContent,
  onSetHoveredId,
  onToggleReaction,
  onSetPickerMessageId,
  onSetDeleteConfirmId,
}: {
  msg: MessageMeta;
  currentUserId?: string;
  profiles: Map<string, UserProfile>;
  editingId: string | null;
  editContent: string;
  hoveredId: string | null;
  reactions: Map<string, Reaction[]>;
  pickerMessageId: string | null;
  editError: string;
  replyCounts?: Map<string, number>;
  sendingIds?: Set<string>;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onThreadOpen?: (message: Message) => void;
  onStartEdit: (msg: Message) => void;
  onSubmitEdit: () => Promise<void>;
  onCancelEdit: () => void;
  onSetEditContent: (content: string) => void;
  onSetHoveredId: (id: string | null) => void;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
  onSetPickerMessageId: (id: string | null) => void;
  onSetDeleteConfirmId: (id: string | null) => void;
}) {
  const isOwn = msg.user_id === currentUserId;
  const showDate = msg.showDate ?? false;
  const showAuthor = !isOwn && (msg.isGroupStart ?? false);
  const name = authorName(msg.user_id, profiles);
  const avatar = avatarUrl(msg.user_id, profiles);
  const isHovered = hoveredId === msg.id;

  function aggregated(messageId: string): { emoji: string; count: number; hasMine: boolean }[] {
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

  const aggr = aggregated(msg.id);

  const isSystem = (msg as unknown as Record<string, unknown>).type === "system";
  if (isSystem) {
    return (
      <div key={msg.id} className="my-2 text-center">
        <span className="text-xs text-[var(--color-foreground-tertiary)] italic">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div key={msg.id}>
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
          onSetHoveredId(msg.id);
          onSetPickerMessageId(null);
        }}
        onMouseLeave={() => onSetHoveredId(null)}
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
                    onChange={(e) => onSetEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") onCancelEdit();
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmitEdit();
                      }
                    }}
                    className="flex-1 rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-1 text-sm text-[var(--color-input-fg)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none"
                    autoFocus
                    aria-label="Edit message"
                  />
                  <button
                    onClick={onSubmitEdit}
                    className="shrink-0 text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={onCancelEdit}
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
                  <p className="mb-0.5 text-xs italic opacity-70">
                    <Reply size={12} className="mr-0.5 inline" /> Reply
                  </p>
                )}
                <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                {msg.edited_at && <p className="mt-0.5 text-xs opacity-70">edited</p>}
                {sendingIds?.has(msg.id) && (
                  <p className="mt-0.5 text-xs italic opacity-60">sending...</p>
                )}
                {(msg.isGroupEnd || isHovered) && (
                  <p className="mt-0.5 text-right text-xs opacity-50">
                    {formatTime(msg.created_at)}
                  </p>
                )}
                {!msg.parent_id && onThreadOpen && replyCounts?.has(msg.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onThreadOpen(msg);
                    }}
                    className="mt-0.5 self-start text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
                  >
                    {replyCounts.get(msg.id)} {replyCounts.get(msg.id) === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
            )}
            <div
              className={`flex shrink-0 flex-col gap-0.5 transition-opacity ${
                isHovered || editingId === msg.id
                  ? "opacity-100"
                  : "opacity-100 group-active:opacity-100 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
              }`}
            >
              {onReply && (
                <button
                  onClick={() => onReply(msg)}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                  aria-label="Reply to message"
                >
                  <Reply size={16} />
                </button>
              )}
              <button
                onClick={() => onSetPickerMessageId(pickerMessageId === msg.id ? null : msg.id)}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                aria-label="Add reaction"
              >
                <Smile size={16} />
              </button>
              {isOwn && onEdit && (
                <button
                  onClick={() => onStartEdit(msg)}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                  aria-label="Edit message"
                >
                  <Pencil size={16} />
                </button>
              )}
              {isOwn && onDelete && (
                <button
                  onClick={() => {
                    onSetDeleteConfirmId(msg.id);
                  }}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-status-danger-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
                  aria-label="Delete message"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          {aggr.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {aggr.map(({ emoji, count, hasMine }) => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(msg.id, emoji)}
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
          {pickerMessageId === msg.id && (
            <div className="relative mt-1">
              <div className="absolute top-0 right-0 z-10 flex max-w-[calc(100vw-3rem)] gap-0.5 overflow-x-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-primary)] p-1 shadow-[var(--shadow-xl)]">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onToggleReaction(msg.id, emoji);
                      onSetPickerMessageId(null);
                    }}
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded p-1 text-lg leading-none transition-colors hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none md:min-h-[44px] md:min-w-[44px]"
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
    </div>
  );
});

export function MessageList({
  messages,
  currentUserId,
  profiles,
  onReply,
  onEdit,
  onDelete,
  onThreadOpen,
  onLoadOlder,
  hasMoreOlder,
  loadingOlder,
  replyCounts,
  sendingIds,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [editError, setEditError] = useState("");
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Focus trap for delete dialog
  useEffect(() => {
    if (!deleteConfirmId || !deleteDialogRef.current) return;
    const container = deleteDialogRef.current;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleTab);
    container.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [deleteConfirmId]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditError("");
  }, []);

  const handleSetDeleteConfirmId = useCallback((id: string | null) => {
    setDeleteConfirmId(id);
    setDeleteError("");
  }, []);

  // Fetch reactions for visible messages
  useEffect(() => {
    const messageIds = messages.map((m) => m.id);
    if (messageIds.length === 0) return;
    if (messageIds.length <= 20) {
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

  const parentRef = listRef;
  const virtualizer = useVirtualizer({
    count: messagesWithMeta.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Detect scroll-to-top for loading older messages
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowJumpButton(!isAtBottom);

    if (onLoadOlder && hasMoreOlder && !loadingOlder && scrollTop < TOP_TRIGGER_OFFSET) {
      onLoadOlder();
    }

    // Track unread count based on scroll position
    if (isAtBottom) {
      setUnreadCount(0);
    } else if (messages.length > 0 && parentRef.current) {
      const visibleRatio = parentRef.current.clientHeight / scrollHeight;
      const visibleCount = Math.floor(messages.length * visibleRatio);
      setUnreadCount(Math.max(0, messages.length - visibleCount));
    }
  }, [onLoadOlder, hasMoreOlder, loadingOlder, messages.length]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Auto-scroll to bottom on new messages if user was at bottom
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (!showJumpButton && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, showJumpButton]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpButton(false);
    setUnreadCount(0);
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[var(--color-foreground-tertiary)]">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <div ref={parentRef} className="h-full overflow-y-auto overscroll-contain pb-14 md:pb-0">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const msg = messagesWithMeta[virtualItem.index];
            if (!msg) return null;
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                data-index={virtualItem.index}
              >
                <MessageItem
                  msg={msg}
                  currentUserId={currentUserId}
                  profiles={profiles}
                  editingId={editingId}
                  editContent={editContent}
                  hoveredId={hoveredId}
                  reactions={reactions}
                  pickerMessageId={pickerMessageId}
                  editError={editError}
                  replyCounts={replyCounts ?? new Map()}
                  sendingIds={sendingIds}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onThreadOpen={onThreadOpen}
                  onStartEdit={(m) => startEdit(m)}
                  onSubmitEdit={submitEdit}
                  onCancelEdit={handleCancelEdit}
                  onSetEditContent={setEditContent}
                  onSetHoveredId={setHoveredId}
                  onToggleReaction={toggleReaction}
                  onSetPickerMessageId={setPickerMessageId}
                  onSetDeleteConfirmId={handleSetDeleteConfirmId}
                />
              </div>
            );
          })}
        </div>
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-foreground-tertiary)] border-t-transparent" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Jump to present button */}
      {showJumpButton && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground-primary)] shadow-[var(--shadow-xl)] transition-all hover:bg-[var(--color-background-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)] focus-visible:outline-none"
          aria-label="Jump to latest messages"
        >
          {unreadCount > 0 && (
            <span className="rounded-full bg-[var(--color-brand-primary)] px-1.5 py-0.5 text-xs text-white">
              {unreadCount}
            </span>
          )}
          Jump to present ↓
        </button>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-dialog-overlay)]">
          <div
            ref={deleteDialogRef}
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
