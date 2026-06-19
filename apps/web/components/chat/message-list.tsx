"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Message, UserProfile } from "@chat/db";

interface Props {
  messages: Message[];
  currentUserId?: string;
  profiles: Map<string, UserProfile>;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

function authorName(userId: string, profiles: Map<string, UserProfile>): string {
  const p = profiles.get(userId);
  return p?.display_name ?? p?.email?.split("@")[0] ?? userId.slice(0, 8);
}

export function MessageList({
  messages,
  currentUserId,
  profiles,
  onReply,
  onEdit,
  onDelete,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditContent(msg.content);
  }

  async function submitEdit() {
    if (!editingId || !onEdit) return;
    await onEdit(editingId, editContent);
    setEditingId(null);
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {messages.map((msg) => {
        const isOwn = msg.user_id === currentUserId;
        return (
          <div
            key={msg.id}
            className={`group mb-1 ${isOwn ? "flex justify-end" : "flex justify-start"}`}
          >
            <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
              {!isOwn && (
                <p className="mb-0.5 pl-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {authorName(msg.user_id, profiles)}
                </p>
              )}
              <div className="flex items-start gap-1">
                {editingId === msg.id ? (
                  <div className="flex gap-1">
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                        if (e.key === "Enter") submitEdit();
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                      autoFocus
                    />
                    <button onClick={submitEdit} className="text-xs text-blue-600 hover:underline">
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className={`rounded-lg px-3 py-1.5 ${
                      isOwn
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {msg.parent_id && <p className="mb-0.5 text-xs italic opacity-60">↳ reply</p>}
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                    {msg.edited_at && <p className="mt-0.5 text-xs opacity-70">edited</p>}
                    <p className="mt-0.5 text-right text-xs opacity-50">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
                {/* Hover actions */}
                <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {onReply && (
                    <button
                      onClick={() => onReply(msg)}
                      className="rounded px-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                      title="Reply"
                    >
                      ↩
                    </button>
                  )}
                  {isOwn && onEdit && (
                    <button
                      onClick={() => startEdit(msg)}
                      className="rounded px-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                      title="Edit"
                    >
                      ✎
                    </button>
                  )}
                  {isOwn && onDelete && (
                    <button
                      onClick={() => onDelete(msg.id)}
                      className="rounded px-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
