"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { getSocket, onReconnect, offReconnect } from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { useOptimistic } from "@/lib/optimistic/use-optimistic";
import { MediaRoom, useMediaRoom } from "@/components/media/media-room";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ThreadPanel } from "./thread-panel";
import { SearchBar } from "./search-bar";
import { Skeleton, useToast } from "@chat/ui";
import {
  X,
  Phone,
  ArrowLeft,
  ExternalLink,
  Bell,
  BellOff,
  Info,
  Download,
  ChevronDown,
  Bookmark,
} from "lucide-react";
import { ChannelInfo } from "./channel-info";
import { NotificationPreferencesModal } from "./notification-preferences-modal";
import { playNotificationSound, showDesktopNotification } from "@/lib/notification-sound";
import { ChannelBookmarks } from "./channel-bookmarks";
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
      .catch(() => console.warn("Failed to get socket for connection status"));

    return () => {
      getSocket()
        .then((s) => {
          s.off("disconnect");
          s.off("connect");
          s.off("reconnect_attempt");
          s.io.off("reconnect_error");
        })
        .catch(() => console.warn("Failed to cleanup socket connection listeners"));
    };
  }, []);

  if (status === "connected") return null;

  return (
    <div
      className="px-4 py-1.5 text-center text-xs font-medium"
      style={{
        background: status === "reconnecting" ? "var(--warning-text)" : "var(--error-text)",
        color: "#fff",
      }}
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
  const {
    items: messages,
    setItems: setMessages,
    applyOptimistic,
    confirmOptimistic,
    rollbackOptimistic,
    deduplicateEcho,
    updateItem,
    removeItem,
  } = useOptimistic<Message>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<{
    notify: "all" | "mentions" | "none";
    sound: boolean;
  }>({ notify: "all", sound: true });
  const [showChannelInfo, setShowChannelInfo] = useState<false | "info" | "bookmarks">(false);
  const [filterQuery] = useState("");
  const { addToast } = useToast();
  const [globalNotifPrefs, setGlobalNotifPrefs] = useState<{
    desktop_notifications: boolean;
    message_notifications: boolean;
    mention_notifications: boolean;
    mention_notification_sound: boolean;
    sound: string;
  }>({
    desktop_notifications: true,
    message_notifications: true,
    mention_notifications: true,
    mention_notification_sound: true,
    sound: "standard",
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { activeRoom, startCall, endCall } = useMediaRoom();

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
    } catch {
      /* ignore */
    }
  }, []);

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlder || !hasMoreOlder) return;
    setLoadingOlder(true);
    try {
      const res = await api.get<{ messages: Message[]; nextCursor: string | null }>(
        `/channels/${channelId}/messages?cursor=${nextCursor}`,
      );
      setMessages((prev) => [...res.messages, ...prev]);
      setNextCursor(res.nextCursor);
      if (!res.nextCursor) setHasMoreOlder(false);
      loadProfiles(res.messages);
    } catch {
      console.warn("Failed to load older messages, user can scroll up to retry");
    }
    setLoadingOlder(false);
  }, [channelId, nextCursor, loadingOlder, hasMoreOlder, loadProfiles]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setNextCursor(null);
    setHasMoreOlder(true);
    api
      .get<{ messages: Message[]; nextCursor: string | null }>(`/channels/${channelId}/messages`)
      .then((res) => {
        setMessages(res.messages);
        setNextCursor(res.nextCursor);
        setHasMoreOlder(!!res.nextCursor);
        loadProfiles(res.messages);
      })
      .catch(() => {
        setError("Failed to load messages. Please try again.");
        setMessages([]);
      })
      .finally(() => setLoading(false));

    api
      .get<{ members: { user_id: string }[] }>(`/channels/${channelId}/members`)
      .then((res) => setMemberCount(res.members.length))
      .catch(() => {});

    api
      .get<{ preferences: { notification_prefs: Record<string, unknown> } }>("/preferences")
      .then((res) => {
        const prefs = res.preferences.notification_prefs ?? {};
        setGlobalNotifPrefs((prev) => ({
          ...prev,
          desktop_notifications:
            (prefs.desktop_notifications as boolean) ?? prev.desktop_notifications,
          message_notifications:
            (prefs.message_notifications as boolean) ?? prev.message_notifications,
          mention_notifications:
            (prefs.mention_notifications as boolean) ?? prev.mention_notifications,
          mention_notification_sound:
            (prefs.mention_notification_sound as boolean) ?? prev.mention_notification_sound,
          sound: (prefs.sound as string) ?? prev.sound,
        }));
      })
      .catch(() => {});
  }, [channelId, loadProfiles]);

  useEffect(() => {
    let socket: Socket | null = null;
    let isConnectionAttempted = false;
    let presenceHandler: ((data: { total: number }) => void) | null = null;

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
        if (deduplicateEcho(message.id)) return;
        setMessages((prev) => [...prev, message]);
        loadProfiles([message]);
        if (message.user_id !== user?.id) {
          const displayName = (user?.user_metadata?.display_name as string) ?? user?.email?.split("@")[0] ?? "";
          const isMention =
            displayName &&
            (message.content.includes(`@${displayName}`) ||
              message.content.includes(`@${user?.email?.split("@")[0]}`));

          if (isMention && globalNotifPrefs.mention_notification_sound) {
            playNotificationSound(globalNotifPrefs.sound);
          } else if (!isMention && globalNotifPrefs.message_notifications) {
            playNotificationSound(globalNotifPrefs.sound);
          }

          if (globalNotifPrefs.desktop_notifications) {
            showDesktopNotification(
              `New message in #${channelName ?? "channel"}`,
              message.content.slice(0, 120),
            );
          }
        }
      });

      socket.on("message:updated", ({ message }: { message: Message }) => {
        updateItem(message.id, message);
      });

      socket.on("message:deleted", ({ id }: { id: string }) => {
        removeItem(id);
      });

      presenceHandler = ({ total }: { total: number }) => {
        setOnlineCount(total);
      };
      socket.on("presence:update", presenceHandler);

      socket.on("typing:start", ({ userId }: { userId: string }) => {
        if (userId !== user?.id) {
          setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        }
      });

      socket.on("typing:stop", ({ userId }: { userId: string }) => {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      });

      socket.on("channel:user_joined", ({ userId }: { userId: string }) => {
        const systemMsg: Message = {
          id: `sys_${Date.now()}_join`,
          channel_id: channelId,
          user_id: userId,
          content: "Joined the channel",
          parent_id: null,
          is_pinned: false,
          priority: "standard",
          edited_at: null,
          deleted_at: null,
          archived_at: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMsg]);
      });

      socket.on("channel:user_left", ({ userId }: { userId: string }) => {
        const systemMsg: Message = {
          id: `sys_${Date.now()}_leave`,
          channel_id: channelId,
          user_id: userId,
          content: "Left the channel",
          parent_id: null,
          is_pinned: false,
          priority: "standard",
          edited_at: null,
          deleted_at: null,
          archived_at: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMsg]);
      });
    }

    getSocket()
      .then(setup)
      .catch(() => console.warn("Failed to get socket for chat channel setup"));

    return () => {
      offReconnect(() => {});
      if (socket) {
        socket.emit("channel:leave", channelId);
        socket.off("message:new");
        socket.off("message:updated");
        socket.off("message:deleted");
        if (presenceHandler) socket.off("presence:update", presenceHandler);
        socket.off("typing:start");
        socket.off("typing:stop");
        socket.off("channel:user_joined");
        socket.off("channel:user_left");
      }
    };
  }, [channelId, user?.id, loadProfiles]);

  // Prevent body scroll when mobile RHS is open
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const isOpen = showChannelInfo !== false || threadMessage !== null;
    document.body.classList.toggle("rhs-mobile-open", isMobile && isOpen);
  }, [showChannelInfo, threadMessage]);



  const handleSend = useCallback(
    async (content: string, priority: string = "standard") => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: Message = {
        id: tempId,
        channel_id: channelId,
        user_id: user?.id ?? "",
        content,
        parent_id: replyTo?.id ?? null,
        is_pinned: false,
        priority: priority as Message["priority"],
        edited_at: null,
        deleted_at: null,
        archived_at: null,
        created_at: new Date().toISOString(),
      };
      applyOptimistic(tempId, optimistic, () => {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      });

      try {
        const res = await api.post<{ message: { id: string } }>(`/channels/${channelId}/messages`, {
          content,
          parent_id: replyTo?.id,
          priority,
        });
        confirmOptimistic(tempId, res.message.id, optimistic);
      } catch {
        rollbackOptimistic(tempId, "Failed to send. Tap to retry.");
      } finally {
        setReplyTo(null);
      }
    },
    [channelId, replyTo, user?.id, applyOptimistic, confirmOptimistic, rollbackOptimistic],
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
          : `\u{1f4ce} [${file.name}](${res.publicUrl})`;
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
      .catch(() => console.warn("Failed to emit typing:start"));

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [channelId]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    getSocket()
      .then((s) => s.emit("typing:stop", channelId))
      .catch(() => console.warn("Failed to emit typing:stop"));
  }, [channelId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1" id="channel_view">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mm-channel-header">
            <Skeleton
              className="h-4 w-32"
              style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
            />
          </div>
          <div className="flex-1 space-y-3 p-4">
            <Skeleton
              className="h-12 w-3/4"
              style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
            />
            <Skeleton
              className="h-12 w-2/3"
              style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
            />
            <Skeleton
              className="h-12 w-4/5"
              style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
            />
          </div>
          <div
            className="post-create__container"
            style={{
              width: "100%",
              flex: "0 0 auto",
              borderTop: "var(--border-default)",
              background: "var(--center-channel-bg)",
              height: 60,
            }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="mm-channel-header">
          <h1 className="min-w-0 truncate text-base font-semibold"># {channelName}</h1>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-md space-y-3 text-center">
            <div
              className="inline-flex rounded-full p-3"
              style={{ background: "rgba(var(--semantic-color-danger), 0.1)" }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: "var(--error-text)" }}
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
            <h2 className="text-lg font-medium">Failed to load messages</h2>
            <p style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white"
              style={{ background: "var(--button-bg)" }}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1" id="channel_view">
      <div
        className="flex min-w-0 flex-1 flex-col"
        style={{ background: "var(--center-channel-bg)" }}
      >
        {/* Mattermost-style channel header */}
        <div className="mm-channel-header">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex items-center gap-1" style={{ height: 24 }}>
              <h1 className="mm-font-heading max-w-[300px] truncate"># {channelName}</h1>
              <button className="mm-button-icon" aria-label="Channel menu">
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="hidden text-xs md:inline"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.64)" }}
            >
              <span style={{ color: "var(--online-indicator)" }}>&bull;</span> {onlineCount} online
            </span>
            <span
              className="hidden text-xs md:inline"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.64)" }}
            >
              | {memberCount} members
            </span>
            <div className="ml-2 flex items-center gap-0.5">
              <button
                className="mm-button-icon"
                onClick={() => setShowChannelInfo(showChannelInfo === "info" ? false : "info")}
                aria-label="Channel info"
                title="Channel info"
              >
                <Info size={16} />
              </button>
              <button
                className="mm-button-icon"
                onClick={() =>
                  setShowChannelInfo(showChannelInfo === "bookmarks" ? false : "bookmarks")
                }
                aria-label="Channel bookmarks"
                title="Channel bookmarks"
              >
                <Bookmark size={16} />
              </button>
              <button
                className="mm-button-icon"
                onClick={() => setShowNotifPrefs(true)}
                aria-label="Notification preferences"
                title="Notification preferences"
              >
                {notifPrefs.notify === "none" ? <BellOff size={16} /> : <Bell size={16} />}
              </button>
              <button
                className="mm-button-icon"
                onClick={() => startCall(channelId)}
                aria-label="Start call"
                title="Start call"
              >
                <Phone size={16} />
              </button>
              <button
                className="mm-button-icon hidden md:flex"
                onClick={() => {
                  const url = `${window.location.origin}/${workspaceSlug}/${channelId}`;
                  window.open(
                    url,
                    `chat-${channelId}`,
                    "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no",
                  );
                }}
                aria-label="Open in new window"
              >
                <ExternalLink size={16} />
              </button>
              <button
                className="mm-button-icon hidden md:flex"
                onClick={() =>
                  addToast({ title: "Channel exported", variant: "success", duration: 2000 })
                }
                aria-label="Export"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Search bar row */}
        <div
          className="flex items-center gap-2 border-b px-3 py-2"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.08)" }}
        >
          <div className="max-w-[600px] flex-1">
            {workspaceId && workspaceSlug && (
              <SearchBar workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
            )}
          </div>
        </div>

        <ChannelBookmarks channelId={channelId} />
        <ConnectionBanner />

        {/* Reply-to indicator */}
        {replyTo && (
          <div
            className="flex items-center gap-2 px-4 py-2 text-sm"
            style={{
              borderTop: "var(--border-default)",
              background: "rgba(var(--center-channel-color-rgb), 0.04)",
            }}
          >
            <span
              className="min-w-0 truncate"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Replying to{" "}
              {profiles.get(replyTo.user_id)?.display_name ?? replyTo.user_id.slice(0, 8)}
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="mm-button-icon ml-auto"
              aria-label="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Message area - absolute positioning to avoid flex height calc issues */}
        <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
          <div
            role="log"
            aria-atomic="false"
            aria-label="Messages"
            style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 0 7px" }}
          >
            <MessageList
              messages={
                filterQuery
                  ? messages.filter((m) =>
                      m.content.toLowerCase().includes(filterQuery.toLowerCase()),
                    )
                  : messages
              }
              currentUserId={user?.id}
              profiles={profiles}
              onReply={setReplyTo}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onThreadOpen={setThreadMessage}
              onLoadOlder={loadOlder}
              hasMoreOlder={hasMoreOlder}
              loadingOlder={loadingOlder}
              replyCounts={replyCounts}
              sendingIds={
                new Set(messages.filter((m) => m.id.startsWith("temp_")).map((m) => m.id))
              }
            />
          </div>

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
      </div>

      {/* Thread panel (RHS) */}
      {threadMessage && (
        <>
          {/* Desktop */}
          <div className="hidden md:block" style={{ borderLeft: "var(--border-default)" }}>
            <ThreadPanel
              parentMessage={threadMessage}
              allMessages={messages}
              currentUserId={user?.id}
              profiles={profiles}
              onClose={() => setThreadMessage(null)}
              onSendReply={handleThreadReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
          {/* Mobile */}
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Thread"
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setThreadMessage(null)}
            />
            <div
              className="animate-slide-in-right absolute top-0 right-0 bottom-0 flex w-full max-w-md flex-col"
              style={{
                background: "var(--center-channel-bg)",
                boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
              }}
            >
              <div
                className="flex shrink-0 items-center justify-between border-b px-4 py-3"
                style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
              >
                <button
                  onClick={() => setThreadMessage(null)}
                  className="mm-button-icon"
                  aria-label="Close thread"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-sm font-semibold">Thread</h2>
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Channel Info sidebar (RHS) */}
      {showChannelInfo && (
        <>
          {/* Desktop */}
          <div className="hidden md:block" style={{ borderLeft: "var(--border-default)" }}>
            <ChannelInfo
              channelId={channelId}
              onClose={() => setShowChannelInfo(false)}
              initialTab={showChannelInfo === "bookmarks" ? "bookmarks" : "members"}
            />
          </div>
          {/* Mobile */}
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Channel info"
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowChannelInfo(false)}
            />
            <div
              className="animate-slide-in-right absolute top-0 right-0 bottom-0 flex w-full max-w-sm flex-col"
              style={{
                background: "var(--center-channel-bg)",
                boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
              }}
            >
              <div
                className="flex shrink-0 items-center justify-between border-b px-4 py-3"
                style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
              >
                <button
                  onClick={() => setShowChannelInfo(false)}
                  className="mm-button-icon"
                  aria-label="Close"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-sm font-semibold">Channel Info</h2>
                <div className="w-12" />
              </div>
              <div className="flex-1 overflow-hidden">
                <ChannelInfo
                  channelId={channelId}
                  onClose={() => setShowChannelInfo(false)}
                  initialTab={showChannelInfo === "bookmarks" ? "bookmarks" : "members"}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {activeRoom && <MediaRoom roomName={activeRoom} onLeave={endCall} />}

      {showNotifPrefs && (
        <NotificationPreferencesModal
          channelId={channelId}
          onClose={() => setShowNotifPrefs(false)}
          currentNotify={notifPrefs.notify}
          currentSound={notifPrefs.sound}
          onSave={(prefs) => setNotifPrefs(prefs)}
        />
      )}
    </div>
  );
}
