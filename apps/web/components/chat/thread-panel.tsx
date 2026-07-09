"use client";

import React, { useEffect, useRef, useState } from "react";
import { Avatar, Button, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import { X, ChevronDown, ChevronRight, Smile } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import type { Message, UserProfile } from "@chat/db";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

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
  typingUsers?: string[];
  onTypingStart?: () => void;
  onTypingStop?: () => void;
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
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  typingUsers,
  onTypingStart,
  onTypingStop,
}: Props) {
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);
  const { addToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const replies = React.useMemo(
    () => allMessages.filter((m) => m.parent_id === parentMessage.id),
    [allMessages, parentMessage.id],
  );

  useEffect(() => {
    api
      .get<{
        thread: {
          metadata: { reply_count: number; participant_count: number };
          participants: ParticipantInfo[];
        };
      }>(`/messages/${parentMessage.id}/thread`)
      .then((res) => setParticipants(res.thread.participants))
      .catch(() =>
        addToast({ title: "Failed to load thread participants", variant: "error", duration: 3000 }),
      );
  }, [parentMessage.id, replies.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  // Fetch reactions for all replies
  useEffect(() => {
    const ids = replies.map((r) => r.id);
    if (ids.length === 0) return;
    const CHUNK_SIZE = 20;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) chunks.push(ids.slice(i, i + CHUNK_SIZE));
    Promise.all(
      chunks.map((chunk) =>
        api
          .get<{ reactions: Record<string, Reaction[]> }>(
            `/reactions/batch?message_ids=${chunk.join(",")}`,
          )
          .then((res) => Object.entries(res.reactions).map(([id, r]) => ({ id, reactions: r })))
          .catch(() =>
            Promise.all(
              chunk.map((id) =>
                api
                  .get<{ reactions: Reaction[] }>(`/messages/${id}/reactions`)
                  .then((r) => ({ id, reactions: r.reactions }))
                  .catch(() => ({ id, reactions: [] })),
              ),
            ),
          ),
      ),
    ).then((chunkResults) => {
      setReactions((prev) => {
        const next = new Map(prev);
        chunkResults.flat().forEach((r) => next.set(r.id, r.reactions));
        return next;
      });
    });
  }, [replies]);

  async function toggleReaction(messageId: string, emoji: string) {
    try {
      const res = await api.post<{ reaction: Reaction; removed: boolean }>(
        `/messages/${messageId}/reactions`,
        { emoji },
      );
      setReactions((prev) => {
        const next = new Map(prev);
        const existing = next.get(messageId) ?? [];
        if (res.removed) {
          next.set(
            messageId,
            existing.filter((r) => !(r.user_id === currentUserId && r.emoji === emoji)),
          );
        } else {
          next.set(messageId, [...existing, res.reaction]);
        }
        return next;
      });
    } catch {
      addToast({ title: "Error", description: "Failed to toggle reaction", variant: "error" });
    }
  }

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

  function handleReplyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setReplyContent(e.target.value);
    if (e.target.value && onTypingStart) {
      onTypingStart();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
    if (onTypingStop) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(onTypingStop, 3000);
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
      const msg = "Failed to send reply.";
      setSendError(msg);
      addToast({ title: "Error", description: msg, variant: "error" });
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="sidebar--right"
      style={{ width: 400, display: "flex", flexDirection: "column", height: "100%" }}
    >
      {/* RHS Header */}
      <div
        className="sidebar--right__header"
        style={{
          display: "flex",
          overflow: "hidden",
          flex: "0 0 56px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px 0 0",
          borderBottom: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-2 px-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
            Thread
          </h2>
          {participants.length > 0 && (
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button onClick={onClose} className="mm-button-icon" aria-label="Close thread">
          <X size={16} />
        </button>
      </div>

      {/* RHS Body */}
      <div
        className="sidebar-right__body"
        style={{
          display: "flex",
          height: "100%",
          flex: "1 1 auto",
          flexDirection: "column",
          background: "var(--center-channel-bg)",
        }}
      >
        <div
          className="post-right__scroll"
          style={{ position: "relative", flex: "1 1 auto", paddingTop: 16, overflowY: "auto" }}
        >
          {/* Parent message */}
          <div className="mb-4 flex gap-2 px-4">
            <Avatar
              src={avatarUrl(parentMessage.user_id, profiles)}
              fallback={authorName(parentMessage.user_id, profiles).charAt(0).toUpperCase()}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: "var(--center-channel-color)" }}>
                {authorName(parentMessage.user_id, profiles)}
                <span className="ml-2" style={{ color: "var(--text-tertiary)" }}>
                  {formatTime(parentMessage.created_at)}
                </span>
              </p>
              <p
                className="mt-0.5 text-sm break-words whitespace-pre-wrap"
                style={{ color: "var(--center-channel-color)" }}
              >
                {parentMessage.content}
              </p>
              {parentMessage.edited_at && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  (edited)
                </p>
              )}
            </div>
          </div>

          <div className="mx-4 mb-3" style={{ borderTop: "var(--border-light)" }} />

          {/* Replies toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mb-2 flex items-center gap-1 px-4 py-1 text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </button>

          {/* Replies list */}
          {!collapsed &&
            (isLoading ? (
              <div className="space-y-3 px-4" aria-busy="true" aria-live="polite">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <div
                      className="h-8 w-8 animate-pulse rounded-full"
                      style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                    />
                    <div className="flex-1 space-y-2">
                      <div
                        className="h-3 w-24 animate-pulse rounded"
                        style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                      />
                      <div
                        className="h-4 w-full animate-pulse rounded"
                        style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : replies.length === 0 ? (
              <p className="px-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                No replies yet
              </p>
            ) : (
              <div className="space-y-0">
                {replies.map((reply) => {
                  const isOwn = reply.user_id === currentUserId;
                  const name = authorName(reply.user_id, profiles);
                  const isEditing = editingId === reply.id;
                  return (
                    <div
                      key={reply.id}
                      className="group px-4 py-2 transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.04)]"
                    >
                      <div className="flex gap-2">
                        <Avatar
                          src={avatarUrl(reply.user_id, profiles)}
                          fallback={name.charAt(0).toUpperCase()}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-medium"
                            style={{ color: "var(--center-channel-color)" }}
                          >
                            {name}
                            <span className="ml-2" style={{ color: "var(--text-tertiary)" }}>
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
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="w-full rounded px-2 py-1 text-sm"
                                style={{
                                  border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)",
                                  background: "var(--center-channel-bg)",
                                  color: "var(--center-channel-color)",
                                }}
                                rows={2}
                                aria-label="Edit reply"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditSubmit(reply.id)}
                                  className="text-xs font-medium"
                                  style={{ color: "var(--button-bg)" }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs"
                                  style={{ color: "var(--text-tertiary)" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              className="mt-0.5 text-sm break-words whitespace-pre-wrap"
                              style={{
                                color: isOwn ? "var(--button-bg)" : "var(--center-channel-color)",
                              }}
                            >
                              {reply.content}
                            </p>
                          )}
                          {reply.edited_at && (
                            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                              (edited)
                            </p>
                          )}
                          {/* Reactions */}
                          {(() => {
                            const replyReactions = reactions.get(reply.id);
                            const grouped = replyReactions
                              ? replyReactions.reduce<Record<string, Reaction[]>>((acc, r) => {
                                  (acc[r.emoji] ??= []).push(r);
                                  return acc;
                                }, {})
                              : {};
                            return (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(grouped).map(([emoji, reactors]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(reply.id, emoji)}
                                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-[rgba(var(--button-bg-rgb),0.08)]"
                                    style={{
                                      background: reactors.some((r) => r.user_id === currentUserId)
                                        ? "rgba(var(--button-bg-rgb), 0.12)"
                                        : "rgba(var(--center-channel-color-rgb), 0.06)",
                                    }}
                                    aria-label={`${reactors.length} ${reactors.length === 1 ? "reaction" : "reactions"}`}
                                  >
                                    <span>{emoji}</span>
                                    <span
                                      style={{
                                        color: "var(--text-tertiary)",
                                      }}
                                    >
                                      {reactors.length}
                                    </span>
                                  </button>
                                ))}
                                <button
                                  onClick={() =>
                                    setPickerMessageId(
                                      pickerMessageId === reply.id ? null : reply.id,
                                    )
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                                  aria-label="Add reaction"
                                >
                                  <Smile size={12} style={{ color: "var(--text-tertiary)" }} />
                                </button>
                                {pickerMessageId === reply.id && (
                                  <EmojiPicker
                                    onSelect={(emoji) => {
                                      toggleReaction(reply.id, emoji);
                                      setPickerMessageId(null);
                                    }}
                                    onClose={() => setPickerMessageId(null)}
                                  />
                                )}
                              </div>
                            );
                          })()}
                          {isOwn && !isEditing && (
                            <div className="mt-0.5 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => {
                                  setEditingId(reply.id);
                                  setEditContent(reply.content);
                                }}
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                                aria-label="Edit reply"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(reply.id)}
                                className="text-xs"
                                style={{ color: "var(--dnd-indicator)" }}
                                aria-label="Delete reply"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          <div ref={bottomRef} />
        </div>

        {/* Delete confirmation */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
              className="max-w-sm rounded-lg bg-[var(--center-channel-bg)] p-6 shadow-[var(--elevation-5)]"
              role="alertdialog"
              aria-label="Delete reply"
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--center-channel-color)" }}
              >
                Delete reply?
              </h3>
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                This cannot be undone.
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
                  onClick={() => handleDeleteConfirm(deleteConfirmId)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                  style={{ background: "var(--dnd-indicator)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reply input */}
        <div style={{ borderTop: "var(--border-default)", padding: 12 }}>
          {sendError && (
            <p className="mb-2 text-xs" style={{ color: "var(--error-text)" }} role="alert">
              {sendError}
            </p>
          )}
          {typingUsers && typingUsers.length > 0 && (
            <p
              className="mb-1 text-xs"
              style={{ height: 18, color: "rgba(var(--center-channel-color-rgb), 0.75)" }}
              role="status"
              aria-live="polite"
            >
              {typingUsers.length === 1
                ? `${authorName(typingUsers[0]!, profiles)} is typing...`
                : `${typingUsers.length} people are typing...`}
            </p>
          )}
          <div className="flex gap-2">
            <textarea
              ref={replyRef}
              value={replyContent}
              onChange={handleReplyChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder="Reply in thread..."
              aria-label="Reply in thread"
              className="w-full resize-none rounded px-3 py-2 text-sm"
              style={{
                minHeight: 44,
                border: "2px solid rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
                color: "var(--center-channel-color)",
                lineHeight: "20px",
                outline: "none",
              }}
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
    </div>
  );
}
