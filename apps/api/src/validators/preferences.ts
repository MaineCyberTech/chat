import { z } from "zod";

export const updatePreferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  notification_prefs: z.record(z.unknown()).optional(),
});
