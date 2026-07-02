import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional(),
});

export const batchProfilesSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
});
