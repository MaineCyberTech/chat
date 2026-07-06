import { useRef } from "react";
import { MessageContextMenu, type ContextMenuState } from "./context-menu";
import { ToastProvider } from "@chat/ui";

const sampleMessage = {
  id: "msg-1",
  channel_id: "ch-1",
  user_id: "user-1",
  content: "Sample message content for context menu",
  parent_id: null,
  is_pinned: false,
  priority: "standard" as const,
  edited_at: null,
  deleted_at: null,
  archived_at: null,
  created_at: new Date().toISOString(),
};

function createContextMenuState(overrides?: Partial<ContextMenuState>): ContextMenuState {
  return {
    x: 100,
    y: 100,
    message: sampleMessage,
    ...overrides,
  };
}

export default {
  title: "Chat/ContextMenu",
  component: MessageContextMenu,
  decorators: [
    (Story: React.FC) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export const Basic = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    return (
      <MessageContextMenu
        contextMenu={createContextMenuState()}
        currentUserId="user-2"
        menuRef={ref}
        onReply={() => {}}
        onClose={() => {}}
        onStartEdit={() => {}}
        onSetDeleteConfirmId={() => {}}
        onSetRemindMessageId={() => {}}
      />
    );
  },
};

export const OwnMessage = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    return (
      <MessageContextMenu
        contextMenu={createContextMenuState({ message: { ...sampleMessage, user_id: "user-1" } })}
        currentUserId="user-1"
        menuRef={ref}
        onReply={() => {}}
        onEdit={async () => {}}
        onDelete={async () => {}}
        onClose={() => {}}
        onStartEdit={() => {}}
        onSetDeleteConfirmId={() => {}}
        onSetRemindMessageId={() => {}}
      />
    );
  },
};
