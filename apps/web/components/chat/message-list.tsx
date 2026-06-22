"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Message, UserProfile } from "@chat/db";

interface Props {
  messages: Message[];
  currentUserId?: string;
  profiles: Map<string, UserProfile>;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
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

export function MessageList({
  messages,
  currentUserId,
  profiles,
  onReply,
  onEdit,
  onDelete,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Auto-scroll to bottom on new messages (but not when user scrolled up)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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
    await onEdit(editingId, editContent);
    setEditingId(null);
  }

  // Group messages by date for date separators
  const messagesWithDates = React.useMemo(() => {
    const result: (Message & { showDate?: boolean })[] = [];
    let lastDate: string | null = null;

    for (const msg of messages) {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== lastDate) {
        result.push({ ...msg, showDate: true });
        lastDate = msgDate;
      } else {
        result.push(msg);
      }
    }
    return result;
  }, [messages]);

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-4" onScroll={handleScroll}>
      {messagesWithDates.map((msg) => {
        const isOwn = msg.user_id === currentUserId;
        const showDate = msg.showDate;

        return (
          <React.Fragment key={msg.id}>
            {showDate && (
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-0.5 text-xs font-medium text-[var(--color-foreground-tertiary)]">
                  {formatDate(msg.created_at)}
                </span>
              </div>
            )}
            <div className={`group mb-1 ${isOwn ? "flex justify-end" : "flex justify-start"}`}>
              <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <p className="mb-0.5 pl-1 text-xs font-medium text-[var(--color-foreground-tertiary)]">
                    {authorName(msg.user_id, profiles)}
                  </p>
                )}
                <div className="flex items-start gap-1">
                  {editingId === msg.id ? (
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
                  ) : (
                    <div
                      className={`flex flex-col rounded-lg px-3 py-1.5 ${
                        isOwn
                          ? "bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-foreground)]"
                          : "bg-[var(--color-background-tertiary)] text-[var(--color-foreground-primary)]"
                      }`}
                    >
                      {msg.parent_id && <p className="mb-0.5 text-xs italic opacity-70">↳ Reply</p>}
                      <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                      {msg.edited_at && <p className="mt-0.5 text-xs opacity-70">edited</p>}
                      <p className="mt-0.5 text-right text-xs opacity-50">
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  )}
                  {/* Hover actions */}
                  <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    {onReply && (
                      <button
                        onClick={() => onReply(msg)}
                        className="rounded px-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
                        aria-label="Reply to message"
                      >
                        ↩
                      </button>
                    )}
                    {isOwn && onEdit && (
                      <button
                        onClick={() => startEdit(msg)}
                        className="rounded px-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
                        aria-label="Edit message"
                      >
                        ✎
                      </button>
                    )}
                    {isOwn && onDelete && (
                      <button
                        onClick={() => onDelete(msg.id)}
                        className="rounded px-1 text-xs text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-status-danger-fg)]"
                        aria-label="Delete message"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
