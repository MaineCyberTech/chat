/**
 * SDK Types - Single source of truth for API contracts
 */

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
  description?: string;
}

export interface WorkspaceMember {
  user_id: string;
  workspace_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

// Channel types
export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description?: string;
  type: "public" | "private";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelInput {
  name: string;
  slug: string;
  workspace_id: string;
  description?: string;
  is_private?: boolean;
}

export interface UpdateChannelInput {
  name?: string;
  slug?: string;
  description?: string;
}

export interface ChannelMember {
  user_id: string;
  channel_id: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface AddChannelMemberInput {
  user_id: string;
}

// Message types
export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateMessageInput {
  channel_id: string;
  content: string;
  parent_id?: string;
}

export interface UpdateMessageInput {
  content: string;
}

export interface SearchMessagesInput {
  workspace_id: string;
  q: string;
  limit?: number;
}

export interface ListMessagesResult {
  messages: Message[];
  nextCursor?: string;
}

// Webhook types
export interface WebhookEndpoint {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookInput {
  workspace_id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  secret?: string;
  events?: string[];
  is_active?: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status: string;
  request_body: Record<string, unknown>;
  response_status?: number;
  response_body?: string;
  error?: string;
  duration_ms: number;
  retry_count: number;
  dead_letter: boolean;
  created_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface ListNotificationsParams {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

// Preferences types
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  compactMode: boolean;
  language: string;
}

// Reaction types
export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface AddReactionInput {
  message_id: string;
  emoji: string;
}

// Feature flag types
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  targetingRules?: Record<string, unknown>;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}

// Error response (RFC 7807)
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Success response
export interface ApiResponse<T> {
  [key: string]: T | ApiError;
}

// Health check
export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  message?: string;
}

export interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, HealthCheck>;
}
