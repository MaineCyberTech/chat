/**
 * Chat SDK - Type-safe API client for the Chat Platform
 */

export { SDKClient, createClient } from "./client.js";
export type { SDKConfig } from "./client.js";

export { WorkspacesClient } from "./workspaces.js";
export { ChannelsClient } from "./channels.js";
export { MessagesClient } from "./messages.js";
export { WebhooksClient } from "./webhooks.js";
export { NotificationsClient } from "./notifications.js";
export { PreferencesClient } from "./preferences.js";
export { ReactionsClient } from "./reactions.js";

export type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceMember,
  Channel,
  CreateChannelInput,
  UpdateChannelInput,
  ChannelMember,
  AddChannelMemberInput,
  Message,
  CreateMessageInput,
  UpdateMessageInput,
  SearchMessagesInput,
  ListMessagesResult,
  WebhookEndpoint,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  Notification,
  ListNotificationsParams,
  UserPreferences,
  Reaction,
  AddReactionInput,
  FeatureFlag,
  PaginatedResponse,
  CursorPaginatedResponse,
  ApiError,
  ApiResponse,
  HealthCheck,
  HealthStatus,
} from "./types.js";
