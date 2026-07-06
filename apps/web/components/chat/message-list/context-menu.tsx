"use client";

import React from "react";
import { Reply, Copy, Clock, Pencil, Trash2 } from "lucide-react";
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
}) {
  const { addToast } = useToast();

  return (
    <div
      ref={menuRef}
      className="min-w-[160px] rounded-lg border py-1"
      style={{
        position: "fixed",
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: 100,
        background: "var(--center-channel-bg)",
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
        boxShadow: "var(--elevation-4)",
      }}
      role="menu"
      aria-label="Message actions"
    >
      <button
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
        onClick={() => {
          navigator.clipboard
            .writeText(contextMenu.message.content)
            .then(() => addToast({ title: "Copied", variant: "success", duration: 2000 }))
            .catch(() => {});
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
        style={{ color: "var(--center-channel-color)" }}
        role="menuitem"
      >
        <Copy size={14} /> Copy text
      </button>
      <button
        onClick={() => {
          const permalink = `${window.location.origin}/pl/${contextMenu.message.id}`;
          navigator.clipboard
            .writeText(permalink)
            .then(() => addToast({ title: "Link copied", variant: "success", duration: 2000 }))
            .catch(() => {});
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
        style={{ color: "var(--center-channel-color)" }}
        role="menuitem"
      >
        <Copy size={14} /> Copy link
      </button>
      <button
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
      {contextMenu.message.user_id === currentUserId && onEdit && (
        <button
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
    </div>
  );
}
