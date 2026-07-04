import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  parent_id: z.string().uuid().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  version: z.number().int().positive().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
  workspace_id: z.string().uuid(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  author_id: z.string().uuid().optional(),
  channel_ids: z.string().optional(),
  offset: z.coerce.number().int().min(0).default(0),
});
