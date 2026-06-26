import { z } from "zod";

// Upload security constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".pif",
  ".vbs",
  ".js",
  ".jar",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".py",
  ".rb",
  ".pl",
  ".sh",
  ".ps1",
  ".msi",
  ".dll",
  ".so",
  ".dylib",
  ".app",
  ".ipa",
  ".apk",
];

function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase());
}

function hasDangerousExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return DANGEROUS_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

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
  fileName: z
    .string()
    .min(1)
    .max(255)
    .refine((name) => !hasDangerousExtension(name), { message: "File type not allowed" }),
  contentType: z
    .string()
    .min(1)
    .max(100)
    .refine((type) => isAllowedContentType(type), { message: "Content type not allowed" }),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE).optional(),
});

export const uploadAvatarSchema = z.object({
  contentType: z
    .string()
    .min(1)
    .max(100)
    .refine((type) => type.startsWith("image/"), { message: "Avatar must be an image" }),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024)
    .optional(), // 2MB for avatars
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
