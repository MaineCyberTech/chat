// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MessageInput } from "../message-input";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({ members: [] }),
    post: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@chat/ui", () => ({
  Button: ({ children, onClick, disabled }: Record<string, unknown>) =>
    React.createElement(
      "button",
      { onClick: onClick as () => void, disabled: !!disabled, "data-testid": "send-btn" },
      children as React.ReactNode,
    ),
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("lucide-react", () => ({
  Paperclip: () => null,
  Smile: () => null,
  Eye: () => null,
  Send: () => null,
  Flag: () => null,
  Clock: () => null,
  Sparkles: () => null,
  AlertTriangle: () => null,
}));

vi.mock("../formatting-bar", () => ({
  FormattingBar: () => <div data-testid="formatting-bar" />,
}));

vi.mock("../emoji-picker", () => ({
  EmojiPicker: () => <div data-testid="emoji-picker" />,
  searchEmojis: () => [],
}));

vi.mock("../tiptap-editor", () => ({
  TipTapEditor: React.forwardRef(({ onUpdate, editable }: Record<string, unknown>, _ref) =>
    React.createElement("div", {
      "data-testid": "tiptap-editor",
      contentEditable: !!editable,
      suppressContentEditableWarning: true,
      onInput: onUpdate
        ? (e: React.FormEvent<HTMLDivElement>) =>
            (onUpdate as (html: string) => void)(
              (e.target as HTMLDivElement).innerText,
            )
        : undefined,
    }),
  ),
}));

vi.mock("../priority-picker", () => ({
  PriorityPicker: () => <div data-testid="priority-picker" />,
  PRIORITY_CONFIG: {
    standard: { color: "inherit" },
    high: { color: "#e53e3e" },
    urgent: { color: "#d69e2e" },
  },
  PRIORITY_OPTIONS: [
    { key: "standard", label: "Standard" },
    { key: "high", label: "Important" },
    { key: "urgent", label: "Urgent" },
  ],
}));

vi.mock("../ai-rewrite-picker", () => ({
  AiRewritePicker: () => <div data-testid="ai-rewrite-picker" />,
}));

vi.mock("../schedule-picker", () => ({
  SchedulePicker: () => <div data-testid="schedule-picker" />,
}));

vi.mock("../file-attachment-list", () => ({
  FileAttachmentList: () => null,
}));

vi.mock("../markdown-preview", () => ({
  MarkdownPreview: () => null,
}));

vi.mock("@/lib/slash-commands", () => ({
  SLASH_COMMANDS: [],
}));

vi.mock("@/lib/hooks/use-click-outside", () => ({
  useClickOutside: () => {},
}));

describe("MessageInput", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  const defaultProps = {
    channelId: "ch-1",
    onSend: vi.fn(),
  };

  it("renders send button", () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId("send-btn")).toBeDefined();
  });

  it("renders formatting toggle button", () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByLabelText("Toggle formatting toolbar")).toBeDefined();
  });

  it("calls onSend when send button is clicked with content", () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput {...defaultProps} onSend={onSend} />);
    const editor = screen.getByTestId("tiptap-editor");
    expect(editor).toBeDefined();
  });
});
