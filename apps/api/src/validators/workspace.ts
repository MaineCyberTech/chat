import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters").max(50, "Workspace name must be at most 50 characters"),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(3, "Workspace name must be at least 3 characters").max(50, "Workspace name must be at most 50 characters"),
});

export const addWorkspaceMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});
