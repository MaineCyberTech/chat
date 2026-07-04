"use client";

import React, { useEffect, useRef, useState } from "react";
import { Avatar, Button, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import { X } from "lucide-react";
import type { Message, UserProfile } from "@chat/db";

interface Props {
  parentMessage: Message;
  allMessages: Message[];
  currentUserId?: string;
  profiles: Map<string, UserProfile>;
  onClose: () => void;
  onSendReply: (content: string) => Promise<void>;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  isLoading?: boolean;
}

interface ParticipantInfo {
  user_id: string;
  last_read_at: string | null;
  joined_at: string;
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
  onEdit,
  onDelete,
  isLoading = false,
}: Props) {
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const { addToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const replies = React.useMemo(
    () => allMessages.filter((m) => m.parent_id === parentMessage.id),
    [allMessages, parentMessage.id],
  );

  // Fetch thread metadata and participants
  useEffect(() => {
    api
      .get<{
        thread: {
          metadata: { reply_count: number; participant_count: number };
          participants: ParticipantInfo[];
        };
      }>(`/messages/${parentMessage.id}/thread`)
      .then((res) => {
        setParticipants(res.thread.participants);
      })
      .catch(() => {
        // Thread may not exist yet if no replies
      });
  }, [parentMessage.id, replies.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  useEffect(() => {
    if (replyRef.current) {
      replyRef.current.style.height = "auto";
      replyRef.current.style.height = `${Math.min(replyRef.current.scrollHeight, 120)}px`;
    }
  }, [replyContent]);

  async function handleEditSubmit(replyId: string) {
    const trimmed = editContent.trim();
    if (!trimmed || !onEdit) return;
    try {
      await onEdit(replyId, trimmed);
      setEditingId(null);
      setEditContent("");
      addToast({ title: "Reply edited", variant: "success", duration: 3000 });
    } catch {
      addToast({ title: "Error", description: "Failed to edit reply.", variant: "error" });
    }
  }

  async function handleDeleteConfirm(replyId: string) {
    if (!onDelete) return;
    try {
      await onDelete(replyId);
      setDeleteConfirmId(null);
      addToast({ title: "Reply deleted", variant: "success", duration: 3000 });
    } catch {
      setDeleteError("Failed to delete reply.");
      addToast({ title: "Error", description: "Failed to delete reply.", variant: "error" });
    }
  }

  async function handleSubmit() {
    const trimmed = replyContent.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError("");
    try {
      await onSendReply(trimmed);
      setReplyContent("");
    } catch {
      const msg = "Failed to send reply. Please try again.";
      setSendError(msg);
      addToast({ title: "Error", description: msg, variant: "error" });
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
        <div className="flex items-center gap-2">
          {participants.length > 0 && (
            <span className="text-xs text-[var(--color-foreground-tertiary)]">
              {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={onClose}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
            aria-label="Close thread"
          >
            <X size={16} />
          </button>
        </div>
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
              const isEditing = editingId === reply.id;
              return (
                <div key={reply.id} className="group flex gap-2">
                  <Avatar
                    src={avatarUrl(reply.user_id, profiles)}
                    fallback={name.charAt(0).toUpperCase()}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[var(--color-foreground-primary)]">
                      {name}
                      <span className="ml-2 text-[var(--color-foreground-tertiary)]">
                        {formatTime(reply.created_at)}
                      </span>
                    </p>
                    {isEditing ? (
                      <div className="mt-1 space-y-1">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleEditSubmit(reply.id);
                            }
                            if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          className="w-full rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-sm text-[var(--color-input-fg)]"
                          rows={2}
                          aria-label="Edit reply"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditSubmit(reply.id)}
                            className="text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-[var(--color-foreground-tertiary)] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`mt-0.5 text-sm break-words whitespace-pre-wrap ${
                          isOwn
                            ? "text-[var(--color-brand-primary)]"
                            : "text-[var(--color-foreground-primary)]"
                        }`}
                      >
                        {reply.content}
                      </p>
                    )}
                    {reply.edited_at && (
                      <p className="mt-0.5 text-xs text-[var(--color-foreground-tertiary)]">
                        edited
                      </p>
                    )}
                    {isOwn && !isEditing && (
                      <div className="mt-0.5 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setEditingId(reply.id);
                            setEditContent(reply.content);
                          }}
                          className="text-xs text-[var(--color-foreground-tertiary)] hover:text-[var(--color-foreground-primary)]"
                          aria-label="Edit reply"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(reply.id)}
                          className="text-xs text-[var(--color-status-danger-fg)] hover:underline"
                          aria-label="Delete reply"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-lg bg-[var(--color-dialog-bg)] p-6 shadow-[var(--shadow-xl)]"
            role="alertdialog"
            aria-label="Delete reply"
          >
            <h3 className="text-sm font-semibold text-[var(--color-foreground-primary)]">
              Delete reply?
            </h3>
            <p className="mt-1 text-xs text-[var(--color-foreground-secondary)]">
              This cannot be undone.
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
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="rounded-md bg-[var(--color-status-danger-fg)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply input */}
      <div className="border-t border-[var(--color-border-primary)] p-3">
        {sendError && (
          <p className="mb-2 text-xs text-[var(--color-danger)]" role="alert">
            {sendError}
          </p>
        )}
        <div className="flex gap-2">
          <textarea
            ref={replyRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
            placeholder="Reply in thread..."
            aria-label="Reply in thread"
            className="min-h-[44px] w-full resize-none rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={sending || !replyContent.trim()}
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
