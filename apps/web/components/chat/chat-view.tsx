"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { getSocket, onReconnect, offReconnect } from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ThreadPanel } from "./thread-panel";
import { SearchBar } from "./search-bar";
import { Badge, Skeleton, useToast } from "@chat/ui";
import type { Message, UserProfile } from "@chat/db";
import type { Socket } from "socket.io-client";

function ConnectionBanner() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "reconnecting">("connected");

  useEffect(() => {
    getSocket()
      .then((s) => {
        s.on("disconnect", () => setStatus("disconnected"));
        s.on("connect", () => setStatus("connected"));
        s.on("reconnect_attempt", () => setStatus("reconnecting"));
        s.io.on("reconnect_error", () => setStatus("disconnected"));
      })
      .catch((err) => console.error("Socket events setup failed:", err));

    return () => {
      getSocket()
        .then((s) => {
          s.off("disconnect");
          s.off("connect");
          s.off("reconnect_attempt");
          s.io.off("reconnect_error");
        })
        .catch((err) => console.error("Socket cleanup failed:", err));
    };
  }, []);

  if (status === "connected") return null;

  return (
    <div
      className={`px-4 py-1.5 text-center text-xs font-medium ${
        status === "reconnecting"
          ? "bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-fg)]"
          : "bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger-fg)]"
      }`}
      role="alert"
    >
      {status === "reconnecting" ? "Reconnecting..." : "Connection lost. Trying to reconnect..."}
    </div>
  );
}

interface Props {
  channelId: string;
  channelName?: string;
  workspaceId?: string;
  workspaceSlug?: string;
}

