"use client";

import React, { useState } from "react";
import { Bold, Italic, Code, Link, Quote, List, ListOrdered, Strikethrough } from "lucide-react";

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (content: string) => void;
}

type FormatMode = "bold" | "italic" | "strike" | "code" | "link" | "quote" | "ul" | "ol";

function applyFormat(
  textarea: HTMLTextAreaElement,
  content: string,
  setContent: (c: string) => void,
  mode: FormatMode,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = content.slice(start, end);
  const before = content.slice(0, start);
  const after = content.slice(end);

  let replacement: string;
  let cursorOffset: number;

  switch (mode) {
    case "bold":
      replacement = `**${selected || "bold"}**`;
      cursorOffset = selected ? 0 : -4;
      break;
    case "italic":
      replacement = `*${selected || "italic"}*`;
      cursorOffset = selected ? 0 : -2;
      break;
    case "strike":
      replacement = `~~${selected || "strikethrough"}~~`;
      cursorOffset = selected ? 0 : -4;
      break;
    case "code":
      if (selected.includes("\n")) {
        replacement = "```\n" + (selected || "code") + "\n```";
        cursorOffset = selected ? 0 : -6;
      } else {
        replacement = "`" + (selected || "code") + "`";
        cursorOffset = selected ? 0 : -2;
      }
      break;
    case "link":
      replacement = selected ? `[${selected}](url)` : "[link](url)";
      cursorOffset = selected ? -5 : -6;
      break;
    case "quote":
      replacement = "> " + (selected || "quote").replace(/\n/g, "\n> ");
      cursorOffset = 0;
      break;
    case "ul":
      replacement = "- " + (selected || "item").replace(/\n/g, "\n- ");
      cursorOffset = 0;
      break;
    case "ol":
      replacement = "1. " + (selected || "item").replace(/\n/g, "\n2. ");
      cursorOffset = 0;
      break;
  }

  const newContent = before + replacement + after;
  setContent(newContent);

  requestAnimationFrame(() => {
    const newPos = start + replacement.length + cursorOffset;
    textarea.setSelectionRange(newPos, newPos);
    textarea.focus();
  });
}

const FORMAT_BUTTONS: { mode: FormatMode; icon: React.ReactNode; label: string }[] = [
  { mode: "bold", icon: <Bold size={14} />, label: "Bold" },
  { mode: "italic", icon: <Italic size={14} />, label: "Italic" },
  { mode: "strike", icon: <Strikethrough size={14} />, label: "Strikethrough" },
  { mode: "code", icon: <Code size={14} />, label: "Code" },
  { mode: "link", icon: <Link size={14} />, label: "Link" },
  { mode: "quote", icon: <Quote size={14} />, label: "Quote" },
  { mode: "ul", icon: <List size={14} />, label: "Bullet list" },
  { mode: "ol", icon: <ListOrdered size={14} />, label: "Numbered list" },
];

export function FormattingBar({ textareaRef, content, setContent }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="mb-1 flex flex-wrap gap-0.5">
      {FORMAT_BUTTONS.map(({ mode, icon, label }, index) => (
        <button
          key={mode}
          onClick={() => {
            if (textareaRef.current) {
              applyFormat(textareaRef.current, content, setContent, mode);
            }
          }}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors"
          style={{
            color:
              hoveredIndex === index
                ? "var(--center-channel-color)"
                : "rgba(var(--center-channel-color-rgb), 0.56)",
            backgroundColor:
              hoveredIndex === index ? "rgba(var(--center-channel-color-rgb), 0.08)" : undefined,
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          aria-label={label}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
