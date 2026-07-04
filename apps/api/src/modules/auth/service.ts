import { getSupabase } from "../../lib/supabase.js";
import type { User, UserProfile } from "@chat/db";

export class AuthService {
  async getUser(userId: string): Promise<User | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

    if (error) return null;
    return data as User;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name, avatar_url")
      .eq("id", userId)
      .single();

    if (error) return null;
    return data as UserProfile;
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<User, "display_name" | "avatar_url">>,
  ): Promise<UserProfile | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, email, display_name, avatar_url")
      .single();

    if (error) return null;
    return data as UserProfile;
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .or(`display_name.ilike.%${query}%`)
      .limit(20);

    return (data ?? []) as UserProfile[];
  }

  async getProfiles(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    const supabase = getSupabase();
    const { data } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    return (data ?? []) as UserProfile[];
  }
}

export const authService = new AuthService();
