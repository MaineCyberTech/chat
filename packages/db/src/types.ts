export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  topic: string | null;
  is_private: boolean;
  channel_type: "public" | "private" | "dm" | "group";
  sort_order: number;
  created_by: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const CHANNEL_TYPE = {
  PUBLIC: "public",
  PRIVATE: "private",
  DM: "dm",
  GROUP: "group",
} as const;

export interface ChannelMember {
  channel_id: string;
  user_id: string;
  joined_at: string;
}

export type PostPriority = "standard" | "important" | "urgent" | "critical";

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_pinned: boolean;
  priority: PostPriority;
  edited_at: string | null;
  deleted_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface MessageFlag {
  id: string;
  user_id: string;
  message_id: string;
  created_at: string;
}

export interface MessageEditHistory {
  id: string;
  message_id: string;
  previous_content: string;
  edited_by: string;
  edited_at: string;
}

export type ThemePreference = "system" | "light" | "dark";

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}

export interface UserPreferences {
  user_id: string;
  theme: ThemePreference;
  notification_prefs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  actor_type: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  workspace_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status: string;
  request_body: Record<string, unknown> | null;
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  duration_ms: number | null;
  retry_count: number;
  next_retry_at: string | null;
  dead_letter: boolean;
  created_at: string;
}

export interface WebhookDeadLetter {
  id: string;
  webhook_id: string;
  event: string;
  request_body: Record<string, unknown>;
  last_error: string | null;
  attempt_count: number;
  created_at: string;
  last_attempt_at: string | null;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  target_roles: string[];
  target_user_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ConsentLog {
  id: string;
  user_id: string;
  consent_type: string;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SidebarCategory {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  sort_order: number;
  is_collapsible: boolean;
  created_at: string;
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  channel_id: string;
  content: string;
  scheduled_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface SidebarChannelAssignment {
  id: string;
  category_id: string;
  channel_id: string;
  sort_order: number;
  created_at: string;
}

export interface UserGroup {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface UserGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}
