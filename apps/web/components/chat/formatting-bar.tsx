"use client";

import React, { useState } from "react";
import { Bold, Italic, Code, Link, Quote, List, ListOrdered, Strikethrough, Underline, Highlighter, AlignLeft, AlignCenter, AlignRight, Image, CheckSquare } from "lucide-react";
import { type Editor } from "@tiptap/react";

interface Props {
  editorRef: React.RefObject<Editor | null>;
}

type FormatMode = "bold" | "italic" | "strike" | "underline" | "highlight" | "code" | "link" | "quote" | "ul" | "ol" | "taskList" | "alignLeft" | "alignCenter" | "alignRight" | "image";

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

const FORMAT_BUTTONS: { mode: FormatMode; icon: React.ReactNode; label: string }[] = [
  { mode: "bold", icon: <Bold size={14} />, label: "Bold" },
  { mode: "italic", icon: <Italic size={14} />, label: "Italic" },
  { mode: "underline", icon: <Underline size={14} />, label: "Underline" },
  { mode: "strike", icon: <Strikethrough size={14} />, label: "Strikethrough" },
  { mode: "code", icon: <Code size={14} />, label: "Code" },
  { mode: "highlight", icon: <Highlighter size={14} />, label: "Highlight" },
  { mode: "link", icon: <Link size={14} />, label: "Link" },
  { mode: "quote", icon: <Quote size={14} />, label: "Quote" },
  { mode: "ul", icon: <List size={14} />, label: "Bullet list" },
  { mode: "ol", icon: <ListOrdered size={14} />, label: "Numbered list" },
  { mode: "taskList", icon: <CheckSquare size={14} />, label: "Task list" },
  { mode: "image", icon: <Image size={14} />, label: "Image" },
  { mode: "alignLeft", icon: <AlignLeft size={14} />, label: "Align left" },
  { mode: "alignCenter", icon: <AlignCenter size={14} />, label: "Align center" },
  { mode: "alignRight", icon: <AlignRight size={14} />, label: "Align right" },
];

export function FormattingBar({ editorRef }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="mb-1 flex flex-wrap gap-0.5">
      {FORMAT_BUTTONS.map(({ mode, icon, label }, index) => (
        <button
          key={mode}
          onClick={() => {
            if (editorRef.current) {
              applyFormat(editorRef.current, mode);
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
