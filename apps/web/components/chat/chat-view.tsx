"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getSocket, onReconnect, offReconnect } from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { SearchBar } from "./search-bar";
import { Badge, Skeleton } from "@chat/ui";
import type { Message, UserProfile } from "@chat/db";
import type { Socket } from "socket.io-client";

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
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [replyTo, setReplyTo] = useState<Message | null>(null);

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
    } catch {
      // Silently ignore profile fetch errors
    }
  }, []);

  useEffect(() => {
    api
      .get<{ messages: Message[] }>(`/channels/${channelId}/messages`)
      .then((res) => {
        setMessages(res.messages);
        loadProfiles(res.messages);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [channelId, loadProfiles]);

  useEffect(() => {
    let socket: Socket | null = null;

    function setup(s: Socket) {
      socket = s;
      socket.emit("channel:join", channelId);

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
      .catch(() => {});

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
      await api.post(`/channels/${channelId}/messages`, {
        content,
        parent_id: replyTo?.id,
      });
      setReplyTo(null);
    },
    [channelId, replyTo],
  );

  const handleEdit = useCallback(async (messageId: string, content: string) => {
    await api.patch(`/messages/${messageId}`, { content });
  }, []);

  const handleDelete = useCallback(async (messageId: string) => {
    await api.delete(`/messages/${messageId}`);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const res = await api.post<{ uploadUrl: string; publicUrl: string }>("/messages/upload", {
        fileName: file.name,
        contentType: file.type,
      });
      await fetch(res.uploadUrl, { method: "PUT", body: file });
      const displayName = file.type.startsWith("image/")
        ? `![${file.name}](${res.publicUrl})`
        : `📎 [${file.name}](${res.publicUrl})`;
      await api.post(`/channels/${channelId}/messages`, { content: displayName });
    },
    [channelId],
  );

  const handleTypingStart = useCallback(() => {
    getSocket()
      .then((s) => s.emit("typing:start", channelId))
      .catch(() => {});
  }, [channelId]);

  const handleTypingStop = useCallback(() => {
    getSocket()
      .then((s) => s.emit("typing:stop", channelId))
      .catch(() => {});
  }, [channelId]);

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border-primary)] px-4 py-3 md:gap-3 md:px-6">
        <h1 className="min-w-0 truncate text-base font-semibold md:text-lg"># {channelName}</h1>
        <Badge variant="success">{onlineCount} online</Badge>
        <div className="mt-2 w-full md:mt-0 md:ml-auto md:w-64">
          {workspaceId && workspaceSlug && (
            <SearchBar workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
          )}
        </div>
      </div>
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
        />
      </div>
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] px-4 py-2 text-sm md:px-6">
          <span className="min-w-0 truncate text-[var(--color-foreground-secondary)]">
            Replying to {profiles.get(replyTo.user_id)?.display_name ?? replyTo.user_id.slice(0, 8)}
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
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        typingUsers={typingUsers}
      />
    </div>
  );
}
