import { MessageItem, type MessageMeta } from "./message-item";

const sampleMessage: MessageMeta = {
  id: "msg-1",
  channel_id: "ch-1",
  user_id: "user-1",
  content: "Hello, this is a sample message with **markdown**!",
  parent_id: null,
  is_pinned: false,
  priority: "standard",
  edited_at: null,
  deleted_at: null,
  archived_at: null,
  created_at: new Date().toISOString(),
};

const emptyProfiles = new Map();

export default {
  title: "Chat/MessageItem",
  component: MessageItem,
};

export const Basic = {
  args: {
    msg: sampleMessage,
    currentUserId: "user-2",
    profiles: emptyProfiles,
    editingId: null,
    editContent: "",
    reactions: new Map(),
    pickerMessageId: null,
    editError: "",
    onStartEdit: () => {},
    onSubmitEdit: async () => {},
    onCancelEdit: () => {},
    onSetEditContent: () => {},
    onToggleReaction: async () => {},
    onSetPickerMessageId: () => {},
    onSetDeleteConfirmId: () => {},
    onMessageContextMenu: () => {},
    onMessageTouchStart: () => {},
    onMessageTouchEnd: () => {},
    onMessageTouchMove: () => {},
  },
};

export const OwnMessage = {
  args: {
    ...Basic.args,
    currentUserId: "user-1",
    onReply: () => {},
    onEdit: async () => {},
    onDelete: async () => {},
  },
};

export const WithReactions = {
  args: {
    ...Basic.args,
    reactions: new Map([
      [
        "msg-1",
        [
          { id: "r1", message_id: "msg-1", user_id: "user-1", emoji: "\u{1F44D}" },
          { id: "r2", message_id: "msg-1", user_id: "user-2", emoji: "\u{1F44D}" },
          { id: "r3", message_id: "msg-1", user_id: "user-3", emoji: "\u{1F389}" },
        ],
      ],
    ]),
  },
};

export const WithThread = {
  args: {
    ...Basic.args,
    msg: { ...sampleMessage, content: "This has thread replies" },
    onThreadOpen: () => {},
    replyCounts: new Map([["msg-1", 3]]),
  },
};

export const WithDateSeparator = {
  args: {
    ...Basic.args,
    msg: { ...sampleMessage, showDate: true },
  },
};

export const Editing = {
  args: {
    ...Basic.args,
    editingId: "msg-1",
    editContent: "Editing this message...",
    currentUserId: "user-1",
  },
};
