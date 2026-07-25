import { z } from "zod";

const postPriorityEnum = z.enum(["standard", "important", "urgent", "critical"]);

export const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content must not be empty")
    .max(4000, "Message content must be at most 4000 characters")
    .refine((v) => v.trim().length > 0, "Message content must not be whitespace-only"),
  parent_id: z.string().uuid().optional(),
  priority: postPriorityEnum.default("standard"),
});

export const updateMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content must not be empty")
    .max(4000, "Message content must be at most 4000 characters")
    .refine((v) => v.trim().length > 0, "Message content must not be whitespace-only"),
  version: z.number().int().positive().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
  workspace_id: z.string().uuid(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  author_id: z.string().uuid().optional(),
  channel_ids: z.string().optional(),
  type: z.enum(["messages", "files"]).optional().default("messages"),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
