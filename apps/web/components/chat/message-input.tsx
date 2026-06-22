"use client";

import React, { useRef, useCallback, useState } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);
      if (value.trim() && onTypingStart) onTypingStart();
      else if (!value.trim() && onTypingStop) onTypingStop();

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }
    },
    [onTypingStart, onTypingStop],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = content.trim();
    if (!text && files.length === 0) return;

    if (text) await onSend(text);
    if (files.length > 0 && onFileUpload) {
      for (const file of files) await onFileUpload(file);
    }
    setContent("");
    setFiles([]);
    if (onTypingStop) onTypingStop();
    textareaRef.current?.focus();
  }, [content, files, onSend, onFileUpload, onTypingStop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-background-primary)] p-3 md:p-4">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {files.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="flex items-center gap-1 rounded bg-[var(--color-background-tertiary)] px-2 py-0.5 text-xs text-[var(--color-foreground-secondary)]"
            >
              {file.type.startsWith("image/") ? "🖼" : "📎"}
              {file.name}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 p-0.5 text-[var(--color-foreground-tertiary)] hover:text-[var(--color-status-danger-fg)]"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          type="file"
          id={`file-upload-${channelId}`}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <label
          htmlFor={`file-upload-${channelId}`}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2 text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
          aria-label="Attach file"
        >
          📎
        </label>
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="max-h-[120px] min-h-[44px] w-full resize-none rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ overflowY: "auto" }}
          />
        </div>
        <div className="flex min-h-[44px] min-w-[44px] shrink-0">
          <Button size="md" onClick={handleSubmit} disabled={!content.trim() && files.length === 0}>
            ➤
          </Button>
        </div>
      </div>
      {typingUsers && typingUsers.length > 0 && (
        <p
          className="mt-1 text-xs text-[var(--color-foreground-tertiary)]"
          role="status"
          aria-live="polite"
        >
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} people are typing...`}
        </p>
      )}
    </div>
  );
}
