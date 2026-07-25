"use client";

import React, { useEffect, useRef } from "react";
import { Reply, Copy, Clock, Pencil, Trash2, Share2, Pin } from "lucide-react";
import { useToast } from "@chat/ui";
import type { Message } from "@chat/db";

export interface ContextMenuState {
  x: number;
  y: number;
  message: Message;
}

export function MessageContextMenu({
  contextMenu,
  currentUserId,
  menuRef,
  onReply,
  onEdit,
  onDelete,
  onClose,
  onStartEdit,
  onSetDeleteConfirmId,
  onSetRemindMessageId,
  onForward,
  onPin,
}: {
  contextMenu: ContextMenuState;
  currentUserId?: string;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onClose: () => void;
  onStartEdit: (msg: Message) => void;
  onSetDeleteConfirmId: (id: string | null) => void;
  onSetRemindMessageId: (id: string | null) => void;
  onForward?: (message: Message) => void;
  onPin?: (message: Message) => void;
}) {
  const { addToast } = useToast();
  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-focus first menu item on open
  useEffect(() => {
    requestAnimationFrame(() => {
      menuItemsRef.current[0]?.focus();
    });
  }, []);

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const items = menuItemsRef.current.filter(Boolean) as HTMLButtonElement[];
    const currentIdx = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (currentIdx + 1) % items.length;
      items[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (currentIdx - 1 + items.length) % items.length;
      items[prev]?.focus();
    } else if (e.key === "Tab") {
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function renderMenuItems() {
    return (
      <>
        <button
          ref={(el) => {
            menuItemsRef.current[0] = el;
          }}
          onClick={() => {
            onReply?.(contextMenu.message);
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm"
          style={{ color: "var(--center-channel-color)" }}
          role="menuitem"
        >
          <Reply size={14} /> Reply
        </button>
        <button
          ref={(el) => {
            menuItemsRef.current[1] = el;
          }}
          onClick={() => {
            navigator.clipboard
              .writeText(contextMenu.message.content)
              .then(() => addToast({ title: "Copied", variant: "success", duration: 2000 }))
              .catch(() => addToast({ title: "Failed to copy", variant: "error", duration: 3000 }));
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm"
          style={{ color: "var(--center-channel-color)" }}
          role="menuitem"
        >
          <Copy size={14} /> Copy text
        </button>
        <button
          ref={(el) => {
            menuItemsRef.current[2] = el;
          }}
          onClick={() => {
            const permalink = `${window.location.origin}/pl/${contextMenu.message.id}`;
            navigator.clipboard
              .writeText(permalink)
              .then(() => addToast({ title: "Link copied", variant: "success", duration: 2000 }))
              .catch(() =>
                addToast({ title: "Failed to copy link", variant: "error", duration: 3000 }),
              );
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm"
          style={{ color: "var(--center-channel-color)" }}
          role="menuitem"
        >
          <Copy size={14} /> Copy link
        </button>
        <button
          ref={(el) => {
            menuItemsRef.current[3] = el;
          }}
          onClick={() => {
            onSetRemindMessageId(contextMenu.message.id);
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm"
          style={{ color: "var(--center-channel-color)" }}
          role="menuitem"
        >
          <Clock size={14} /> Remind me
        </button>
        {onForward && (
          <button
            ref={(el) => {
              menuItemsRef.current[6] = el;
            }}
            onClick={() => {
              onForward(contextMenu.message);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--center-channel-color)" }}
            role="menuitem"
          >
            <Share2 size={14} /> Forward
          </button>
        )}
        {onPin && (
          <button
            ref={(el) => {
              menuItemsRef.current[7] = el;
            }}
            onClick={() => {
              onPin(contextMenu.message);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--center-channel-color)" }}
            role="menuitem"
          >
            <Pin size={14} /> Pin
          </button>
        )}
        {contextMenu.message.user_id === currentUserId && onEdit && (
          <button
            ref={(el) => {
              menuItemsRef.current[8] = el;
            }}
            onClick={() => {
              onStartEdit(contextMenu.message);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--center-channel-color)" }}
            role="menuitem"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
        {contextMenu.message.user_id === currentUserId && onDelete && (
          <button
            ref={(el) => {
              menuItemsRef.current[9] = el;
            }}
            onClick={() => {
              onSetDeleteConfirmId(contextMenu.message.id);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm"
            style={{ color: "var(--dnd-indicator)" }}
            role="menuitem"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </>
    );
  }

  if (isTouchDevice) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div
          ref={menuRef}
          className="fixed right-0 bottom-0 left-0 z-50 rounded-t-xl border px-2 pt-2 pb-6"
          style={{
            background: "var(--center-channel-bg)",
            borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
            boxShadow: "var(--elevation-5)",
          }}
          role="menu"
          aria-label="Message actions"
          onKeyDown={handleMenuKeyDown}
        >
          {renderMenuItems()}
        </div>
      </>
    );
  }

  return (
    <div
      ref={menuRef}
      className="min-w-[160px] rounded-lg border py-1"
      style={{
        position: "fixed",
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: "var(--z-context-menu, 80)",
        background: "var(--center-channel-bg)",
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
        boxShadow: "var(--elevation-4)",
      }}
      role="menu"
      aria-label="Message actions"
      onKeyDown={handleMenuKeyDown}
    >
      {renderMenuItems()}
    </div>
  );
}
