"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { Button, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Paperclip, Smile, Eye, Send, Image, File, X } from "lucide-react";
import { FormattingBar } from "./formatting-bar";
import { CodeBlock } from "./code-block";
import { SLASH_COMMANDS } from "@/lib/slash-commands";

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

const EMOJI_LIST = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "🤗",
  "🤩",
  "🤔",
  "🤨",
  "😐",
  "😑",
  "😶",
  "🙄",
  "😏",
  "😣",
  "😥",
  "😮",
  "🤐",
  "😯",
  "😪",
  "😫",
  "😴",
  "😌",
  "😛",
  "😜",
  "😝",
  "🤤",
  "😒",
  "😓",
  "😔",
  "😕",
  "🙃",
  "🤑",
  "😲",
  "☹️",
  "🙁",
  "😖",
  "😞",
  "😟",
  "😤",
  "😢",
  "😭",
  "😦",
  "😧",
  "😨",
  "😩",
  "🤯",
  "😬",
  "😰",
  "😱",
  "🥵",
  "🥶",
  "😳",
  "🤪",
  "😵",
  "😡",
  "😠",
  "🤬",
  "👍",
  "👎",
  "👊",
  "✊",
  "🤛",
  "🤜",
  "👏",
  "🙌",
  "👐",
  "🤲",
  "🤝",
  "🙏",
  "✍️",
  "💅",
  "👀",
  "👁️",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💕",
  "💞",
  "💗",
  "💖",
  "💘",
  "💝",
  "⭐",
  "🌟",
  "✨",
  "⚡",
  "🔥",
  "💥",
  "💫",
  "💨",
  "🌈",
  "☀️",
  "🌙",
  "⭐",
  "🌊",
  "💧",
  "❄️",
  "🎉",
  "🎊",
  "🎈",
  "🎁",
  "🎀",
  "🪄",
  "🎶",
  "🎵",
  "📌",
  "📍",
  "💡",
  "🔑",
  "🔒",
  "🔓",
  "✅",
  "❌",
  "❓",
  "❗",
  "⚠️",
  "🚫",
  "🔞",
  "♻️",
  "💯",
  "🔝",
  "🔜",
  "🔛",
  "🔙",
  "↗️",
  "📢",
  "🔔",
  "🔕",
  "🎤",
  "📷",
];

