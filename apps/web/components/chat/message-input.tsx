"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { Button, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Paperclip,
  Smile,
  Eye,
  Send,
  Image,
  File,
  X,
  Flag,
  AlertTriangle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { FormattingBar } from "./formatting-bar";
import { CodeBlock } from "./code-block";
import { EmojiPicker, searchEmojis } from "./emoji-picker";
import { TipTapEditor, type Editor } from "./tiptap-editor";
import { SLASH_COMMANDS } from "@/lib/slash-commands";

type PostPriority = "standard" | "important" | "urgent" | "critical";

interface Props {
  channelId: string;
  workspaceId?: string;
  onSend: (content: string, priority?: string) => Promise<void>;
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
            style={{ color: "var(--link-color)" }}
          >
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className ?? "");
          const code = String(children).replace(/\n$/, "");
          if (match) return <CodeBlock code={code} language={match[1]} />;
          return (
            <code
              className="rounded px-1 py-0.5 font-mono text-sm"
              style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}
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
  const editorRef = useRef<HTMLDivElement>(null);
  const tiptapRef = useRef<Editor | null>(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showMentionWarning, setShowMentionWarning] = useState(false);
  const [pendingMentionText, setPendingMentionText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [colonQuery, setColonQuery] = useState<{
    start: number;
    end: number;
    query: string;
  } | null>(null);
  const [colonIndex, setColonIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [priority, setPriority] = useState<PostPriority>("standard");
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showPriorityWarning, setShowPriorityWarning] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const schedulePickerRef = useRef<HTMLDivElement>(null);
  const priorityWarningAcked = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const PRIORITY_CONFIG: Record<
    PostPriority,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    standard: {
      label: "Standard",
      icon: <Flag size={14} />,
      color: "rgba(var(--center-channel-color-rgb), 0.56)",
    },
    important: {
      label: "Important",
      icon: <AlertCircle size={14} />,
      color: "var(--online-indicator)",
    },
    urgent: { label: "Urgent", icon: <AlertTriangle size={14} />, color: "var(--dnd-indicator)" },
    critical: { label: "Critical", icon: <AlertTriangle size={14} />, color: "var(--error-text)" },
  };

  const PRIORITY_ORDER: PostPriority[] = ["standard", "important", "urgent", "critical"];

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node))
        setShowEmojiPicker(false);
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

  useEffect(() => {
    if (!showPriorityPicker) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(e.target as Node))
        setShowPriorityPicker(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowPriorityPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showPriorityPicker]);

  useEffect(() => {
    const draft = localStorage.getItem(`${DRAFT_KEY_PREFIX}${channelId}`);
    if (draft) {
      setContent(draft);
      setTimeout(() => tiptapRef.current?.commands.focus(), 0);
    }
    setLoadedDraft(true);
  }, [channelId]);

  useEffect(() => {
    if (!loadedDraft) return;
    const timer = setTimeout(() => {
      if (content.trim()) localStorage.setItem(`${DRAFT_KEY_PREFIX}${channelId}`, content);
      else localStorage.removeItem(`${DRAFT_KEY_PREFIX}${channelId}`);
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [content, channelId, loadedDraft]);

  useEffect(() => {
    if (!workspaceId) return;
    api
      .get<{ members: Member[] }>(`/v1/workspaces/${workspaceId}/members`)
      .then((res) => setMembers(res.members))
      .catch(() => console.warn("Failed to fetch workspace members for mentions"));
  }, [workspaceId]);

  useEffect(() => {
    const el = editorRef.current;
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
        if (file && onFileUpload) onFileUpload(file);
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

  const colonEmojis = useMemo(() => {
    if (!colonQuery) return [];
    return searchEmojis(colonQuery.query);
  }, [colonQuery]);

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
    const editor = tiptapRef.current;
    if (!editor) return;
    const text = editor.getText();
    const cursorPos = editor.state.selection.from;
    const mention = getMentionAtCursor(text, cursorPos);
    if (!mention) return;
    const name = member.display_name ?? member.email.split("@")[0] ?? "?";
    const before = text.slice(0, mention.start);
    const after = text.slice(cursorPos);
    const newText = `${before}@${name} ${after}`;
    editor.commands.setContent(newText);
    setContent(editor.getHTML());
    setMentionQuery(null);
    editor.commands.focus();
  }

  const handleTipTapChange = useCallback(
    (text: string) => {
      const cursorPos = tiptapRef.current?.state.selection.from ?? text.length;

      if (text.trim() && onTypingStart) {
        const now = Date.now();
        if (now - lastTypingEmitRef.current > TYPING_THROTTLE_MS) {
          lastTypingEmitRef.current = now;
          onTypingStart();
        }
      } else if (!text.trim() && onTypingStop) {
        onTypingStop();
      }

      const beforeCursor = text.slice(0, cursorPos);
      const lastNewline = beforeCursor.lastIndexOf("\n");
      const currentLine = beforeCursor.slice(lastNewline + 1);
      if (currentLine.startsWith("/") && !currentLine.includes(" ")) {
        setSlashQuery(currentLine);
        setSlashIndex(0);
      } else {
        setSlashQuery(null);
      }

      const mention = getMentionAtCursor(text, cursorPos);
      if (mention) {
        setMentionQuery(mention.query);
        setMentionIndex(0);
      } else {
        setMentionQuery(null);
      }

      const colonBefore = text.slice(0, cursorPos);
      const colonStart = colonBefore.lastIndexOf(":", cursorPos - 1);
      if (
        colonStart !== -1 &&
        colonStart < cursorPos - 1 &&
        !colonBefore.slice(colonStart + 1).includes(" ")
      ) {
        const q = text.slice(colonStart + 1, cursorPos);
        if (q.length > 0 && q.length < 40) {
          setColonQuery({ start: colonStart, end: cursorPos, query: q });
          setColonIndex(0);
        } else {
          setColonQuery(null);
        }
      } else {
        setColonQuery(null);
      }
    },
    [onTypingStart, onTypingStop],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (slashQuery && filteredCommands.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashIndex((i) => (i + 1) % filteredCommands.length);
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const cmd = filteredCommands[slashIndex];
          if (cmd) {
            const editor = tiptapRef.current;
            if (editor) {
              editor.commands.setContent(cmd.command + " ");
              editor.commands.focus();
            }
            setSlashQuery(null);
          }
          return true;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSlashQuery(null);
          return true;
        }
      }
      if (mentionQuery && filteredMembers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => (i + 1) % filteredMembers.length);
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length);
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const m = filteredMembers[mentionIndex];
          if (m) insertMention(m);
          return true;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionQuery(null);
          return true;
        }
      }
      if (colonQuery && colonEmojis.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setColonIndex((i) => (i + 1) % colonEmojis.length);
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setColonIndex((i) => (i - 1 + colonEmojis.length) % colonEmojis.length);
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const emoji = colonEmojis[colonIndex];
          if (emoji) {
            const editor = tiptapRef.current;
            if (editor) {
              const text = editor.getText();
              const before = text.slice(0, colonQuery.start);
              const after = text.slice(colonQuery.end);
              const newText = `${before}${emoji.c} ${after}`;
              editor.commands.setContent(newText);
              editor.commands.focus();
            }
          }
          setColonQuery(null);
          return true;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setColonQuery(null);
          return true;
        }
      }
      return false;
    },
    [
      mentionQuery,
      filteredCommands,
      filteredMembers,
      mentionIndex,
      slashQuery,
      slashIndex,
      colonQuery,
      colonEmojis,
      colonIndex,
    ],
  );

  const handleSubmit = useCallback(async () => {
    const editor = tiptapRef.current;
    const rawText = editor?.getText().trim() ?? "";
    let text = rawText;
    if (!text && files.length === 0) return;
    if (sending) return;

    if (text.startsWith("/")) {
      const firstWord = text.split(" ")[0]?.toLowerCase();
      let commandResult: string | null = null;
      if (firstWord === "/me" && text.length > 3) {
        commandResult = `_${text.slice(4).trim()}_`;
      } else if (firstWord === "/shrug") {
        commandResult = `${text.slice(7).trim()} \u00af\\_(\u30c4)_/\u00af`;
      } else if (firstWord === "/tableflip") {
        commandResult = `${text.slice(11).trim()} (\u256f\u00b0\u25a1\u00b0)\u256f\ufe35 \u253b\u2501\u253b`;
      } else if (firstWord === "/code" && text.length > 5) {
        commandResult = "```\n" + text.slice(6).trim() + "\n```";
      } else if (firstWord === "/joke") {
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs!",
          "There are 10 types of people in the world: those who understand binary and those who don't.",
          "Why was the JavaScript developer sad? Because he didn't Node how to Express himself.",
        ];
        commandResult = jokes[Math.floor(Math.random() * jokes.length)] ?? null;
      }
      if (commandResult !== null) text = commandResult;
    }

    if ((priority === "urgent" || priority === "critical") && !priorityWarningAcked.current) {
      setPendingMentionText(text);
      setShowPriorityWarning(true);
      return;
    }

    const hasEveryone = /\B@everyone\b/.test(text);
    const hasHere = /\B@here\b/.test(text);
    if ((hasEveryone || hasHere) && !showMentionWarning) {
      setPendingMentionText(text);
      setShowMentionWarning(true);
      return;
    }

    setSending(true);
    setSendError("");
    try {
      if (scheduledAt && text) {
        await api.post("/scheduled-posts", {
          channel_id: channelId,
          content: text,
          scheduled_at: new Date(scheduledAt).toISOString(),
        });
        setScheduledAt("");
        addToast({ title: "Message scheduled", variant: "success", duration: 3000 });
      } else if (text) {
        await onSend(text, priority);
      }
      if (files.length > 0 && onFileUpload) {
        for (const file of files) await onFileUpload(file);
      }
      setContent("");
      setFiles([]);
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${channelId}`);
      if (onTypingStop) onTypingStop();
      tiptapRef.current?.commands.focus();
    } catch {
      const msg = "Failed to send message. Please try again.";
      setSendError(msg);
      addToast({ title: "Error", description: msg, variant: "error" });
    } finally {
      setSending(false);
    }
  }, [
    content,
    files,
    onSend,
    onFileUpload,
    onTypingStop,
    channelId,
    sending,
    showMentionWarning,
    scheduledAt,
  ]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && onFileUpload) {
        for (const file of Array.from(e.dataTransfer.files)) onFileUpload(file);
      }
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
  }, [onFileUpload]);

  // Close schedule picker on click outside
  useEffect(() => {
    if (!showSchedulePicker) return;
    function handleClick(e: MouseEvent) {
      if (schedulePickerRef.current && !schedulePickerRef.current.contains(e.target as Node))
        setShowSchedulePicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSchedulePicker]);

  function confirmMentionSend() {
    setShowMentionWarning(false);
    const text = pendingMentionText || content;
    setPendingMentionText("");
    setSending(true);
    setSendError("");
    (async () => {
      try {
        if (text) await onSend(text, priority);
        if (files.length > 0 && onFileUpload) {
          for (const file of files) await onFileUpload(file);
        }
        setContent("");
        setFiles([]);
        localStorage.removeItem(`${DRAFT_KEY_PREFIX}${channelId}`);
        if (onTypingStop) onTypingStop();
        tiptapRef.current?.commands.focus();
      } catch {
        const msg = "Failed to send message.";
        setSendError(msg);
        addToast({ title: "Error", description: msg, variant: "error" });
      } finally {
        setSending(false);
      }
    })();
  }

  function cancelMentionSend() {
    setShowMentionWarning(false);
    setPendingMentionText("");
  }

  function confirmPrioritySend() {
    setShowPriorityWarning(false);
    priorityWarningAcked.current = true;
    handleSubmit();
  }

  function cancelPrioritySend() {
    setShowPriorityWarning(false);
    setPendingMentionText("");
    priorityWarningAcked.current = false;
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = "";
  }, []);

  const removeFile = useCallback(
    (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index)),
    [],
  );

  function insertEmoji(emoji: string) {
    const editor = tiptapRef.current;
    if (editor) {
      editor.commands.insertContent(`${emoji} `);
      editor.commands.focus();
    }
    setShowEmojiPicker(false);
  }

  return (
    <div
      ref={editorRef}
      className="post-create__container"
      className="post-create__container"
      style={{
        width: "100%",
        flex: "0 0 auto",
        borderTop: "var(--border-default)",
        background: "var(--center-channel-bg)",
      }}
    >
      <div style={{ padding: "0 15px", maxWidth: 1028, margin: "0 auto" }}>
        <div
          className="AdvancedTextEditor"
          style={{
            display: "flex",
            width: "100%",
            flexDirection: "row",
            alignItems: "end",
            padding: "8px 0",
            gap: 12,
            justifyItems: "stretch",
          }}
        >
          {/* Left toolbar */}
          <div className="flex flex-col gap-1" style={{ paddingBottom: 8 }}>
            <input
              type="file"
              id={`file-upload-${channelId}`}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <label
              htmlFor={`file-upload-${channelId}`}
              className="AdvancedTextEditor__action-button flex h-8 w-8 cursor-pointer items-center justify-center rounded"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.75)" }}
              aria-label="Attach file"
            >
              <Paperclip size={18} />
            </label>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="AdvancedTextEditor__action-button flex h-8 w-8 items-center justify-center rounded"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.75)" }}
              aria-label="Emoji picker"
            >
              <Smile size={18} />
            </button>
          </div>

          {/* Editor body - Mattermost style bordered textarea */}
          <div
            className="AdvancedTextEditor__body"
            style={{
              position: "relative",
              maxWidth: "100%",
              flex: 1,
              border: "2px solid rgba(var(--center-channel-color-rgb), 0.16)",
              borderRadius: 4,
              background: "var(--center-channel-bg)",
            }}
          >
            {showFormatting && <FormattingBar editorRef={tiptapRef} />}

            {/* File attachments */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1 px-2 pt-2">
                {files.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                    style={{
                      background: "rgba(var(--center-channel-color-rgb), 0.08)",
                      color: "rgba(var(--center-channel-color-rgb), 0.72)",
                    }}
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
                      className="ml-1 p-0.5"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
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
              <div className="px-3 py-2 text-sm" style={{ borderBottom: "var(--border-light)" }}>
                <MarkdownPreview content={content} />
              </div>
            )}

            <TipTapEditor
              ref={tiptapRef}
              content={content}
              onChange={(html, text) => {
                setContent(html);
                handleTipTapChange(text);
              }}
              onEnter={handleSubmit}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... Use @ to mention, / for commands"
            />

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full left-0 z-10 mb-1">
                <EmojiPicker
                  onSelect={(emoji) => {
                    insertEmoji(emoji);
                    setShowEmojiPicker(false);
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}

            {/* Colon autocomplete */}
            {colonQuery && colonEmojis.length > 0 && (
              <div
                className="absolute bottom-full left-0 z-10 mb-1 max-h-40 w-56 overflow-y-auto rounded-lg border"
                style={{
                  background: "var(--center-channel-bg)",
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  boxShadow: "var(--elevation-3)",
                }}
              >
                {colonEmojis.slice(0, 10).map((emoji, i) => (
                  <button
                    key={emoji.n}
                    onClick={() => {
                      const editor = tiptapRef.current;
                      if (!editor) return;
                      const text = editor.getText();
                      const before = text.slice(0, colonQuery.start);
                      const after = text.slice(colonQuery.end);
                      const newText = `${before}${emoji.c} ${after}`;
                      editor.commands.setContent(newText);
                      setContent(editor.getHTML());
                      setColonQuery(null);
                      editor.commands.focus();
                    }}
                    onMouseEnter={() => setColonIndex(i)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === colonIndex ? "bg-[rgba(var(--center-channel-color-rgb),0.08)]" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"}`}
                  >
                    <span className="text-base">{emoji.c}</span>
                    <span
                      className="text-xs"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      :{emoji.n}:
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Slash commands */}
            {slashQuery !== null && filteredCommands.length > 0 && (
              <div
                className="absolute bottom-full left-0 z-10 mb-1 max-h-40 overflow-y-auto rounded-lg border"
                style={{
                  background: "var(--center-channel-bg)",
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  boxShadow: "var(--elevation-3)",
                }}
              >
                {filteredCommands.map((cmd, i) => (
                  <button
                    key={cmd.command}
                    onClick={() => {
                      const editor = tiptapRef.current;
                      if (editor) {
                        editor.commands.setContent(cmd.command + " ");
                        editor.commands.focus();
                      }
                      setSlashQuery(null);
                    }}
                    onMouseEnter={() => setSlashIndex(i)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === slashIndex ? "bg-[rgba(var(--center-channel-color-rgb),0.08)]" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"}`}
                  >
                    <span className="font-medium" style={{ color: "var(--button-bg)" }}>
                      {cmd.command}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      {cmd.description}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Mentions */}
            {mentionQuery !== null && filteredMembers.length > 0 && (
              <div
                className="absolute bottom-full left-0 z-10 mb-1 max-h-40 overflow-y-auto rounded-lg border"
                style={{
                  background: "var(--center-channel-bg)",
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  boxShadow: "var(--elevation-3)",
                }}
              >
                {filteredMembers.map((member, i) => (
                  <button
                    key={member.user_id}
                    onClick={() => insertMention(member)}
                    onMouseEnter={() => setMentionIndex(i)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === mentionIndex ? "bg-[rgba(var(--button-bg-rgb),0.08)]" : "text-[var(--center-channel-color)] hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"}`}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(var(--button-bg-rgb), 0.16)",
                        color: "var(--button-bg)",
                      }}
                    >
                      {(member.display_name ?? member.email).charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium">
                      {member.display_name ?? member.email.split("@")[0]}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                    >
                      {member.email}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Priority picker */}
            {showPriorityPicker && (
              <div
                ref={priorityPickerRef}
                className="absolute right-8 bottom-full z-10 mb-1 rounded-lg border py-1"
                style={{
                  background: "var(--center-channel-bg)",
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  boxShadow: "var(--elevation-3)",
                }}
              >
                {PRIORITY_ORDER.map((p) => {
                  const config = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setPriority(p);
                        setShowPriorityPicker(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${priority === p ? "bg-[rgba(var(--button-bg-rgb),0.08)]" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"}`}
                    >
                      <span style={{ color: config.color }}>{config.icon}</span>
                      <span
                        style={{
                          color:
                            priority === p ? "var(--button-bg)" : "var(--center-channel-color)",
                        }}
                      >
                        {config.label}
                      </span>
                      {priority === p && (
                        <span className="ml-auto text-xs" style={{ color: "var(--button-bg)" }}>
                          {"\u2713"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Formatting/Preview buttons in bottom-right of editor */}
            <div className="absolute right-1 bottom-1 flex items-center gap-0.5">
              {priority !== "standard" && (
                <span
                  className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "rgba(var(--dnd-indicator-rgb),0.08)",
                    color: "var(--dnd-indicator)",
                  }}
                >
                  {PRIORITY_CONFIG[priority].icon}
                  {PRIORITY_CONFIG[priority].label}
                </span>
              )}
              <button
                onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                className="flex h-7 w-7 items-center justify-center rounded"
                style={{
                  color:
                    priority !== "standard"
                      ? PRIORITY_CONFIG[priority].color
                      : "rgba(var(--center-channel-color-rgb), 0.56)",
                }}
                aria-label="Set priority"
                title="Set priority"
              >
                <Flag size={14} />
              </button>
              <button
                onClick={() => setShowFormatting(!showFormatting)}
                className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${showFormatting ? "text-white" : ""}`}
                style={{
                  background: showFormatting ? "var(--button-bg)" : "transparent",
                  color: showFormatting ? "#fff" : "rgba(var(--center-channel-color-rgb), 0.56)",
                }}
                aria-label="Toggle formatting toolbar"
                title="Formatting"
              >
                <span className="text-base leading-none">T</span>
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${showPreview ? "text-white" : ""}`}
                style={{
                  background: showPreview ? "var(--button-bg)" : "transparent",
                  color: showPreview ? "#fff" : "rgba(var(--center-channel-color-rgb), 0.56)",
                }}
                aria-label={showPreview ? "Hide preview" : "Show preview"}
              >
                <Eye size={14} />
              </button>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex shrink-0 items-center gap-1" style={{ paddingBottom: 8 }}>
            {/* Schedule button */}
            <div className="relative">
              <button
                onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                className={`flex h-8 w-8 items-center justify-center rounded ${showSchedulePicker || scheduledAt ? "" : ""}`}
                style={{
                  color: scheduledAt
                    ? "var(--button-bg)"
                    : "rgba(var(--center-channel-color-rgb), 0.56)",
                  background: showSchedulePicker
                    ? "rgba(var(--button-bg-rgb), 0.12)"
                    : "transparent",
                }}
                aria-label="Schedule message"
                title="Schedule message"
              >
                <Clock size={16} />
              </button>

              {showSchedulePicker && (
                <div
                  ref={schedulePickerRef}
                  className="absolute right-0 bottom-full z-10 mb-1 w-64 rounded-lg border p-3 shadow-[var(--elevation-3)]"
                  style={{
                    background: "var(--center-channel-bg)",
                    borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  }}
                >
                  <p
                    className="mb-2 text-xs font-medium"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
                  >
                    Schedule message
                  </p>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    className="w-full rounded border px-2 py-1 text-xs"
                    style={{
                      borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                      background: "var(--center-channel-bg)",
                      color: "var(--center-channel-color)",
                    }}
                    aria-label="Schedule date and time"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    {scheduledAt && (
                      <button
                        onClick={() => {
                          setScheduledAt("");
                          setShowSchedulePicker(false);
                        }}
                        className="rounded px-2 py-1 text-xs"
                        style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowSchedulePicker(false)}
                      className="rounded px-2 py-1 text-xs font-medium"
                      style={{ background: "var(--button-bg)", color: "#fff" }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              size="md"
              onClick={handleSubmit}
              disabled={sending || (!content.trim() && files.length === 0)}
            >
              {scheduledAt ? <Clock size={18} /> : <Send size={18} />}
            </Button>
          </div>
        </div>
      </div>

      {sendError && (
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--error-text)", padding: "0 15px" }}
          role="alert"
        >
          {sendError}
        </p>
      )}

      {typingUsers && typingUsers.length > 0 && (
        <p
          className="px-4 pb-1 text-xs"
          style={{ height: 20, color: "rgba(var(--center-channel-color-rgb), 0.75)" }}
          role="status"
          aria-live="polite"
        >
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} people are typing...`}
        </p>
      )}

      {/* @everyone warning */}
      {showMentionWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="max-w-sm rounded-lg p-6"
            style={{ background: "var(--center-channel-bg)", boxShadow: "var(--elevation-5)" }}
            role="alertdialog"
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
              Notify all channel members?
            </h2>
            <p
              className="mt-2 text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              Your message contains <strong>@everyone</strong> or <strong>@here</strong>, which will
              notify all members.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={cancelMentionSend}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  color: "var(--center-channel-color)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmMentionSend}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "var(--button-bg)" }}
              >
                Send anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Urgent/Critical priority warning */}
      {showPriorityWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="max-w-sm rounded-lg p-6"
            style={{ background: "var(--center-channel-bg)", boxShadow: "var(--elevation-5)" }}
            role="alertdialog"
          >
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "rgba(var(--dnd-indicator-rgb), 0.1)" }}
            >
              <AlertTriangle size={20} style={{ color: "var(--dnd-indicator)" }} />
            </div>
            <h2
              className="text-center text-sm font-semibold"
              style={{ color: "var(--center-channel-color)" }}
            >
              Send with {priority === "urgent" ? "Urgent" : "Critical"} priority?
            </h2>
            <p
              className="mt-2 text-center text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
            >
              {priority === "critical"
                ? "This message will be marked as critical and recipients will be notified immediately."
                : "This message will be marked as urgent and recipients will see it prominently."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={cancelPrioritySend}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  color: "var(--center-channel-color)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPrioritySend}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                style={{
                  background:
                    priority === "critical" ? "var(--error-text)" : "var(--dnd-indicator)",
                }}
              >
                Send {priority === "urgent" ? "Urgent" : "Critical"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
