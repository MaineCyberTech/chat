"use client";

import React, { useEffect, useRef, useState } from "react";
import { Avatar, Input, Button } from "@chat/ui";
import type { Message, UserProfile } from "@chat/db";

interface Props {
  parentMessage: Message;
  allMessages: Message[];
  currentUserId?: string;
  profiles: Map<string, UserProfile>;
  onClose: () => void;
  onSendReply: (content: string) => Promise<void>;
  isLoading?: boolean;
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

function avatarUrl(userId: string, profiles: Map<string, UserProfile>): string | undefined {
  return profiles.get(userId)?.avatar_url ?? undefined;
}

export function ThreadPanel({
  parentMessage,
  allMessages,
  currentUserId,
  profiles,
  onClose,
  onSendReply,
  isLoading = false,
}: Props) {
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const replies = React.useMemo(
    () => allMessages.filter((m) => m.parent_id === parentMessage.id),
    [allMessages, parentMessage.id],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  async function handleSubmit() {
    const trimmed = replyContent.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSendReply(trimmed);
      setReplyContent("");
    } finally {
      setSending(false);
    }
  }

  // Global Escape to close thread
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="flex h-full w-80 flex-col border-l border-[var(--color-border-primary)] bg-[var(--color-background-primary)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--color-foreground-primary)]">Thread</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
          aria-label="Close thread"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Parent message */}
        <div className="mb-4 flex gap-2">
          <Avatar
            src={avatarUrl(parentMessage.user_id, profiles)}
            fallback={authorName(parentMessage.user_id, profiles).charAt(0).toUpperCase()}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--color-foreground-primary)]">
              {authorName(parentMessage.user_id, profiles)}
              <span className="ml-2 text-[var(--color-foreground-tertiary)]">
                {formatTime(parentMessage.created_at)}
              </span>
            </p>
            <p className="mt-0.5 text-sm break-words whitespace-pre-wrap text-[var(--color-foreground-primary)]">
              {parentMessage.content}
            </p>
            {parentMessage.edited_at && (
              <p className="mt-0.5 text-xs text-[var(--color-foreground-tertiary)]">edited</p>
            )}
          </div>
        </div>

        <div className="mb-3 border-t border-[var(--color-border-primary)]" />

        {/* Replies */}
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-skeleton-bg)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-skeleton-bg)]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[var(--color-skeleton-bg)]" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-skeleton-bg)]" />
                </div>
              </div>
            ))}
          </div>
        ) : replies.length === 0 ? (
          <p className="text-center text-xs text-[var(--color-foreground-tertiary)]">
            No replies yet
          </p>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => {
              const isOwn = reply.user_id === currentUserId;
              const name = authorName(reply.user_id, profiles);
              return (
                <div key={reply.id} className="flex gap-2">
                  <Avatar
                    src={avatarUrl(reply.user_id, profiles)}
                    fallback={name.charAt(0).toUpperCase()}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--color-foreground-primary)]">
                      {name}
                      <span className="ml-2 text-[var(--color-foreground-tertiary)]">
                        {formatTime(reply.created_at)}
                      </span>
                    </p>
                    <p
                      className={`mt-0.5 text-sm break-words whitespace-pre-wrap ${
                        isOwn
                          ? "text-[var(--color-brand-primary)]"
                          : "text-[var(--color-foreground-primary)]"
                      }`}
                    >
                      {reply.content}
                    </p>
                    {reply.edited_at && (
                      <p className="mt-0.5 text-xs text-[var(--color-foreground-tertiary)]">
                        edited
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="border-t border-[var(--color-border-primary)] p-3">
        <div className="flex gap-2">
          <Input
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Reply in thread..."
            aria-label="Reply in thread"
          />
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={sending}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
