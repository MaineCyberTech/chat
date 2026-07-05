"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { Button, useToast } from "@chat/ui";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Paperclip, Smile, Eye, Send, Image, File, X, Flag, AlertTriangle, AlertCircle } from "lucide-react";
import { FormattingBar } from "./formatting-bar";
import { CodeBlock } from "./code-block";
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

const QUICK_EMOJIS = ["\u{1f44d}", "\u2764\ufe0f", "\u{1f604}", "\u{1f389}", "\u{1f525}", "\u{1f440}"];

const EMOJI_LIST = [
  "\u{1f600}", "\u{1f603}", "\u{1f604}", "\u{1f60a}", "\u{1f609}", "\u{1f60d}", "\u{1f618}",
  "\u{1f61a}", "\u{1f61c}", "\u{1f61e}", "\u{1f620}", "\u{1f621}", "\u{1f622}", "\u{1f623}",
  "\u{1f624}", "\u{1f625}", "\u{1f628}", "\u{1f629}", "\u{1f62a}", "\u{1f62b}", "\u{1f62d}",
  "\u{1f630}", "\u{1f631}", "\u{1f632}", "\u{1f633}", "\u{1f635}", "\u{1f637}", "\u{1f638}",
  "\u{1f639}", "\u{1f63a}", "\u{1f63b}", "\u{1f63c}", "\u{1f63d}", "\u{1f63e}", "\u{1f63f}",
  "\u{1f640}", "\u{1f645}", "\u{1f646}", "\u{1f647}", "\u{1f648}", "\u{1f649}", "\u{1f64a}",
  "\u{1f64b}", "\u{1f64c}", "\u{1f64d}", "\u{1f64e}", "\u{1f64f}",
  "\u{1f44d}", "\u{1f44e}", "\u{1f44f}", "\u{1f450}", "\u{1f4aa}", "\u{1f4af}", "\u{1f4b0}",
  "\u{1f4bc}", "\u{1f4c4}", "\u{1f4c5}", "\u{1f4ca}", "\u{1f4ce}", "\u{1f4cf}", "\u{1f4d6}",
  "\u{1f4da}", "\u{1f4e2}", "\u{1f4e3}", "\u{1f4e6}", "\u{1f4e7}", "\u{1f4e8}", "\u{1f4e9}",
  "\u{1f4f1}", "\u{1f4f7}", "\u{1f4f8}", "\u{1f4fa}", "\u{1f4fb}", "\u{1f4fc}",
  "\u{1f525}", "\u{1f4a1}", "\u{1f4a2}", "\u{1f4a3}", "\u{1f4a4}", "\u{1f4a5}", "\u{1f4a6}",
  "\u{1f4a7}", "\u{1f4a8}", "\u{1f4a9}", "\u{1f4aa}", "\u{1f4ab}",
  "\u{2b50}", "\u{1f31f}", "\u{2600}\ufe0f", "\u{1f319}", "\u{1f31b}", "\u{1f31c}",
  "\u{1f308}", "\u{1f304}", "\u{1f305}", "\u{1f303}", "\u{2601}\ufe0f",
  "\u{1f389}", "\u{1f388}", "\u{1f38a}", "\u{1f381}",
  "\u{2764}\ufe0f", "\u{1f49b}", "\u{1f49a}", "\u{1f499}", "\u{1f49c}", "\u{1f5a4}",
  "\u{1f494}", "\u{1f497}", "\u{1f493}", "\u{1f498}", "\u{1f49d}", "\u{1f496}",
  "\u{1f48b}", "\u{1f48c}", "\u{1f48d}", "\u{1f48e}", "\u{1f48f}",
  "\u{2705}", "\u{274c}", "\u{2753}", "\u{2757}", "\u{26a0}\ufe0f", "\u{1f6ab}", "\u{267b}\ufe0f",
  "\u{1f4af}", "\u{1f51d}", "\u{1f51c}", "\u{1f51b}", "\u{1f519}",
  "\u{1f4e2}", "\u{1f514}", "\u{1f515}",
  "\u{1f3a4}", "\u{1f3ac}",
  "\u{1f4f7}", "\u{1f4f8}",
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
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--link-color)" }}>{children}</a>,
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className ?? "");
          const code = String(children).replace(/\n$/, "");
          if (match) return <CodeBlock code={code} language={match[1]} />;
          return <code className="rounded px-1 py-0.5 font-mono text-sm" style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)" }}>{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function MessageInput({
  channelId, workspaceId, onSend, onFileUpload, onTypingStart, onTypingStop, typingUsers,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
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
  const [emojiSearch, setEmojiSearch] = useState("");
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [priority, setPriority] = useState<PostPriority>("standard");
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showPriorityWarning, setShowPriorityWarning] = useState(false);
  const priorityWarningAcked = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const PRIORITY_CONFIG: Record<PostPriority, { label: string; icon: React.ReactNode; color: string }> = {
    standard: { label: "Standard", icon: <Flag size={14} />, color: "rgba(var(--center-channel-color-rgb), 0.56)" },
    important: { label: "Important", icon: <AlertCircle size={14} />, color: "var(--online-indicator)" },
    urgent: { label: "Urgent", icon: <AlertTriangle size={14} />, color: "var(--dnd-indicator)" },
    critical: { label: "Critical", icon: <AlertTriangle size={14} />, color: "var(--error-text)" },
  };

  const PRIORITY_ORDER: PostPriority[] = ["standard", "important", "urgent", "critical"];

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    }
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setShowEmojiPicker(false); }
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
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(e.target as Node)) setShowPriorityPicker(false);
    }
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setShowPriorityPicker(false); }
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
    if (draft) { setContent(draft); textareaRef.current?.focus(); }
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
    api.get<{ members: Member[] }>(`/v1/workspaces/${workspaceId}/members`)
      .then((res) => setMembers(res.members))
      .catch(() => console.warn("Failed to fetch workspace members for mentions"));
  }, [workspaceId]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || !onFileUpload) return;
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItems = Array.from(items).filter((item) => item.kind === "file" && item.type.startsWith("image/"));
      if (imageItems.length === 0) return;
      e.preventDefault();
      for (const item of imageItems) { const file = item.getAsFile(); if (file && onFileUpload) onFileUpload(file); }
    }
    el.addEventListener("paste", handlePaste);
    return () => el.removeEventListener("paste", handlePaste);
  }, [onFileUpload]);

  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => m.display_name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [mentionQuery, members]);

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return [];
    const q = slashQuery.toLowerCase();
    return SLASH_COMMANDS.filter((cmd) => cmd.command.toLowerCase().includes(q));
  }, [slashQuery]);

  function getMentionAtCursor(value: string, cursorPos: number): { query: string; start: number } | null {
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
    requestAnimationFrame(() => { const pos = mention.start + name.length + 2; textarea.setSelectionRange(pos, pos); textarea.focus(); });
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(value);

    if (value.trim() && onTypingStart) {
      const now = Date.now();
      if (now - lastTypingEmitRef.current > TYPING_THROTTLE_MS) { lastTypingEmitRef.current = now; onTypingStart(); }
    } else if (!value.trim() && onTypingStop) { onTypingStop(); }

    const beforeCursor = value.slice(0, cursorPos);
    const lastNewline = beforeCursor.lastIndexOf("\n");
    const currentLine = beforeCursor.slice(lastNewline + 1);
    if (currentLine.startsWith("/") && !currentLine.includes(" ")) { setSlashQuery(currentLine); setSlashIndex(0); }
    else { setSlashQuery(null); }

    const mention = getMentionAtCursor(value, cursorPos);
    if (mention) { setMentionQuery(mention.query); setMentionIndex(0); }
    else { setMentionQuery(null); }

    if (textareaRef.current) { textareaRef.current.style.height = "auto"; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; }
  }, [onTypingStart, onTypingStop]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashQuery && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex((i) => (i + 1) % filteredCommands.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); const cmd = filteredCommands[slashIndex]; if (cmd) { setContent(cmd.command + " "); setSlashQuery(null); textareaRef.current?.focus(); } return; }
      if (e.key === "Escape") { e.preventDefault(); setSlashQuery(null); return; }
    }
    if (mentionQuery && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => (i + 1) % filteredMembers.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); const m = filteredMembers[mentionIndex]; if (m) insertMention(m); return; }
      if (e.key === "Escape") { e.preventDefault(); setMentionQuery(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }, [mentionQuery, filteredCommands, filteredMembers, mentionIndex, slashQuery, slashIndex]);

  const handleSubmit = useCallback(async () => {
    let text = content.trim();
    if (!text && files.length === 0) return;
    if (sending) return;

    if (text.startsWith("/")) {
      const firstWord = text.split(" ")[0]?.toLowerCase();
      let commandResult: string | null = null;
      if (firstWord === "/me" && text.length > 3) { commandResult = `_${text.slice(4).trim()}_`; }
      else if (firstWord === "/shrug") { commandResult = `${text.slice(7).trim()} \u00af\\_(\u30c4)_/\u00af`; }
      else if (firstWord === "/tableflip") { commandResult = `${text.slice(11).trim()} (\u256f\u00b0\u25a1\u00b0)\u256f\ufe35 \u253b\u2501\u253b`; }
      else if (firstWord === "/code" && text.length > 5) { commandResult = "```\n" + text.slice(6).trim() + "\n```"; }
      else if (firstWord === "/joke") {
        const jokes = ["Why do programmers prefer dark mode? Because light attracts bugs!", "There are 10 types of people in the world: those who understand binary and those who don't.", "Why was the JavaScript developer sad? Because he didn't Node how to Express himself."];
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
    if ((hasEveryone || hasHere) && !showMentionWarning) { setPendingMentionText(text); setShowMentionWarning(true); return; }

    setSending(true); setSendError("");
    try {
      if (text) await onSend(text, priority);
      if (files.length > 0 && onFileUpload) { for (const file of files) await onFileUpload(file); }
      setContent(""); setFiles([]);
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${channelId}`);
      if (onTypingStop) onTypingStop();
      textareaRef.current?.focus();
    } catch {
      const msg = "Failed to send message. Please try again.";
      setSendError(msg); addToast({ title: "Error", description: msg, variant: "error" });
    } finally { setSending(false); }
  }, [content, files, onSend, onFileUpload, onTypingStop, channelId, sending, showMentionWarning]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && onFileUpload) { for (const file of Array.from(e.dataTransfer.files)) onFileUpload(file); }
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
  }, [onFileUpload]);

  function confirmMentionSend() {
    setShowMentionWarning(false);
    const text = pendingMentionText || content;
    setPendingMentionText("");
    setSending(true); setSendError("");
    (async () => {
      try {
        if (text) await onSend(text, priority);
        if (files.length > 0 && onFileUpload) { for (const file of files) await onFileUpload(file); }
        setContent(""); setFiles([]);
        localStorage.removeItem(`${DRAFT_KEY_PREFIX}${channelId}`);
        if (onTypingStop) onTypingStop();
        textareaRef.current?.focus();
      } catch { const msg = "Failed to send message."; setSendError(msg); addToast({ title: "Error", description: msg, variant: "error" }); }
      finally { setSending(false); }
    })();
  }

  function cancelMentionSend() { setShowMentionWarning(false); setPendingMentionText(""); }

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

  const removeFile = useCallback((index: number) => setFiles((prev) => prev.filter((_, i) => i !== index)), []);

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(textarea.selectionEnd);
    const newContent = `${before}${emoji} ${after}`;
    setContent(newContent); setShowEmojiPicker(false);
    const pos = start + emoji.length + 1;
    requestAnimationFrame(() => { textarea.setSelectionRange(pos, pos); textarea.focus(); });
  }

  return (
    <div
      ref={editorRef}
      className="post-create__container"
      style={{ width: "100%", flex: "0 0 auto", borderTop: "var(--border-default)", background: "var(--center-channel-bg)" }}
    >
      <div style={{ padding: "0 15px", maxWidth: 1028, margin: "0 auto" }}>
        <div className="AdvancedTextEditor" style={{ display: "flex", width: "100%", flexDirection: "row", alignItems: "end", padding: "8px 0", gap: 12, justifyItems: "stretch" }}>
          {/* Left toolbar */}
          <div className="flex flex-col gap-1" style={{ paddingBottom: 8 }}>
            <input type="file" id={`file-upload-${channelId}`} onChange={handleFileSelect} multiple className="hidden" />
            <label htmlFor={`file-upload-${channelId}`} className="AdvancedTextEditor__action-button flex h-8 w-8 cursor-pointer items-center justify-center rounded" style={{ color: "rgba(var(--center-channel-color-rgb), 0.75)" }} aria-label="Attach file">
              <Paperclip size={18} />
            </label>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="AdvancedTextEditor__action-button flex h-8 w-8 items-center justify-center rounded" style={{ color: "rgba(var(--center-channel-color-rgb), 0.75)" }} aria-label="Emoji picker">
              <Smile size={18} />
            </button>
          </div>

          {/* Editor body - Mattermost style bordered textarea */}
          <div className="AdvancedTextEditor__body" style={{ position: "relative", maxWidth: "100%", flex: 1, border: "2px solid rgba(var(--center-channel-color-rgb), 0.16)", borderRadius: 4, background: "var(--center-channel-bg)" }}>
            {showFormatting && (
              <FormattingBar textareaRef={textareaRef} content={content} setContent={setContent} />
            )}

            {/* File attachments */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1 px-2 pt-2">
                {files.map((file, index) => (
                  <span key={`${file.name}-${index}`} className="flex items-center gap-1 rounded px-2 py-0.5 text-xs" style={{ background: "rgba(var(--center-channel-color-rgb), 0.08)", color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                    {file.type.startsWith("image/") ? <Image size={14} className="inline" /> : <File size={14} className="inline" />}
                    {file.name}
                    <button type="button" onClick={() => removeFile(index)} className="ml-1 p-0.5" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }} aria-label={`Remove ${file.name}`}><X size={12} /></button>
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

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... Use @ to mention, / for commands"
              rows={1}
              className="custom-textarea"
              style={{
                overflow: "hidden",
                width: "100%",
                minHeight: 46,
                maxHeight: 120,
                border: "none",
                borderRadius: 4,
                background: "transparent",
                color: "var(--center-channel-color)",
                lineHeight: "20px",
                resize: "none",
                whiteSpace: "break-spaces",
                wordWrap: "break-word",
                padding: "12px",
                outline: "none",
                fontFamily: "inherit",
                fontSize: 14,
              }}
              aria-label="Message"
            />

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full left-0 z-10 mb-1 w-72 max-w-[calc(100vw-1rem)] rounded-lg border p-2" style={{ background: "var(--center-channel-bg)", borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", boxShadow: "var(--elevation-3)" }}>
                <input value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} placeholder="Search emojis..." className="mb-2 w-full rounded-md px-2 py-1 text-xs" style={{ border: "solid 1px rgba(var(--center-channel-color-rgb), 0.16)", background: "var(--center-channel-bg)", color: "var(--center-channel-color)" }} aria-label="Search emojis" autoFocus />
                <p className="mb-1 text-xs font-medium" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>Quick emojis</p>
                <div className="mb-2 flex flex-wrap gap-1">
                  {QUICK_EMOJIS.map((e) => (
                    <button key={e} onClick={() => insertEmoji(e)} className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]" aria-label={e}>{e}</button>
                  ))}
                </div>
                <p className="mb-1 text-xs font-medium" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                  {emojiSearch ? "Search results" : "All emojis"}
                </p>
                <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                  {filterEmojis(emojiSearch).map((e) => (
                    <button key={e} onClick={() => insertEmoji(e)} className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]" aria-label={e}>{e}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Slash commands */}
            {slashQuery !== null && filteredCommands.length > 0 && (
              <div className="absolute bottom-full left-0 z-10 mb-1 max-h-40 overflow-y-auto rounded-lg border" style={{ background: "var(--center-channel-bg)", borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", boxShadow: "var(--elevation-3)" }}>
                {filteredCommands.map((cmd, i) => (
                  <button key={cmd.command} onClick={() => { setContent(cmd.command + " "); setSlashQuery(null); textareaRef.current?.focus(); }} onMouseEnter={() => setSlashIndex(i)} className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === slashIndex ? "bg-[rgba(var(--center-channel-color-rgb),0.08)]" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"}`}>
                    <span className="font-medium" style={{ color: "var(--button-bg)" }}>{cmd.command}</span>
                    <span className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{cmd.description}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Mentions */}
            {mentionQuery !== null && filteredMembers.length > 0 && (
              <div className="absolute bottom-full left-0 z-10 mb-1 max-h-40 overflow-y-auto rounded-lg border" style={{ background: "var(--center-channel-bg)", borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", boxShadow: "var(--elevation-3)" }}>
                {filteredMembers.map((member, i) => (
                  <button key={member.user_id} onClick={() => insertMention(member)} onMouseEnter={() => setMentionIndex(i)} className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${i === mentionIndex ? "bg-[rgba(var(--button-bg-rgb),0.08)]" : "text-[var(--center-channel-color)] hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"}`}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium" style={{ background: "rgba(var(--button-bg-rgb), 0.16)", color: "var(--button-bg)" }}>
                      {(member.display_name ?? member.email).charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium">{member.display_name ?? member.email.split("@")[0]}</span>
                    <span className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>{member.email}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Priority picker */}
            {showPriorityPicker && (
              <div ref={priorityPickerRef} className="absolute bottom-full right-8 z-10 mb-1 rounded-lg border py-1" style={{ background: "var(--center-channel-bg)", borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", boxShadow: "var(--elevation-3)" }}>
                {PRIORITY_ORDER.map((p) => {
                  const config = PRIORITY_CONFIG[p];
                  return (
                    <button key={p} onClick={() => { setPriority(p); setShowPriorityPicker(false); }} className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${priority === p ? "bg-[rgba(var(--button-bg-rgb),0.08)]" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"}`}>
                      <span style={{ color: config.color }}>{config.icon}</span>
                      <span style={{ color: priority === p ? "var(--button-bg)" : "var(--center-channel-color)" }}>{config.label}</span>
                      {priority === p && <span className="ml-auto text-xs" style={{ color: "var(--button-bg)" }}>{"\u2713"}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Formatting/Preview buttons in bottom-right of editor */}
            <div className="absolute right-1 bottom-1 flex items-center gap-0.5">
              {priority !== "standard" && (
                <span className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium" style={{ background: "rgba(var(--dnd-indicator-rgb),0.08)", color: "var(--dnd-indicator)" }}>
                  {PRIORITY_CONFIG[priority].icon}
                  {PRIORITY_CONFIG[priority].label}
                </span>
              )}
              <button onClick={() => setShowPriorityPicker(!showPriorityPicker)} className="flex h-7 w-7 items-center justify-center rounded" style={{ color: priority !== "standard" ? PRIORITY_CONFIG[priority].color : "rgba(var(--center-channel-color-rgb), 0.56)" }} aria-label="Set priority" title="Set priority">
                <Flag size={14} />
              </button>
              <button onClick={() => setShowFormatting(!showFormatting)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${showFormatting ? "text-white" : ""}`} style={{ background: showFormatting ? "var(--button-bg)" : "transparent", color: showFormatting ? "#fff" : "rgba(var(--center-channel-color-rgb), 0.56)" }} aria-label="Toggle formatting toolbar" title="Formatting">
                <span className="text-base leading-none">T</span>
              </button>
              <button onClick={() => setShowPreview(!showPreview)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${showPreview ? "text-white" : ""}`} style={{ background: showPreview ? "var(--button-bg)" : "transparent", color: showPreview ? "#fff" : "rgba(var(--center-channel-color-rgb), 0.56)" }} aria-label={showPreview ? "Hide preview" : "Show preview"}>
                <Eye size={14} />
              </button>
            </div>
          </div>

          {/* Send button */}
          <div className="flex shrink-0" style={{ paddingBottom: 8 }}>
            <Button size="md" onClick={handleSubmit} disabled={sending || (!content.trim() && files.length === 0)}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>

      {sendError && <p className="mt-1 text-xs" style={{ color: "var(--error-text)", padding: "0 15px" }} role="alert">{sendError}</p>}

      {typingUsers && typingUsers.length > 0 && (
        <p className="text-xs px-4 pb-1" style={{ height: 20, color: "rgba(var(--center-channel-color-rgb), 0.75)" }} role="status" aria-live="polite">
          {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
        </p>
      )}

      {/* @everyone warning */}
      {showMentionWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="max-w-sm rounded-lg p-6" style={{ background: "var(--center-channel-bg)", boxShadow: "var(--elevation-5)" }} role="alertdialog">
            <h2 className="text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>Notify all channel members?</h2>
            <p className="mt-2 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
              Your message contains <strong>@everyone</strong> or <strong>@here</strong>, which will notify all members.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={cancelMentionSend} className="rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", color: "var(--center-channel-color)" }}>Cancel</button>
              <button onClick={confirmMentionSend} className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ background: "var(--button-bg)" }}>Send anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Urgent/Critical priority warning */}
      {showPriorityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="max-w-sm rounded-lg p-6" style={{ background: "var(--center-channel-bg)", boxShadow: "var(--elevation-5)" }} role="alertdialog">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full mb-3" style={{ background: "rgba(var(--dnd-indicator-rgb), 0.1)" }}>
              <AlertTriangle size={20} style={{ color: "var(--dnd-indicator)" }} />
            </div>
            <h2 className="text-sm font-semibold text-center" style={{ color: "var(--center-channel-color)" }}>
              Send with {priority === "urgent" ? "Urgent" : "Critical"} priority?
            </h2>
            <p className="mt-2 text-xs text-center" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
              {priority === "critical"
                ? "This message will be marked as critical and recipients will be notified immediately."
                : "This message will be marked as urgent and recipients will see it prominently."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={cancelPrioritySend} className="rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)", color: "var(--center-channel-color)" }}>Cancel</button>
              <button onClick={confirmPrioritySend} className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ background: priority === "critical" ? "var(--error-text)" : "var(--dnd-indicator)" }}>Send {priority === "urgent" ? "Urgent" : "Critical"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
