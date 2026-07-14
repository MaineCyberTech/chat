"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useToast, EmptyState } from "@chat/ui";
import { api } from "@/lib/api";
import { RemindModal } from "./remind-modal";
import type { Message, UserProfile } from "@chat/db";
import { MessageItem } from "./message-list/message-item";
import type { Reaction, MessageMeta } from "./message-list/message-item";
import { MessageContextMenu } from "./message-list/context-menu";
import type { ContextMenuState } from "./message-list/context-menu";
import { DeleteDialog } from "./message-list/delete-dialog";

const GROUP_GAP_MS = 5 * 60 * 1000;
const TOP_TRIGGER_OFFSET = 200;

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
  flaggedMessages?: Set<string>;
  onToggleFlag?: (messageId: string, flagged: boolean) => void;
  sendErrors?: Map<string, string>;
  onRetry?: (messageId: string) => void;
  onUndoDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  onPin?: (message: Message) => void;
  channelTopic?: string;
}

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
  flaggedMessages: _flaggedMessages,
  onToggleFlag: _onToggleFlag,
  sendErrors,
  onRetry,
  onUndoDelete: _onUndoDelete,
  onForward,
  onPin,
  channelTopic,
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
  const [flaggedMsgs, setFlaggedMsgs] = useState<Set<string>>(new Set());
  const [pullDistance, setPullDistance] = useState(0);
  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

  async function toggleFlag(messageId: string, currentlyFlagged: boolean) {
    try {
      if (currentlyFlagged) {
        await api.delete(`/messages/${messageId}/flag`);
        setFlaggedMsgs((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
      } else {
        await api.post(`/messages/${messageId}/flag`, {});
        setFlaggedMsgs((prev) => new Set(prev).add(messageId));
      }
    } catch {
      console.warn("Failed to toggle flag");
    }
  }
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

    const CHUNK_SIZE = 20;
    const chunks: string[][] = [];
    for (let i = 0; i < newIds.length; i += CHUNK_SIZE) {
      chunks.push(newIds.slice(i, i + CHUNK_SIZE));
    }
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
                  .then((res) => ({ id, reactions: res.reactions }))
                  .catch(() => ({ id, reactions: [] as Reaction[] })),
              ),
            ),
          ),
      ),
    ).then((chunkResults) => mergeResults(chunkResults.flat()));
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
    } catch {
      setDeleteError("Failed to delete message.");
      addToast({ title: "Error", description: "Failed to delete message.", variant: "error" });
    }
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    const menuW = 180;
    const menuH = 240;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
    setContextMenu({ x: Math.max(8, x), y: Math.max(8, y), message: msg });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, msg: Message) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      if (touch) {
        const menuW = 180;
        const menuH = 240;
        const x = Math.min(touch.clientX, window.innerWidth - menuW - 8);
        const y = Math.min(touch.clientY, window.innerHeight - menuH - 8);
        setContextMenu({ x: Math.max(8, x), y: Math.max(8, y), message: msg });
      }
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);
  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const pullStartY = useRef(0);
  const isPullingRef = useRef(false);

  const handlePullTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isTouchDevice || !onLoadOlder || !hasMoreOlder) return;
      const el = listRef.current;
      if (!el || el.scrollTop > 0) return;
      pullStartY.current = e.touches[0]!.clientY;
      isPullingRef.current = false;
    },
    [isTouchDevice, onLoadOlder, hasMoreOlder],
  );

  const handlePullTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isTouchDevice || !onLoadOlder || !hasMoreOlder) return;
      const el = listRef.current;
      if (!el || el.scrollTop > 0) {
        setPullDistance(0);
        return;
      }
      const diff = e.touches[0]!.clientY - pullStartY.current;
      if (diff > 0) {
        isPullingRef.current = true;
        setPullDistance(Math.min(diff * 0.5, 120));
      }
    },
    [isTouchDevice, onLoadOlder, hasMoreOlder],
  );

  const handlePullTouchEnd = useCallback(() => {
    if (!isTouchDevice || !onLoadOlder || !hasMoreOlder) return;
    if (pullDistance > 60 && pullStartY.current !== 0) {
      onLoadOlder();
    }
    pullStartY.current = 0;
    isPullingRef.current = false;
    setPullDistance(0);
  }, [isTouchDevice, onLoadOlder, hasMoreOlder, pullDistance]);

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
    const sorted = [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const result: MessageMeta[] = [];
    let lastDate: string | null = null;
    let lastUserId: string | null = null;
    let lastUserTime: number | null = null;

    for (const msg of sorted) {
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

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: messagesWithMeta.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => {
      const msg = messagesWithMeta[index];
      if (!msg) return 80;
      let h = 40;
      if (msg.showDate) h += 40;
      if (msg.isGroupStart) h += 28;
      const lines = Math.ceil((msg.content?.length ?? 0) / 80);
      h += Math.min(lines * 22, 300);
      return Math.max(h, 64);
    },
    getItemKey: (index) => messagesWithMeta[index]?.id ?? index,
    overscan: 8,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const handleScrollOverride = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
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
    el.addEventListener("scroll", handleScrollOverride, { passive: true });
    return () => el.removeEventListener("scroll", handleScrollOverride);
  }, [handleScrollOverride]);

  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(messagesWithMeta.length - 1, { align: "end" });
  }, [virtualizer, messagesWithMeta.length]);

  const prevLengthRef = useRef(messagesWithMeta.length);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const prevLen = prevLengthRef.current;
    const curLen = messagesWithMeta.length;
    prevLengthRef.current = curLen;

    const restore = scrollRestoreRef.current;
    if (restore) {
      scrollRestoreRef.current = null;
      requestAnimationFrame(() => {
        if (!listRef.current) return;
        const newScrollHeight = listRef.current.scrollHeight;
        listRef.current.scrollTop =
          restore.prevScrollTop + (newScrollHeight - restore.prevScrollHeight);
      });
      return;
    }

    if (curLen > prevLen && didInitialScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isAtBottom) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    }
  }, [messagesWithMeta.length]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (didInitialScrollRef.current) return;
    didInitialScrollRef.current = true;

    const scrollDown = () => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    };

    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollDown();
        setTimeout(scrollDown, 100);
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="relative flex-1 overflow-clip">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-sm text-center" style={{ padding: "120px 24px 32px" }}>
            <EmptyState description={channelTopic ?? "No messages yet. Start the conversation!"} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        id="post-list"
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Message list"
        style={{ overflow: "auto", flex: 1, position: "relative" }}
        onTouchStart={handlePullTouchStart}
        onTouchMove={handlePullTouchMove}
        onTouchEnd={handlePullTouchEnd}
      >
        {pullDistance > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: pullDistance,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              pointerEvents: "none",
              transition: pullDistance === 0 ? "height 0.2s ease" : undefined,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        )}
        {loadingOlder && (
          <div
            className="flex justify-center py-3"
            style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 5 }}
          >
            <div
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.3)",
                borderTopColor: "transparent",
              }}
            />
          </div>
        )}
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            if (virtualRow.index >= messagesWithMeta.length) return null;
            const msg = messagesWithMeta[virtualRow.index];
            if (!msg) return null;
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                ref={virtualizer.measureElement}
              >
                <MessageItem
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
                  flaggedMessages={flaggedMsgs}
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
                  onToggleFlag={toggleFlag}
                  onSetPickerMessageId={setPickerMessageId}
                  onSetDeleteConfirmId={handleSetDeleteConfirmId}
                  sendErrors={sendErrors}
                  onRetry={onRetry}
                />
              </div>
            );
          })}
        </div>
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
        <MessageContextMenu
          contextMenu={contextMenu}
          currentUserId={currentUserId}
          menuRef={contextMenuRef}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onForward={onForward}
          onPin={onPin}
          onClose={() => setContextMenu(null)}
          onStartEdit={(msg) => startEdit(msg)}
          onSetDeleteConfirmId={handleSetDeleteConfirmId}
          onSetRemindMessageId={setRemindMessageId}
        />
      )}

      {deleteConfirmId && (
        <DeleteDialog
          deleteConfirmId={deleteConfirmId}
          deleteError={deleteError}
          onClose={() => {
            setDeleteConfirmId(null);
            setDeleteError("");
          }}
          onConfirm={confirmDelete}
          dialogRef={deleteDialogRef}
        />
      )}

      {remindMessageId && (
        <RemindModal messageId={remindMessageId} onClose={() => setRemindMessageId(null)} />
      )}
    </>
  );
}
