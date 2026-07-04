"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Avatar, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import { Reply, Pencil, X, Smile, Copy, Trash2, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { FilePreview } from "./file-preview";
import { RemindModal } from "./remind-modal";
import type { Message, UserProfile } from "@chat/db";

const GROUP_GAP_MS = 5 * 60 * 1000;
const QUICK_EMOJIS = ["👍", "❤️", "😄", "😮", "😢", "🎉"];
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

interface ContextMenuState {
  x: number;
  y: number;
  message: Message;
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
  onMessageContextMenu,
  onMessageTouchStart,
  onMessageTouchEnd,
  onMessageTouchMove,
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
  onMessageContextMenu: (e: React.MouseEvent, msg: Message) => void;
  onMessageTouchStart: (e: React.TouchEvent, msg: Message) => void;
  onMessageTouchEnd: () => void;
  onMessageTouchMove: () => void;
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
        data-message-id={msg.id}
        data-timestamp={msg.created_at}
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
            <div className="shrink-0">
              <Avatar src={avatar} fallback={name.charAt(0).toUpperCase()} size="sm" />
            </div>
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
            <div className="group relative">
              <div
                onContextMenu={(e) => onMessageContextMenu(e, msg)}
                onTouchStart={(e) => onMessageTouchStart(e, msg)}
                onTouchEnd={onMessageTouchEnd}
                onTouchMove={onMessageTouchMove}
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
                <div className="text-sm break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => {
                        if (!href) return <>{children}</>;
                        const isImage = /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(href);
                        const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(href);
                        const isAudio = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(href);
                        const fileName = href.split("/").pop() ?? "file";
                        if (isImage) return <FilePreview url={href} type="image" name={fileName} />;
                        if (isVideo) return <FilePreview url={href} type="video" name={fileName} />;
                        if (isAudio) return <FilePreview url={href} type="audio" name={fileName} />;
                        return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-primary)] underline">{children}</a>;
                      },
                      code: ({ className, children }) => {
                        const match = /language-(\w+)/.exec(className ?? "");
                        const code = String(children).replace(/\n$/, "");
                        if (match) return <CodeBlock code={code} language={match[1]} />;
                        return <code className="rounded bg-[var(--color-background-tertiary)] px-1 py-0.5 font-mono text-xs">{children}</code>;
                      },
                      pre: ({ children }) => <>{children}</>,
                      img: ({ src, alt }) => src ? <FilePreview url={String(src)} type="image" name={alt ?? "image"} /> : null,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
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
              <div
                className={`absolute -top-3 right-0 z-10 hidden items-center gap-0.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] px-1 py-0.5 shadow-[var(--shadow-md)] group-hover:flex ${
                  isOwn ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {onReply && (
                  <button
                    onClick={() => onReply(msg)}
                    className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
                    aria-label="Reply"
                  >
                    <Reply size={14} />
                  </button>
                )}
                <button
                  onClick={() => onSetPickerMessageId(pickerMessageId === msg.id ? null : msg.id)}
                  className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
                  aria-label="Add reaction"
                >
                  <Smile size={14} />
                </button>
                {isOwn && onEdit && (
                  <button
                    onClick={() => onStartEdit(msg)}
                    className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {isOwn && onDelete && (
                  <button
                    onClick={() => onSetDeleteConfirmId(msg.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-status-danger-fg)]"
                    aria-label="Delete"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
          {aggr.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {aggr.map(({ emoji, count, hasMine }) => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(msg.id, emoji)}
                  title={
                    hasMine
                      ? `You and ${count - 1} other${count - 1 !== 1 ? "s" : ""}`
                      : `${count} ${count === 1 ? "person" : "people"}`
                  }
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
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const fetchedReactionsRef = useRef<Set<string>>(new Set());
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [remindMessageId, setRemindMessageId] = useState<string | null>(null);
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

  // Context menu close on click outside and Escape
  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setContextMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditError("");
  }, []);

  const handleSetDeleteConfirmId = useCallback((id: string | null) => {
    setDeleteConfirmId(id);
    setDeleteError("");
  }, []);

  // Fetch reactions incrementally — only for new message IDs not yet fetched
  useEffect(() => {
    const allIds = messages.map((m) => m.id);
    if (allIds.length === 0) return;
    const newIds = allIds.filter((id) => !fetchedReactionsRef.current.has(id));
    if (newIds.length === 0) return;
    newIds.forEach((id) => fetchedReactionsRef.current.add(id));

    function mergeResults(results: { id: string; reactions: Reaction[] }[]) {
      setReactions((prev) => {
        const next = new Map(prev);
        results.forEach((r) => next.set(r.id, r.reactions));
        return next;
      });
    }

    if (newIds.length <= 20) {
      api
        .get<{ reactions: Record<string, Reaction[]> }>(
          `/reactions/batch?message_ids=${newIds.join(",")}`,
        )
        .then((res) => {
          const entries = Object.entries(res.reactions).map(([id, r]) => ({ id, reactions: r }));
          mergeResults(entries);
        })
        .catch(() => {
          Promise.all(
            newIds.map((id) =>
              api
                .get<{ reactions: Reaction[] }>(`/messages/${id}/reactions`)
                .then((res) => ({ id, reactions: res.reactions }))
                .catch(() => ({ id, reactions: [] as Reaction[] })),
            ),
          ).then(mergeResults);
        });
    } else {
      Promise.all(
        newIds.map((id) =>
          api
            .get<{ reactions: Reaction[] }>(`/messages/${id}/reactions`)
            .then((res) => ({ id, reactions: res.reactions }))
            .catch(() => ({ id, reactions: [] as Reaction[] })),
        ),
      ).then(mergeResults);
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

  const handleContextMenu = useCallback((e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, msg: Message) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      if (touch) {
        setContextMenu({ x: touch.clientX, y: touch.clientY, message: msg });
      }
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

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

  const scrollRestoreRef = useRef<{ prevScrollHeight: number; prevScrollTop: number } | null>(null);
  const initialLoadRef = useRef(true);

  // Detect scroll-to-top for loading older messages
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowJumpButton(!isAtBottom);

    if (onLoadOlder && hasMoreOlder && !loadingOlder && scrollTop < TOP_TRIGGER_OFFSET) {
      scrollRestoreRef.current = { prevScrollHeight: scrollHeight, prevScrollTop: scrollTop };
      onLoadOlder();
    }

    if (isAtBottom) {
      setUnreadCount(0);
    } else if (messages.length > 0 && el) {
      const visibleRatio = el.clientHeight / scrollHeight;
      const visibleCount = Math.floor(messages.length * visibleRatio);
      setUnreadCount(Math.max(0, messages.length - visibleCount));
    }
  }, [onLoadOlder, hasMoreOlder, loadingOlder, messages.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Restore scroll position after older messages are prepended
  useEffect(() => {
    const el = listRef.current;
    const restore = scrollRestoreRef.current;
    if (!restore || !el) return;
    requestAnimationFrame(() => {
      if (!listRef.current) return;
      const newScrollHeight = listRef.current.scrollHeight;
      listRef.current.scrollTop =
        restore.prevScrollTop + (newScrollHeight - restore.prevScrollHeight);
    });
    scrollRestoreRef.current = null;
  }, [messagesWithMeta.length]);

  // Auto-scroll to bottom on new messages if user was at bottom
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [lastMessageId]);

  // Scroll to bottom on initial load after messages arrive
  useEffect(() => {
    if (messages.length > 0 && initialLoadRef.current) {
      initialLoadRef.current = false;
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      });
    }
  }, [messages.length]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpButton(false);
    setUnreadCount(0);
  }

  if (messages.length === 0) {
    return (
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-[var(--color-foreground-tertiary)]">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={listRef}
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: "var(--bottom-nav-height)" }}
      >
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-foreground-tertiary)] border-t-transparent" />
          </div>
        )}
        {messagesWithMeta.map((msg) => (
          <MessageItem
            key={msg.id}
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
                  onMessageContextMenu={handleContextMenu}
                  onMessageTouchStart={handleTouchStart}
                  onMessageTouchEnd={handleTouchEnd}
                  onMessageTouchMove={handleTouchMove}
            onSubmitEdit={submitEdit}
            onCancelEdit={handleCancelEdit}
            onSetEditContent={setEditContent}
            onSetHoveredId={setHoveredId}
            onToggleReaction={toggleReaction}
            onSetPickerMessageId={setPickerMessageId}
            onSetDeleteConfirmId={handleSetDeleteConfirmId}
          />
        ))}
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

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 100,
          }}
          className="min-w-[160px] rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] py-1 shadow-[var(--shadow-xl)]"
          role="menu"
          aria-label="Message actions"
        >
          <button
            onClick={() => {
              onReply?.(contextMenu.message);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)]"
            role="menuitem"
          >
            <Reply size={14} /> Reply
          </button>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(contextMenu.message.content)
                .then(() => {
                  addToast({ title: "Copied to clipboard", variant: "success", duration: 2000 });
                })
                .catch(() => {
                  addToast({ title: "Error", description: "Failed to copy", variant: "error" });
                });
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)]"
            role="menuitem"
          >
            <Copy size={14} /> Copy text
          </button>
          <button
            onClick={() => {
              const permalink = `${window.location.origin}/pl/${contextMenu.message.id}`;
              navigator.clipboard
                .writeText(permalink)
                .then(() => {
                  addToast({ title: "Link copied", variant: "success", duration: 2000 });
                })
                .catch(() => {
                  addToast({ title: "Error", description: "Failed to copy", variant: "error" });
                });
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)]"
            role="menuitem"
          >
            <Copy size={14} /> Copy link
          </button>
          <button
            onClick={() => {
              setRemindMessageId(contextMenu.message.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)]"
            role="menuitem"
          >
            <Clock size={14} /> Remind me
          </button>
          {contextMenu.message.user_id === currentUserId && onEdit && (
            <button
              onClick={() => {
                startEdit(contextMenu.message);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)]"
              role="menuitem"
            >
              <Pencil size={14} /> Edit
            </button>
          )}
          {contextMenu.message.user_id === currentUserId && onDelete && (
            <button
              onClick={() => {
                setDeleteConfirmId(contextMenu.message.id);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-status-danger-fg)] hover:bg-[var(--color-background-tertiary)]"
              role="menuitem"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
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

      {remindMessageId && (
        <RemindModal
          messageId={remindMessageId}
          onClose={() => setRemindMessageId(null)}
        />
      )}
    </div>
  );
}
