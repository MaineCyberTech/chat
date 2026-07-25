import { z } from "zod";

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Channel name must not be empty")
    .max(80, "Channel name must be at most 80 characters")
    .refine((v) => v.trim().length > 0, "Channel name must not be whitespace-only"),
  slug: z
    .string()
    .regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens only")
    .min(1)
    .max(100)
    .optional(),
  topic: z.string().max(500).optional(),
  is_private: z.boolean().optional(),
  is_read_only: z.boolean().optional(),
});

export const updateChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Channel name must not be empty")
    .max(80, "Channel name must be at most 80 characters")
    .refine((v) => v.trim().length > 0, "Channel name must not be whitespace-only")
    .optional(),
  slug: z
    .string()
    .regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens only")
    .min(1)
    .max(100)
    .optional(),
  topic: z.string().max(500).optional(),
  version: z.number().int().positive().optional(),
});

export const addChannelMemberSchema = z.object({
  user_id: z.string().uuid(),
});
