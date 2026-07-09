import { z } from "zod";

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createChannelSchema = z.object({
  name: z.string().min(1).max(80),
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
  name: z.string().min(1).max(80).optional(),
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
