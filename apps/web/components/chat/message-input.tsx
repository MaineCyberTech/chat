"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { Button } from "@chat/ui";
import { api } from "@/lib/api";

interface Props {
  channelId: string;
  workspaceId?: string;
  onSend: (content: string) => Promise<void>;
  onFileUpload?: (file: File) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  typingUsers?: string[];
}

interface Member {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

const DRAFT_KEY_PREFIX = "chat-draft:";
const DRAFT_SAVE_DEBOUNCE_MS = 500;
const TYPING_THROTTLE_MS = 2000;

const QUICK_EMOJIS = ["👍", "❤️", "😄", "🎉", "🔥", "👀", "🚀", "💡"];
const COMMON_EMOJIS = [
  "😀",
  "😂",
  "🤣",
  "😊",
  "😍",
  "🤔",
  "😎",
  "🙌",
  "👏",
  "💪",
  "🔥",
  "🎉",
  "❤️",
  "👍",
  "👎",
  "🎊",
  "📌",
  "💡",
  "🚀",
  "⭐",
  "🙏",
  "💯",
  "✅",
  "❌",
];

function renderPreview(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/\n/g, "<br>");
}

export function MessageInput({
  channelId,
  workspaceId,
  onSend,
  onFileUpload,
  onTypingStart,
  onTypingStop,
  typingUsers,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [dragging, setDragging] = useState(false);
  const lastTypingEmitRef = useRef(0);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY_PREFIX}${channelId}`);
    if (draft) {
      setContent(draft);
      textareaRef.current?.focus();
    }
    setLoadedDraft(true);
  }, [channelId]);

  // Save draft on content change (debounced)
  useEffect(() => {
    if (!loadedDraft) return;
    const timer = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem(`${DRAFT_KEY_PREFIX}${channelId}`, content);
      } else {
        localStorage.removeItem(`${DRAFT_KEY_PREFIX}${channelId}`);
      }
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [content, channelId, loadedDraft]);

  // Fetch workspace members for mentions
  useEffect(() => {
    if (!workspaceId) return;
    api
      .get<{ members: Member[] }>(`/v1/workspaces/${workspaceId}/members`)
      .then((res) => setMembers(res.members))
      .catch(() => {});
  }, [workspaceId]);

  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter(
      (m) => m.display_name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [mentionQuery, members]);

  // Track @mention state
  function getMentionAtCursor(
    value: string,
    cursorPos: number,
  ): { query: string; start: number } | null {
    const before = value.slice(0, cursorPos);
    const atIdx = before.lastIndexOf("@");
    if (atIdx === -1) return null;
    const textAfter = before.slice(atIdx + 1);
    if (textAfter.includes(" ")) return null;
    return { query: textAfter, start: atIdx };
  }

  function insertMention(member: Member) {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const mention = getMentionAtCursor(content, cursorPos);
    if (!mention) return;

    const name = member.display_name ?? member.email.split("@")[0] ?? "?";
    const before = content.slice(0, mention.start);
    const after = content.slice(cursorPos);
    const newContent = `${before}@${name} ${after}`;
    setContent(newContent);
    setMentionQuery(null);

    // Restore cursor position
    requestAnimationFrame(() => {
      const pos = mention.start + name.length + 2;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursorPos = e.target.selectionStart;
      setContent(value);

      if (value.trim() && onTypingStart) {
        const now = Date.now();
        if (now - lastTypingEmitRef.current > TYPING_THROTTLE_MS) {
          lastTypingEmitRef.current = now;
          onTypingStart();
        }
      } else if (!value.trim() && onTypingStop) {
        onTypingStop();
      }

      // Check for @mention
      const mention = getMentionAtCursor(value, cursorPos);
      if (mention) {
        setMentionQuery(mention.query);
        setMentionIndex(0);
      } else {
        setMentionQuery(null);
      }

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }
    },
    [onTypingStart, onTypingStop],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionQuery && filteredMembers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => (i + 1) % filteredMembers.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const m = filteredMembers[mentionIndex];
          if (m) insertMention(m);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionQuery(null);
          return;
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [mentionQuery, filteredMembers, mentionIndex],
  );

  const handleSubmit = useCallback(async () => {
    const text = content.trim();
    if (!text && files.length === 0) return;
    if (sending) return;

    setSending(true);
    setSendError("");
    try {
      if (text) await onSend(text);
      if (files.length > 0 && onFileUpload) {
        for (const file of files) await onFileUpload(file);
      }
      setContent("");
      setFiles([]);
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${channelId}`);
      if (onTypingStop) onTypingStop();
      textareaRef.current?.focus();
    } catch {
      setSendError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [content, files, onSend, onFileUpload, onTypingStop, channelId, sending]);

  // Drag-drop handlers
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragging(true);
    };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer?.files && onFileUpload) {
        for (const file of Array.from(e.dataTransfer.files)) {
          onFileUpload(file);
        }
      }
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(textarea.selectionEnd);
    const newContent = `${before}${emoji} ${after}`;
    setContent(newContent);
    setShowEmojiPicker(false);
    const pos = start + emoji.length + 1;
    requestAnimationFrame(() => {
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  }

  return (
    <div
      ref={dropRef}
      className={`relative border-t border-[var(--color-border-primary)] bg-[var(--color-background-primary)] p-3 transition-colors md:p-4 ${dragging ? "bg-[var(--color-brand-primary-light)]" : ""}`}
    >
      {dragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-brand-primary)] bg-[var(--color-dialog-overlay)]">
          <p className="text-sm font-medium text-[var(--color-brand-primary)]">
            Drop files to upload
          </p>
        </div>
      )}

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

      {/* Markdown preview */}
      {showPreview && content.trim() && (
        <div
          className="mb-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] p-3 text-sm text-[var(--color-foreground-primary)]"
          dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
        />
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
          className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-lg p-2 text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
          aria-label="Attach file"
        >
          📎
        </label>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2 text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
          aria-label="Emoji picker"
        >
          😊
        </button>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2 text-xs font-medium transition-colors ${
            showPreview
              ? "bg-[var(--color-brand-primary)] text-white"
              : "text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
          }`}
          aria-label={showPreview ? "Hide preview" : "Show preview"}
        >
          ¶
        </button>
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... Use @ to mention someone"
            rows={1}
            className="max-h-[120px] min-h-[44px] w-full resize-none rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ overflowY: "auto" }}
            aria-label="Message"
          />

          {/* Emoji picker popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 z-10 mb-1 w-64 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] p-2 shadow-[var(--shadow-xl)]">
              <p className="mb-1 text-xs font-medium text-[var(--color-foreground-tertiary)]">
                Quick emojis
              </p>
              <div className="mb-2 flex flex-wrap gap-1">
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => insertEmoji(e)}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-[var(--color-background-tertiary)]"
                    aria-label={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <p className="mb-1 text-xs font-medium text-[var(--color-foreground-tertiary)]">
                All emojis
              </p>
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {COMMON_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => insertEmoji(e)}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-[var(--color-background-tertiary)]"
                    aria-label={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mentions autocomplete */}
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <div className="absolute right-0 bottom-full left-0 z-10 mb-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-primary)] shadow-[var(--shadow-xl)]">
              {filteredMembers.map((member, i) => (
                <button
                  key={member.user_id}
                  onClick={() => insertMention(member)}
                  onMouseEnter={() => setMentionIndex(i)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                    i === mentionIndex
                      ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                      : "text-[var(--color-foreground-primary)] hover:bg-[var(--color-background-tertiary)]"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-xs font-medium text-[var(--color-avatar-fg)]">
                    {(member.display_name ?? member.email).charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">
                    {member.display_name ?? member.email.split("@")[0]}
                  </span>
                  <span className="text-xs text-[var(--color-foreground-tertiary)]">
                    {member.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex min-h-[44px] min-w-[44px] shrink-0">
          <Button
            size="md"
            onClick={handleSubmit}
            disabled={sending || (!content.trim() && files.length === 0)}
          >
            ➤
          </Button>
        </div>
      </div>
      {sendError && (
        <p className="mt-1 text-xs text-[var(--color-status-danger-fg)]" role="alert">
          {sendError}
        </p>
      )}
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
