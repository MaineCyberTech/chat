import { getSupabase } from "../../lib/supabase.js";
import type { UserPreferences, ThemePreference } from "@chat/db";

export class PreferencesService {
  async get(userId: string): Promise<UserPreferences | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return null;
    return data as UserPreferences | null;
  }

  async upsert(
    userId: string,
    prefs: { theme?: ThemePreference; notification_prefs?: Record<string, unknown> },
  ): Promise<UserPreferences | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error) return null;
    return data as UserPreferences;
  }
}

export const preferencesService = new PreferencesService();
