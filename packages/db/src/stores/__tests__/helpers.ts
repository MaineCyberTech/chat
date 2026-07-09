import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Channel,
  ChannelMember,
  Message,
  Notification,
  Reaction,
  Workspace,
} from "../../types.js";

export function createMockSupabase(): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        in: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        is: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

export function createSuccessSupabase<T>(returnValue: T): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: returnValue, error: null }),
          order: () => Promise.resolve({ data: returnValue, error: null }),
          is: () => ({
            order: () => Promise.resolve({ data: [returnValue], error: null }),
          }),
        }),
        in: () => ({
          order: () => Promise.resolve({ data: returnValue, error: null }),
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [returnValue], error: null }),
        }),
        is: () => ({
          order: () => Promise.resolve({ data: [returnValue], error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: returnValue, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: returnValue, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: returnValue, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

export const mockChannel: Channel = {
  id: "channel-1",
  workspace_id: "workspace-1",
  name: "general",
  slug: "general",
  topic: "General discussion",
  is_private: false,
  channel_type: "public",
  sort_order: 0,
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
};

export const mockChannelMember: ChannelMember = {
  channel_id: "channel-1",
  user_id: "user-1",
  joined_at: "2026-01-01T00:00:00Z",
};

export const mockMessage: Message = {
  id: "msg-1",
  channel_id: "channel-1",
  user_id: "user-1",
  content: "Hello world",
  created_at: "2026-01-01T00:00:00Z",
  edited_at: null,
  deleted_at: null,
  archived_at: null,
  parent_id: null,
  is_pinned: false,
  priority: "standard",
};

export const mockWorkspace: Workspace = {
  id: "workspace-1",
  name: "Test Workspace",
  slug: "test-workspace",
  owner_id: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
};

export const mockReaction: Reaction = {
  id: "reaction-1",
  message_id: "msg-1",
  user_id: "user-1",
  emoji: "👍",
  created_at: "2026-01-01T00:00:00Z",
};

export const mockNotification: Notification = {
  id: "notif-1",
  user_id: "user-1",
  workspace_id: "workspace-1",
  type: "mention",
  title: "New mention",
  body: "You were mentioned",
  link: null,
  read: false,
  created_at: "2026-01-01T00:00:00Z",
};
