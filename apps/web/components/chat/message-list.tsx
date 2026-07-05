"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@chat/ui";
import { api } from "@/lib/api";
import {
  Reply,
  Pencil,
  X,
  Smile,
  Copy,
  Trash2,
  Clock,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { FilePreview } from "./file-preview";
import { RemindModal } from "./remind-modal";
import { EmojiPicker } from "./emoji-picker";
import type { Message, UserProfile } from "@chat/db";

const GROUP_GAP_MS = 5 * 60 * 1000;
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
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
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
  const showAuthor = msg.isGroupStart ?? true;
  const name = authorName(msg.user_id, profiles);
  const avatar = avatarUrl(msg.user_id, profiles);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  function aggregated(messageId: string) {
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
      <div className="mm-post text-center" style={{ paddingTop: 4, paddingBottom: 4 }}>
        <span
          className="text-xs italic"
          style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
        >
          {msg.content}
        </span>
      </div>
    );
  }

  const isEditing = editingId === msg.id;
  const hasThread = !msg.parent_id && onThreadOpen;
  const threadReplyCount = replyCounts.get(msg.id) ?? 0;

  return (
    <div key={msg.id}>
      {showDate && (
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="flex-1"
            style={{ borderTop: "solid 1px rgba(var(--center-channel-color-rgb), 0.12)" }}
          />
          <span
            className="rounded px-2 py-0.5 text-xs font-semibold"
            style={{
              background: "rgba(var(--center-channel-color-rgb), 0.08)",
              color: "rgba(var(--center-channel-color-rgb), 0.72)",
            }}
          >
            {formatDate(msg.created_at)}
          </span>
          <div
            className="flex-1"
            style={{ borderTop: "solid 1px rgba(var(--center-channel-color-rgb), 0.12)" }}
          />
        </div>
      )}
      <div
        data-message-id={msg.id}
        data-timestamp={msg.created_at}
        className={`mm-post ${isEditing ? "mm-post--editing" : ""}`}
        onMouseEnter={() => onSetPickerMessageId(null)}
      >
        <div className="flex items-start gap-2 px-4 py-1">
          {/* Avatar column */}
          {showAuthor ? (
            <div className="shrink-0" style={{ width: 44 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-full)",
                  overflow: "hidden",
                }}
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-xs font-semibold"
                    style={{
                      background: "rgba(var(--button-bg-rgb), 0.16)",
                      color: "var(--button-bg)",
                    }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ width: 44 }} className="shrink-0 pt-0.5 text-right">
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(var(--center-channel-color-rgb), 0.56)",
                  whiteSpace: "nowrap",
                }}
              >
                {formatTime(msg.created_at)}
              </span>
            </div>
          )}

          {/* Body */}
          <div className="min-w-0 flex-1">
            {showAuthor && (
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--center-channel-color)" }}
                >
                  {name}
                </span>
                <span
                  style={{ fontSize: 11, color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                >
                  {formatTime(msg.created_at)}
                </span>
              </div>
            )}

            {/* Edit mode */}
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
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
                    className="flex-1 rounded border px-2 py-1 text-sm"
                    style={{
                      borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                      background: "var(--center-channel-bg)",
                      color: "var(--center-channel-color)",
                    }}
                    autoFocus
                    aria-label="Edit message"
                  />
                  <button
                    onClick={onSubmitEdit}
                    className="text-xs font-medium"
                    style={{ color: "var(--button-bg)" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  >
                    Cancel
                  </button>
                </div>
                {editError && (
                  <p className="text-xs" style={{ color: "var(--error-text)" }} role="alert">
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
                >
                  {msg.parent_id && (
                    <p
                      className="mb-0.5 text-xs italic"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      <Reply size={10} className="mr-0.5 inline" /> Reply
                    </p>
                  )}
                  {msg.priority && msg.priority !== "standard" && (
                    <span
                      className="mb-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{
                        background:
                          msg.priority === "critical"
                            ? "rgba(var(--error-text-rgb),0.08)"
                            : msg.priority === "urgent"
                              ? "rgba(var(--dnd-indicator-rgb),0.08)"
                              : "rgba(var(--online-indicator-rgb),0.08)",
                        color:
                          msg.priority === "critical"
                            ? "var(--error-text)"
                            : msg.priority === "urgent"
                              ? "var(--dnd-indicator)"
                              : "var(--online-indicator)",
                      }}
                    >
                      {msg.priority === "critical" || msg.priority === "urgent" ? (
                        <AlertTriangle size={10} />
                      ) : (
                        <AlertCircle size={10} />
                      )}
                      {msg.priority.charAt(0).toUpperCase() + msg.priority.slice(1)}
                    </span>
                  )}
                  <div
                    className="text-sm break-words"
                    style={{ lineHeight: "20px", color: "var(--center-channel-color)" }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => {
                          if (!href) return <>{children}</>;
                          const isImage = /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(href);
                          const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(href);
                          const isAudio = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(href);
                          const fileName = href.split("/").pop() ?? "file";
                          if (isImage)
                            return <FilePreview url={href} type="image" name={fileName} />;
                          if (isVideo)
                            return <FilePreview url={href} type="video" name={fileName} />;
                          if (isAudio)
                            return <FilePreview url={href} type="audio" name={fileName} />;
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--link-color)" }}
                            >
                              {children}
                            </a>
                          );
                        },
                        code: ({ className, children }) => {
                          const match = /language-(\w+)/.exec(className ?? "");
                          const code = String(children).replace(/\n$/, "");
                          if (match) return <CodeBlock code={code} language={match[1]} />;
                          return (
                            <code
                              className="rounded px-1 py-0.5 font-mono text-xs"
                              style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                            >
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => <>{children}</>,
                        img: ({ src, alt }) =>
                          src ? (
                            <FilePreview url={String(src)} type="image" name={alt ?? "image"} />
                          ) : null,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {msg.edited_at && (
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      (edited)
                    </p>
                  )}
                  {sendingIds?.has(msg.id) && (
                    <p
                      className="mt-0.5 text-xs italic"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      sending...
                    </p>
                  )}
                </div>

                {/* Post menu — floating action bar */}
                <div className="post-menu">
                  {onReply && (
                    <button
                      onClick={() => onReply(msg)}
                      className="post-menu__item post-menu__item--show"
                      aria-label="Reply"
                    >
                      <Reply size={14} />
                    </button>
                  )}
                  <button
                    ref={reactionBtnRef}
                    onClick={() => onSetPickerMessageId(pickerMessageId === msg.id ? null : msg.id)}
                    className="post-menu__item"
                    aria-label="Add reaction"
                  >
                    <Smile size={14} />
                  </button>
                  {isOwn && onEdit && (
                    <button
                      onClick={() => onStartEdit(msg)}
                      className="post-menu__item"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {isOwn && onDelete && (
                    <button
                      onClick={() => onSetDeleteConfirmId(msg.id)}
                      className="post-menu__item"
                      aria-label="Delete"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Floating timestamp permalink */}
                <div className="post__permalink">{formatTime(msg.created_at)}</div>
              </div>
            )}

            {/* Reaction buttons */}
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
                    className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors"
                    style={{
                      minHeight: 28,
                      minWidth: 28,
                      borderColor: hasMine
                        ? "var(--button-bg)"
                        : "rgba(var(--center-channel-color-rgb), 0.16)",
                      background: hasMine ? "rgba(var(--button-bg-rgb), 0.08)" : "transparent",
                    }}
                  >
                    <span>{emoji}</span>
                    <span style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Emoji picker popover */}
            {pickerMessageId === msg.id && (
              <div className="relative mt-1" style={{ zIndex: 10 }}>
                <EmojiPicker
                  onSelect={(emoji) => {
                    onToggleReaction(msg.id, emoji);
                    onSetPickerMessageId(null);
                  }}
                  onClose={() => onSetPickerMessageId(null)}
                  anchorEl={reactionBtnRef.current}
                />
              </div>
            )}

            {/* Thread reply count button */}
            {hasThread && threadReplyCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onThreadOpen(msg);
                }}
                className="mt-1 text-xs font-medium"
                style={{ color: "var(--button-bg)" }}
              >
                {threadReplyCount} {threadReplyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
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
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

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
      setEditError("Failed to edit message.");
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
      setDeleteError("Failed to delete message.");
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
      if (touch) setContextMenu({ x: touch.clientX, y: touch.clientY, message: msg });
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

  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "instant" });
  }, [lastMessageId]);

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
          <div className="max-w-sm text-center" style={{ padding: "120px 24px 32px" }}>
            <h2
              className="mb-2 text-3xl font-semibold"
              style={{
                letterSpacing: "-0.03em",
                lineHeight: "40px",
                color: "rgba(var(--center-channel-color-rgb), 0.08)",
              }}
            ></h2>
            <p style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden" id="post-list">
      <div
        ref={listRef}
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        style={{ padding: "14px 0 7px" }}
      >
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.3)",
                borderTopColor: "transparent",
              }}
            />
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
            onToggleReaction={toggleReaction}
            onSetPickerMessageId={setPickerMessageId}
            onSetDeleteConfirmId={handleSetDeleteConfirmId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {showJumpButton && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
          style={{
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
            boxShadow: "var(--elevation-3)",
            color: "var(--center-channel-color)",
          }}
          aria-label="Jump to latest messages"
        >
          {unreadCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs text-white"
              style={{ background: "var(--button-bg)" }}
            >
              {unreadCount}
            </span>
          )}
          Jump to present \u2193
        </button>
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="min-w-[160px] rounded-lg border py-1"
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 100,
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
            boxShadow: "var(--elevation-4)",
          }}
          role="menu"
          aria-label="Message actions"
        >
          <button
            onClick={() => {
              onReply?.(contextMenu.message);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--center-channel-color)" }}
            role="menuitem"
          >
            <Reply size={14} /> Reply
          </button>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(contextMenu.message.content)
                .then(() => addToast({ title: "Copied", variant: "success", duration: 2000 }))
                .catch(() => {});
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--center-channel-color)" }}
            role="menuitem"
          >
            <Copy size={14} /> Copy text
          </button>
          <button
            onClick={() => {
              const permalink = `${window.location.origin}/pl/${contextMenu.message.id}`;
              navigator.clipboard
                .writeText(permalink)
                .then(() => addToast({ title: "Link copied", variant: "success", duration: 2000 }))
                .catch(() => {});
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--center-channel-color)" }}
            role="menuitem"
          >
            <Copy size={14} /> Copy link
          </button>
          <button
            onClick={() => {
              setRemindMessageId(contextMenu.message.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--center-channel-color)" }}
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
              className="flex w-full items-center gap-2 px-3 py-2 text-sm"
              style={{ color: "var(--center-channel-color)" }}
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
              className="flex w-full items-center gap-2 px-3 py-2 text-sm"
              style={{ color: "var(--dnd-indicator)" }}
              role="menuitem"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      )}

      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            ref={deleteDialogRef}
            className="mx-4 max-w-sm rounded-lg p-6"
            style={{ background: "var(--center-channel-bg)", boxShadow: "var(--elevation-5)" }}
            role="dialog"
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
          >
            <h2
              id="delete-dialog-title"
              className="text-lg font-semibold"
              style={{ color: "var(--center-channel-color)" }}
            >
              Delete message?
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              This action cannot be undone.
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
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  color: "var(--center-channel-color)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: "var(--dnd-indicator)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {remindMessageId && (
        <RemindModal messageId={remindMessageId} onClose={() => setRemindMessageId(null)} />
      )}
    </div>
  );
}
