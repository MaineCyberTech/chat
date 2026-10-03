import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional(),
});

export const batchProfilesSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
});

export const updatePresenceStatusSchema = z.object({
  status: z.enum(["online", "away", "dnd"]).optional(),
  customStatus: z
    .string()
    .trim()
    .max(100, "Custom status must be 100 characters or fewer")
    .refine(
      (value) =>
        Array.from(value).every((char) => {
          const code = char.charCodeAt(0);
          return code >= 0x20 && code !== 0x7f;
        }),
      "Custom status contains invalid characters",
    )
    .nullish(),
});
