export { createSupabaseClient, getSupabaseClient } from "./config.js";
export type { User, UserProfile } from "./types.js";
export type { Workspace, WorkspaceMember, WorkspaceRole } from "./types.js";
export type { Channel, ChannelMember, MessageRead } from "./types.js";
export type { Message, MessageFlag, MessageEditHistory, PostPriority } from "./types.js";
export type { UserPreferences, ThemePreference } from "./types.js";
export type { PushSubscription, PushSubscriptionInput } from "./types.js";
export type { WebhookEndpoint, WebhookDelivery, WebhookDeadLetter } from "./types.js";
export type { FeatureFlag } from "./types.js";
export type { ConsentLog } from "./types.js";
export type { SidebarCategory, SidebarChannelAssignment } from "./types.js";
export type { ScheduledPost } from "./types.js";
export type { UserGroup, UserGroupMember } from "./types.js";

export { hasPermission, getPermissionsForRole, getAllPermissions } from "./permissions.js";
export type { Permission } from "./permissions.js";

export { SupabaseMessageStore, messageStore } from "./stores/message-store.js";
export type {
  IMessageStore,
  CreateMessageInput,
  ListByChannelOptions,
  ListByChannelResult,
} from "./stores/message-store.js";

export { SupabaseChannelStore, channelStore } from "./stores/channel-store.js";
export type { IChannelStore, CreateChannelInput } from "./stores/channel-store.js";

export { SupabaseReadReceiptStore, readReceiptStore } from "./stores/read-receipt-store.js";
export type {
  IReadReceiptStore,
  UnreadCount,
  MessageReaders,
} from "./stores/read-receipt-store.js";
