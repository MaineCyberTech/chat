"use client";

import React, { useRef } from "react";
import { Reply, Pencil, X, Smile, Bookmark, AlertCircle, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "../code-block";
import { FilePreview } from "../file-preview";
import { LinkPreview } from "../link-preview";
import { EmojiPicker } from "../emoji-picker";
import type { Message, UserProfile } from "@chat/db";

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

function authorName(userId: string, profiles: Map<string, UserProfile>): string {
  const p = profiles.get(userId);
  return p?.display_name ?? p?.email?.split("@")[0] ?? userId.slice(0, 8);
}

import { formatDate as localeFormatDate } from "@/lib/i18n";

function formatTime(dateString: string): string {
  return localeFormatDate(dateString, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string): string {
  return localeFormatDate(dateString, { month: "short", day: "numeric", year: "numeric" });
}

function avatarUrl(userId: string, profiles: Map<string, UserProfile>): string | undefined {
  return profiles.get(userId)?.avatar_url ?? undefined;
}

export interface MessageMeta extends Message {
  showDate?: boolean;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
}

export const MessageItem = React.memo(function MessageItem({
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
  onToggleFlag,
  flaggedMessages,
  onSetPickerMessageId,
  onSetDeleteConfirmId,
  onMessageContextMenu,
  onMessageTouchStart,
  onMessageTouchEnd,
  onMessageTouchMove,
  sendErrors,
  onRetry,
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
  flaggedMessages?: Set<string>;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onThreadOpen?: (message: Message) => void;
  onStartEdit: (msg: Message) => void;
  onSubmitEdit: () => Promise<void>;
  onCancelEdit: () => void;
  onSetEditContent: (content: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
  onToggleFlag?: (messageId: string, currentlyFlagged: boolean) => void;
  onSetPickerMessageId: (id: string | null) => void;
  onSetDeleteConfirmId: (id: string | null) => void;
  onMessageContextMenu: (e: React.MouseEvent, msg: Message) => void;
  onMessageTouchStart: (e: React.TouchEvent, msg: Message) => void;
  onMessageTouchEnd: () => void;
  onMessageTouchMove: () => void;
  sendErrors?: Map<string, string>;
  onRetry?: (messageId: string) => void;
}) {
  const isOwn = msg.user_id === currentUserId;
  const isFlagged = flaggedMessages?.has(msg.id) ?? false;
  const showDate = msg.showDate ?? false;
  const showAuthor = msg.isGroupStart ?? true;
  const sendError = sendErrors?.get(msg.id);
  const isFailed = !!sendError;
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
                  // eslint-disable-next-line @next/next/no-img-element
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
                            <LinkPreview href={href} linkColor="var(--link-color)">
                              {children}
                            </LinkPreview>
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
                      className="mt-0.5"
                      style={{
                        fontSize: 11,
                        fontStyle: "italic",
                        color: "rgba(var(--center-channel-color-rgb), 0.75)",
                      }}
                    >
                      (edited)
                    </p>
                  )}
                  {sendingIds?.has(msg.id) && !isFailed && (
                    <p
                      className="mt-0.5 text-xs italic"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      sending...
                    </p>
                  )}
                  {isFailed && (
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{ background: "rgba(var(--error-text-rgb), 0.1)", color: "var(--error-text)" }}
                        role="alert"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        {sendError}
                      </span>
                      {onRetry && (
                        <button
                          onClick={() => onRetry(msg.id)}
                          className="text-xs font-medium underline"
                          style={{ color: "var(--button-bg)" }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
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
                  <button
                    onClick={() => onToggleFlag?.(msg.id, isFlagged)}
                    className="post-menu__item"
                    aria-label={isFlagged ? "Unsave message" : "Save message"}
                    style={{ color: isFlagged ? "var(--button-bg)" : undefined }}
                  >
                    <Bookmark size={14} />
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
