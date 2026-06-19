"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getSocket, onReconnect, offReconnect } from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { SearchBar } from "./search-bar";
import { Badge, Skeleton } from "@chat/ui";
import type { Message } from "@chat/db";
import type { Socket } from "socket.io-client";

import type { UserProfile } from "@chat/db";

interface Props {
  channelId: string;
  workspaceId?: string;
  workspaceSlug?: string;
}

export function ChatView({ channelId, workspaceId, workspaceSlug }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Load profiles for message authors (uses setProfiles callback to avoid stale deps)
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

  // Load initial messages
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

  // Socket.io connection and event handlers
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
        <div className="border-b border-gray-200 px-6 py-3 dark:border-gray-800">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 space-y-3 px-6 py-4">
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
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3 dark:border-gray-800">
        <h1 className="text-lg font-semibold"># {channelId}</h1>
        <Badge variant="success">{onlineCount} online</Badge>
        <div className="ml-auto w-64">
          {workspaceId && workspaceSlug && (
            <SearchBar workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
          )}
        </div>
      </div>
      <MessageList
        messages={messages}
        currentUserId={user?.id}
        profiles={profiles}
        onReply={setReplyTo}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-6 py-2 text-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-gray-500">
            Replying to {profiles.get(replyTo.user_id)?.display_name ?? replyTo.user_id.slice(0, 8)}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
