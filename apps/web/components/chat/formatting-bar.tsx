"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { t } from "@/lib/i18n";
import {
  Bold,
  Italic,
  Code,
  Link,
  Quote,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  CheckSquare,
} from "lucide-react";
import { type Editor } from "@tiptap/react";

interface Props {
  editorRef: React.RefObject<Editor | null>;
}

type FormatMode =
  | "bold"
  | "italic"
  | "strike"
  | "underline"
  | "highlight"
  | "code"
  | "link"
  | "quote"
  | "ul"
  | "ol"
  | "taskList"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "image";

function applyFormat(editor: Editor, mode: FormatMode) {
  switch (mode) {
    case "bold":
      editor.chain().focus().toggleBold().run();
      break;
    case "italic":
      editor.chain().focus().toggleItalic().run();
      break;
    case "strike":
      editor.chain().focus().toggleStrike().run();
      break;
    case "underline":
      editor.chain().focus().toggleUnderline().run();
      break;
    case "highlight":
      editor.chain().focus().toggleHighlight().run();
      break;
    case "code": {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().toggleCode().run();
      } else {
        editor.chain().focus().toggleCodeBlock().run();
      }
      break;
    }
    case "link": {
      const url = window.prompt("Enter URL:");
      if (url) editor.chain().focus().setLink({ href: url }).run();
      break;
    }
    case "quote":
      editor.chain().focus().toggleBlockquote().run();
      break;
    case "ul":
      editor.chain().focus().toggleBulletList().run();
      break;
    case "ol":
      editor.chain().focus().toggleOrderedList().run();
      break;
    case "taskList":
      editor.chain().focus().toggleTaskList().run();
      break;
    case "alignLeft":
      editor.chain().focus().setTextAlign("left").run();
      break;
    case "alignCenter":
      editor.chain().focus().setTextAlign("center").run();
      break;
    case "alignRight":
      editor.chain().focus().setTextAlign("right").run();
      break;
    case "image": {
      const url = window.prompt("Enter image URL:");
      if (url) editor.chain().focus().setImage({ src: url }).run();
      break;
    }
  }
}

const FORMAT_BUTTONS: { mode: FormatMode; icon: React.ReactNode; i18nKey: string }[] = [
  { mode: "bold", icon: <Bold size={14} />, i18nKey: "formatting.bold" },
  { mode: "italic", icon: <Italic size={14} />, i18nKey: "formatting.italic" },
  { mode: "underline", icon: <Underline size={14} />, i18nKey: "formatting.underline" },
  { mode: "strike", icon: <Strikethrough size={14} />, i18nKey: "formatting.strikethrough" },
  { mode: "code", icon: <Code size={14} />, i18nKey: "formatting.code" },
  { mode: "highlight", icon: <Highlighter size={14} />, i18nKey: "formatting.highlight" },
  { mode: "link", icon: <Link size={14} />, i18nKey: "formatting.link" },
  { mode: "quote", icon: <Quote size={14} />, i18nKey: "formatting.blockquote" },
  { mode: "ul", icon: <List size={14} />, i18nKey: "formatting.bulletList" },
  { mode: "ol", icon: <ListOrdered size={14} />, i18nKey: "formatting.orderedList" },
  { mode: "taskList", icon: <CheckSquare size={14} />, i18nKey: "formatting.taskList" },
  { mode: "image", icon: <Image size={14} />, i18nKey: "formatting.image" },
  { mode: "alignLeft", icon: <AlignLeft size={14} />, i18nKey: "formatting.alignLeft" },
  { mode: "alignCenter", icon: <AlignCenter size={14} />, i18nKey: "formatting.alignCenter" },
  { mode: "alignRight", icon: <AlignRight size={14} />, i18nKey: "formatting.alignRight" },
];

function isActive(editor: Editor | null, mode: FormatMode): boolean {
  if (!editor) return false;
  switch (mode) {
    case "bold":
      return editor.isActive("bold");
    case "italic":
      return editor.isActive("italic");
    case "strike":
      return editor.isActive("strike");
    case "underline":
      return editor.isActive("underline");
    case "highlight":
      return editor.isActive("highlight");
    case "code":
      return editor.isActive("code") || editor.isActive("codeBlock");
    case "link":
      return editor.isActive("link");
    case "quote":
      return editor.isActive("blockquote");
    case "ul":
      return editor.isActive("bulletList");
    case "ol":
      return editor.isActive("orderedList");
    case "taskList":
      return editor.isActive("taskList");
    case "alignLeft":
      return editor.isActive({ textAlign: "left" });
    case "alignCenter":
      return editor.isActive({ textAlign: "center" });
    case "alignRight":
      return editor.isActive({ textAlign: "right" });
    default:
      return false;
  }
}

function isValidUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

export function FormattingBar({ editorRef }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState<{ mode: "link" | "image"; value: string } | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (urlInput) requestAnimationFrame(() => urlInputRef.current?.focus());
  }, [urlInput]);

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput || !editorRef.current) return;
    const val = urlInput.value.trim();
    if (!val || !isValidUrl(val)) return;
    if (urlInput.mode === "link") {
      editorRef.current.chain().focus().setLink({ href: val }).run();
    } else {
      editorRef.current.chain().focus().setImage({ src: val }).run();
    }
    setUrlInput(null);
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = toolbarRef.current?.querySelectorAll<HTMLButtonElement>(
      "button:not([type=submit]):not([type=button])",
    );
    if (!buttons || buttons.length === 0) return;
    const currentIndex = Array.from(buttons).findIndex((btn) => btn === document.activeElement);
    if (currentIndex === -1) return;
    e.preventDefault();
    const nextIndex =
      e.key === "ArrowRight"
        ? (currentIndex + 1) % buttons.length
        : (currentIndex - 1 + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  }, []);

  return (
    <div
      ref={toolbarRef}
      className="mb-1 flex flex-wrap gap-0.5"
      role="toolbar"
      aria-orientation="horizontal"
      aria-label="Text formatting"
      onKeyDown={handleKeyDown}
    >
      {urlInput && (
        <form
          onSubmit={handleUrlSubmit}
          className="flex items-center gap-1 rounded-md px-2 py-1"
          style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
        >
          <span
            className="text-xs font-medium"
            style={{ color: "rgba(var(--center-channel-color-rgb), var(--text-secondary-alpha))" }}
          >
            {urlInput.mode === "link" ? t("formatting.urlLabel") : t("formatting.imageUrlLabel")}
          </span>
          <input
            ref={urlInputRef}
            type="text"
            value={urlInput.value}
            onChange={(e) => setUrlInput({ ...urlInput, value: e.target.value })}
            placeholder="https://..."
            className="flex-1 rounded bg-transparent px-1 text-xs outline-none"
            style={{ color: "var(--center-channel-color)", minWidth: 120 }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setUrlInput(null);
            }}
          />
          <button
            type="submit"
            className="rounded px-1 py-0.5 text-xs font-medium"
            style={{ color: "var(--button-bg)" }}
          >
            {t("formatting.add")}
          </button>
          <button
            type="button"
            onClick={() => setUrlInput(null)}
            className="rounded px-1 py-0.5 text-xs"
            style={{ color: "rgba(var(--center-channel-color-rgb), var(--text-secondary-alpha))" }}
          >
            ✕
          </button>
        </form>
      )}
      {FORMAT_BUTTONS.map(({ mode, icon, i18nKey }, index) => {
        const active = isActive(editorRef.current, mode);
        const label = t(i18nKey);
        return (
          <button
            key={mode}
            onClick={() => {
              if (!editorRef.current) return;
              if (mode === "link" || mode === "image") {
                setUrlInput({ mode, value: "" });
              } else {
                applyFormat(editorRef.current, mode);
              }
            }}
            className="flex h-11 w-11 items-center justify-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-[var(--button-bg)] md:h-7 md:w-7"
            style={{
              color:
                hoveredIndex === index
                  ? "var(--center-channel-color)"
                  : "rgba(var(--center-channel-color-rgb), var(--text-secondary-alpha))",
              backgroundColor:
                hoveredIndex === index
                  ? "rgba(var(--center-channel-color-rgb), 0.08)"
                  : active
                    ? "rgba(var(--button-bg-rgb), 0.12)"
                    : undefined,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label={label}
            aria-pressed={mode === "link" || mode === "image" ? undefined : active}
            aria-haspopup={mode === "link" || mode === "image" ? "dialog" : undefined}
            title={label}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