export function ChatView({ channelId, channelName, workspaceId, workspaceSlug }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const { addToast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const replyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const msg of messages) {
      if (msg.parent_id) {
        counts.set(msg.parent_id, (counts.get(msg.parent_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [messages]);

  const loadProfiles = useCallback(async (msgs: Message[]) => {
    const ids = [...new Set(msgs.map((m) => m.user_id))];
    if (ids.length === 0) return;
    try {
      const res = await api.post<{ profiles: UserProfile[] }>("/auth/profiles", {
        userIds: ids,
      });
      setProfiles((prev) => {
        const next = new Map(prev);
        res.profiles.forEach((p) => next.set(p.id, p));
        return next;
      });
    } catch (err) {
      console.error("Failed to fetch profiles:", err);
    }
  }, []);

  useEffect(() => {
    setError(null);
    setLoading(true);
    api
      .get<{ messages: Message[] }>(`/channels/${channelId}/messages`)
      .then((res) => {
        setMessages(res.messages);
        loadProfiles(res.messages);
      })
      .catch((err) => {
        setError("Failed to load messages. Please try again.");
        console.error("Failed to load messages:", err);
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [channelId, loadProfiles]);

  useEffect(() => {
    let socket: Socket | null = null;
    let isConnectionAttempted = false;

    function setup(s: Socket) {
      socket = s;
      if (!isConnectionAttempted) {
        isConnectionAttempted = true;
        s.emit("channel:join", channelId);
      }

      onReconnect(() => {
        socket?.emit("channel:join", channelId);
      });

      socket.on("message:new", ({ message }: { message: Message }) => {
        setMessages((prev) => [...prev, message]);
        loadProfiles([message]);
      });

      socket.on("message:updated", ({ message }: { message: Message }) => {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      });

      socket.on("message:deleted", ({ id }: { id: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      });

      socket.on("presence:update", ({ total }: { total: number }) => {
        setOnlineCount(total);
      });

      socket.on("typing:start", ({ userId }: { userId: string }) => {
        if (userId !== user?.id) {
          setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        }
      });

      socket.on("typing:stop", ({ userId }: { userId: string }) => {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      });
    }

    getSocket()
      .then(setup)
      .catch((err) => console.error("Socket setup failed:", err));

    return () => {
      offReconnect(() => {});
      if (socket) {
        socket.emit("channel:leave", channelId);
        socket.off("message:new");
        socket.off("message:updated");
        socket.off("message:deleted");
        socket.off("presence:update");
        socket.off("typing:start");
        socket.off("typing:stop");
      }
    };
  }, [channelId, user?.id, loadProfiles]);

  const handleSend = useCallback(
    async (content: string) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: Message = {
        id: tempId,
        channel_id: channelId,
        user_id: user?.id ?? "",
        content,
        parent_id: replyTo?.id ?? null,
        edited_at: null,
        deleted_at: null,
        archived_at: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setSendingIds((prev) => new Set(prev).add(tempId));

      try {
        await api.post(`/channels/${channelId}/messages`, { content, parent_id: replyTo?.id });
      } finally {
        setReplyTo(null);
        setSendingIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        // Remove temp message if real one hasn't arrived via socket yet
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [channelId, replyTo, user?.id],
  );

  const handleThreadReply = useCallback(
    async (content: string) => {
      if (!threadMessage) return;
      await api.post(`/channels/${channelId}/messages`, {
        content,
        parent_id: threadMessage.id,
      });
    },
    [channelId, threadMessage],
  );

  const handleEdit = useCallback(async (messageId: string, content: string) => {
    await api.patch(`/messages/${messageId}`, { content });
  }, []);

  const handleDelete = useCallback(async (messageId: string) => {
    await api.delete(`/messages/${messageId}`);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        const res = await api.post<{ uploadUrl: string; publicUrl: string }>("/messages/upload", {
          fileName: file.name,
          contentType: file.type,
        });
        await fetch(res.uploadUrl, { method: "PUT", body: file });
        const displayName = file.type.startsWith("image/")
          ? `![${file.name}](${res.publicUrl})`
          : `📎 [${file.name}](${res.publicUrl})`;
        await api.post(`/channels/${channelId}/messages`, { content: displayName });
        addToast({ title: "File uploaded", variant: "success", duration: 3000 });
      } catch {
        addToast({
          title: "Upload failed",
          description: `Could not upload ${file.name}.`,
          variant: "error",
        });
      }
    },
    [channelId, addToast],
  );

  const handleTypingStart = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    getSocket()
      .then((s) => s.emit("typing:start", channelId))
      .catch((err) => console.error("Failed to emit typing:start:", err));

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000); // Auto-stop after 3 seconds of inactivity
  }, [channelId]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    getSocket()
      .then((s) => s.emit("typing:stop", channelId))
      .catch((err) => console.error("Failed to emit typing:stop:", err));
  }, [channelId]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--color-border-primary)] px-4 py-3 md:px-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 space-y-3 px-4 py-4 md:px-6">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-16 w-4/5" />
          <Skeleton className="ml-auto h-12 w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--color-border-primary)] px-4 py-3 md:px-6">
          <h1 className="min-w-0 truncate text-base font-semibold md:text-lg"># {channelName}</h1>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-md space-y-3 text-center">
            <div className="inline-flex rounded-full bg-[var(--color-status-danger-bg)] p-3">
              <svg
                className="h-8 w-8 text-[var(--color-status-danger-fg)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-[var(--color-foreground-primary)]">
              Failed to load messages
            </h2>
            <p className="text-[var(--color-foreground-secondary)]">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
              className="inline-flex items-center gap-2 rounded bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:outline-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border-primary)] px-4 py-3 md:gap-3 md:px-6">
          <h1 className="min-w-0 truncate text-base font-semibold md:text-lg"># {channelName}</h1>
          <Badge variant="success">{onlineCount} online</Badge>
          <div className="mt-2 w-full md:mt-0 md:ml-auto md:w-64">
            {workspaceId && workspaceSlug && (
              <SearchBar workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
            )}
          </div>
        </div>
        <ConnectionBanner />
        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Messages"
          className="flex-1 overflow-y-auto"
        >
          <MessageList
            messages={messages}
            currentUserId={user?.id}
            profiles={profiles}
            onReply={setReplyTo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onThreadOpen={setThreadMessage}
            replyCounts={replyCounts}
            sendingIds={sendingIds}
          />
        </div>
        {replyTo && (
          <div className="flex items-center gap-2 border-t border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] px-4 py-2 text-sm md:px-6">
            <span className="min-w-0 truncate text-[var(--color-foreground-secondary)]">
              Replying to{" "}
              {profiles.get(replyTo.user_id)?.display_name ?? replyTo.user_id.slice(0, 8)}
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="shrink-0 rounded p-1 text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
              aria-label="Cancel reply"
            >
              ✕
            </button>
          </div>
        )}
        <MessageInput
          channelId={channelId}
          workspaceId={workspaceId}
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          typingUsers={typingUsers}
        />
      </div>

      {threadMessage && (
        <>
          {/* Desktop: side panel */}
          <div className="hidden md:block">
            <ThreadPanel
              parentMessage={threadMessage}
              allMessages={messages}
              currentUserId={user?.id}
              profiles={profiles}
              onClose={() => setThreadMessage(null)}
              onSendReply={handleThreadReply}
            />
          </div>
          {/* Mobile: full-screen overlay */}
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="animate-slide-in-right flex h-full flex-col bg-[var(--color-background-primary)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
                <button
                  onClick={() => setThreadMessage(null)}
                  className="rounded p-1 text-[var(--color-foreground-secondary)] hover:bg-[var(--color-background-tertiary)]"
                  aria-label="Close thread"
                >
                  ← Back
                </button>
                <h2 className="text-sm font-semibold text-[var(--color-foreground-primary)]">
                  Thread
                </h2>
                <div className="w-12" />
              </div>
              <div className="flex-1 overflow-hidden">
                <ThreadPanel
                  parentMessage={threadMessage}
                  allMessages={messages}
                  currentUserId={user?.id}
                  profiles={profiles}
                  onClose={() => setThreadMessage(null)}
                  onSendReply={handleThreadReply}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
