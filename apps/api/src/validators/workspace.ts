import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export const addWorkspaceMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});
