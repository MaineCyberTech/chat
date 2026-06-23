import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createChannelSchema = z.object({
  name: z.string().min(1).max(80),
  topic: z.string().max(500).optional(),
  is_private: z.boolean().optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  topic: z.string().max(500).optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  parent_id: z.string().uuid().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
  workspace_id: z.string().uuid(),
});

export const batchProfilesSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
});

export const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
});

export const uploadAvatarSchema = z.object({
  contentType: z.string().min(1).max(100),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  notification_prefs: z.record(z.unknown()).optional(),
});

export const addWorkspaceMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});

export const addChannelMemberSchema = z.object({
  user_id: z.string().uuid(),
});
