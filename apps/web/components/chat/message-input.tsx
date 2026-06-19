"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@chat/ui";

interface Props {
  channelId: string;
  onSend: (content: string) => Promise<void>;
  onFileUpload?: (file: File) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  typingUsers?: string[];
}

export function MessageInput({
  channelId,
  onSend,
  onFileUpload,
  onTypingStart,
  onTypingStop,
  typingUsers,
}: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleTyping = useCallback(() => {
    onTypingStart?.();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTypingStop?.(), 1500);
  }, [onTypingStart, onTypingStop]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setContent("");
      onTypingStop?.();
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;
    setUploading(true);
    try {
      await onFileUpload(file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-800">
      {typingUsers && typingUsers.length > 0 && (
        <p className="mb-1 text-xs text-gray-400">{typingUsers.join(", ")} typing...</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {onFileUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              title="Attach file"
            >
              {uploading ? "⏳" : "📎"}
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          placeholder={`Message #${channelId}`}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
        />
        <Button type="submit" disabled={sending || !content.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
