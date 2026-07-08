import { z } from "zod";

export const createSidebarCategorySchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export const updateSidebarCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const addSidebarAssignmentSchema = z.object({
  channel_id: z.string().uuid(),
});

export const reorderSidebarCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1),
});

export const reorderSidebarAssignmentsSchema = z.object({
  channelIds: z.array(z.string().uuid()).min(1),
});
