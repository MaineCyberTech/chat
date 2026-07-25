import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must be at most 50 characters")
    .refine((v) => v.trim().length > 0, "Workspace name must not be empty"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")
    .min(1)
    .max(100)
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must be at most 50 characters")
    .refine((v) => v.trim().length > 0, "Workspace name must not be empty")
    .optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")
    .min(1)
    .max(100)
    .optional(),
});

export const addWorkspaceMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});
