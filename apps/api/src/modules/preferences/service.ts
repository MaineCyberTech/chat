import { getSupabase } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";
import type { UserPreferences } from "@chat/db";

const DB_COLUMNS = new Set([
  "theme",
  "notification_prefs",
  "clock_format",
  "message_display",
  "sidebar_show_display_name",
  "sidebar_sort_alphabetical",
]);

export class PreferencesService {
  async get(userId: string): Promise<UserPreferences | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to get preferences", { error: String(error), userId });
      return null;
    }
    return data as UserPreferences | null;
  }

  async upsert(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences | null> {
    const supabase = getSupabase();
    const dbColumns: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    for (const [key, value] of Object.entries(prefs)) {
      if (value !== undefined && DB_COLUMNS.has(key)) {
        dbColumns[key] = value;
      }
    }
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(dbColumns, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      logger.error("Failed to upsert preferences", { error: String(error), userId });
      return null;
    }
    return data as UserPreferences;
  }
}

export const preferencesService = new PreferencesService();
