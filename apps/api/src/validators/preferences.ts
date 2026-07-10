import { z } from "zod";

export const updatePreferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  notification_prefs: z.record(z.unknown()).optional(),
  clock_format: z.string().optional(),
  message_display: z.string().optional(),
  sidebar_show_display_name: z.boolean().optional(),
  sidebar_sort_alphabetical: z.boolean().optional(),
});