function filterEmojis(query: string): string[] {
  if (!query) return EMOJI_LIST.slice(0, 50);
  const lower = query.toLowerCase();
  return EMOJI_LIST.filter((e: string) => e.toLowerCase().includes(lower)).slice(0, 50);
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-brand-primary)] underline"
          >
            {children}
          </a>
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className ?? "");
          const code = String(children).replace(/\n$/, "");
          if (match) {
            return <CodeBlock code={code} language={match[1]} />;
          }
          return (
            <code
              className="rounded bg-[var(--color-background-tertiary)] px-1 py-0.5 font-mono text-sm"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
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
  const [showFormatting, setShowFormatting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const lastTypingEmitRef = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Close emoji picker on click outside and Escape
  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowEmojiPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showEmojiPicker]);

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
      .catch(() => console.warn("Failed to fetch workspace members for mentions"));
  }, [workspaceId]);

  // Paste handler for clipboard images
  useEffect(() => {
    const el = dropRef.current;
    if (!el || !onFileUpload) return;
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItems = Array.from(items).filter(
        (item) => item.kind === "file" && item.type.startsWith("image/"),
      );
      if (imageItems.length === 0) return;
      e.preventDefault();
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file && onFileUpload) {
          onFileUpload(file);
        }
      }
    }
    el.addEventListener("paste", handlePaste);
    return () => el.removeEventListener("paste", handlePaste);
  }, [onFileUpload]);

  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter(
      (m) => m.display_name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [mentionQuery, members]);

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return [];
    const q = slashQuery.toLowerCase();
    return SLASH_COMMANDS.filter((cmd) => cmd.command.toLowerCase().includes(q));
  }, [slashQuery]);

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

      // Check for slash command at start of line
      const beforeCursor = value.slice(0, cursorPos);
      const lastNewline = beforeCursor.lastIndexOf("\n");
      const currentLine = beforeCursor.slice(lastNewline + 1);
      if (currentLine.startsWith("/") && !currentLine.includes(" ")) {
        setSlashQuery(currentLine);
        setSlashIndex(0);
      } else {
        setSlashQuery(null);
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
      // Slash command navigation
      if (slashQuery && filteredCommands.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashIndex((i) => (i + 1) % filteredCommands.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const cmd = filteredCommands[slashIndex];
          if (cmd) {
            setContent(cmd.command + " ");
            setSlashQuery(null);
            textareaRef.current?.focus();
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSlashQuery(null);
          return;
        }
      }

      // Mention navigation
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
    [mentionQuery, filteredCommands, filteredMembers, mentionIndex, slashQuery, slashIndex],
  );

  const handleSubmit = useCallback(async () => {
    let text = content.trim();
    if (!text && files.length === 0) return;
    if (sending) return;

    // Execute slash command if content starts with /
    if (text.startsWith("/")) {
      const firstWord = text.split(" ")[0]?.toLowerCase();
      let commandResult: string | null = null;
      if (firstWord === "/me" && text.length > 3) {
        commandResult = `_${text.slice(4).trim()}_`;
      } else if (firstWord === "/shrug") {
        commandResult = `${text.slice(7).trim()} ¯\\_(ツ)_/¯`;
      } else if (firstWord === "/tableflip") {
        commandResult = `${text.slice(11).trim()} (╯°□°)╯︵ ┻━┻`;
      } else if (firstWord === "/code" && text.length > 5) {
        commandResult = "```\n" + text.slice(6).trim() + "\n```";
      } else if (firstWord === "/joke") {
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs!",
          "There are 10 types of people in the world: those who understand binary and those who don't.",
          "Why was the JavaScript developer sad? Because he didn't Node how to Express himself.",
          "I told my computer I needed a break. Now it won't stop sending me vacation ads.",
        ];
        commandResult = jokes[Math.floor(Math.random() * jokes.length)] ?? null;
      }
      if (commandResult !== null) {
        text = commandResult;
      }
    }

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
      const msg = "Failed to send message. Please try again.";
      setSendError(msg);
      addToast({ title: "Error", description: msg, variant: "error" });
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
              {file.type.startsWith("image/") ? (
                <Image size={14} className="inline" />
              ) : (
                <File size={14} className="inline" />
              )}
              {file.name}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 p-0.5 text-[var(--color-foreground-tertiary)] hover:text-[var(--color-status-danger-fg)]"
                aria-label={`Remove ${file.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Markdown preview */}
      {showPreview && content.trim() && (
        <div className="mb-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] p-3 text-sm text-[var(--color-foreground-primary)]">
          <MarkdownPreview content={content} />
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex shrink-0 flex-col gap-1">
          <input
            type="file"
            id={`file-upload-${channelId}`}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <label
            htmlFor={`file-upload-${channelId}`}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg p-2 text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </label>
          <button
            onClick={() => setShowFormatting(!showFormatting)}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-xs font-medium transition-colors ${
              showFormatting
                ? "bg-[var(--color-brand-primary)] text-white"
                : "text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
            }`}
            aria-label="Toggle formatting toolbar"
            title="Formatting"
          >
            <span className="text-base leading-none">T</span>
          </button>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg p-2 text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
            aria-label="Emoji picker"
          >
            <Smile size={18} />
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg p-2 text-xs font-medium transition-colors ${
              showPreview
                ? "bg-[var(--color-brand-primary)] text-white"
                : "text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
            }`}
            aria-label={showPreview ? "Hide preview" : "Show preview"}
          >
            <Eye size={18} />
          </button>
        </div>

        <div className="relative min-w-0 flex-1">
          {showFormatting && (
            <FormattingBar textareaRef={textareaRef} content={content} setContent={setContent} />
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... Use @ to mention, / for commands"
            rows={1}
            className="max-h-[120px] min-h-[44px] w-full resize-none rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ overflowY: "auto" }}
            aria-label="Message"
          />

          {/* Emoji picker popover */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full left-0 z-10 mb-1 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] p-2 shadow-[var(--shadow-xl)]"
            >
              <input
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                placeholder="Search emojis..."
                className="mb-2 w-full rounded-md border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-1 focus:ring-[var(--color-input-focus-ring)] focus:outline-none"
                aria-label="Search emojis"
                autoFocus
              />
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
                {emojiSearch ? "Search results" : "All emojis"}
              </p>
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {filterEmojis(emojiSearch).map((e) => (
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

          {/* Slash commands autocomplete */}
          {slashQuery !== null && filteredCommands.length > 0 && (
            <div className="absolute bottom-full left-0 z-10 mb-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-primary)] shadow-[var(--shadow-xl)]">
              {filteredCommands.map((cmd, i) => (
                <button
                  key={cmd.command}
                  onClick={() => {
                    setContent(cmd.command + " ");
                    setSlashQuery(null);
                    textareaRef.current?.focus();
                  }}
                  onMouseEnter={() => setSlashIndex(i)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                    i === slashIndex
                      ? "bg-[var(--color-background-tertiary)]"
                      : "hover:bg-[var(--color-background-tertiary)]"
                  }`}
                >
                  <span className="font-medium text-[var(--color-brand-primary)]">
                    {cmd.command}
                  </span>
                  <span className="text-xs text-[var(--color-foreground-tertiary)]">
                    {cmd.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Mentions autocomplete */}
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 z-10 mb-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-primary)] shadow-[var(--shadow-xl)]">
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
            <Send size={18} />
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
