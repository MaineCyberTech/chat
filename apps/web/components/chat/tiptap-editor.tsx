"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import ImageExtension from "@tiptap/extension-image";

interface Props {
  content: string;
  onChange: (html: string, text: string) => void;
  onEnter: () => void;
  onKeyDown?: (event: KeyboardEvent) => boolean;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

export const TipTapEditor = React.forwardRef<Editor, Props>(
  (
    {
      content,
      onChange,
      onEnter,
      onKeyDown,
      placeholder = "Type a message...",
      minHeight = 46,
      maxHeight = 120,
    },
    ref,
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: false,
          link: false,
          underline: false,
        }),
        Underline,
        Highlight.configure({ multicolor: true }),
        LinkExtension.configure({
          openOnClick: false,
          HTMLAttributes: { class: "tiptap-link" },
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder }),
        ImageExtension.configure({ inline: false }),
      ],
      editorProps: {
        attributes: {
          class: "custom-textarea",
          style: `overflow-y:auto;width:100%;min-height:${minHeight}px;max-height:${maxHeight}px;border:none;border-radius:4px;background:transparent;color:var(--center-channel-color);line-height:20px;resize:none;padding:12px;outline:none;font-family:inherit;font-size:14px;`,
        },
        handleKeyDown: (view, event) => {
          if (onKeyDown) {
            if (onKeyDown(event)) return true;
          }
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onEnter();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML(), ed.getText());
      },
      content,
    });

    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(editor);
        } else if (ref && "current" in ref) {
          (ref as React.MutableRefObject<Editor | null>).current = editor;
        }
      }
    }, [editor, ref]);

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }, [content, editor]);

    useEffect(() => {
      return () => {
        if (ref) {
          if (typeof ref === "function") {
            ref(null);
          } else if (ref && "current" in ref) {
            (ref as React.MutableRefObject<Editor | null>).current = null;
          }
        }
        editor?.destroy();
      };
    }, [editor, ref]);

    return <EditorContent editor={editor} />;
  },
);

TipTapEditor.displayName = "TipTapEditor";

export function getEditorText(editor: Editor | null): string {
  return editor?.getText() ?? "";
}

export function getEditorHTML(editor: Editor | null): string {
  return editor?.getHTML() ?? "";
}

export function focusEditor(editor: Editor | null) {
  editor?.commands.focus();
}

export { type Editor };
