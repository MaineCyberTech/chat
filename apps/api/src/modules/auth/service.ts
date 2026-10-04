import { getSupabase, getSupabaseAdmin } from "../../lib/supabase.js";
import { containsPattern } from "../../lib/postgrest-filter.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import type { User, UserProfile } from "@chat/db";

export class AuthService {
  async getUser(userId: string): Promise<User | null> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

    if (error) return null;
    return data as User;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseAdmin();
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
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, email, display_name, avatar_url")
      .single();

    if (error) return null;
    return data as UserProfile;
  }

  // Both directory methods take the caller's user-scoped Supabase client so the
  // `users_select` RLS policy (self + workspace co-members) constrains results.
  // Using the service-role client here leaked users across tenants (chat-SEC-002).
  async searchUsers(query: string, supabase: SupabaseClient): Promise<UserProfile[]> {
    const { data } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .ilike("display_name", containsPattern(query))
      .limit(20);

    return (data ?? []) as UserProfile[];
  }

  async getProfiles(userIds: string[], supabase: SupabaseClient): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    const { data } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    return (data ?? []) as UserProfile[];
  }

  /**
   * Sends a Supabase magic-link (email OTP) server-side.
   *
   * The endpoint previously only validated the address and always reported
   * success without sending anything. Delivery failures and unknown-account
   * errors are logged but never surfaced, so the route stays neutral and cannot
   * be used to enumerate accounts.
   */
  async sendMagicLink(email: string): Promise<void> {
    const env = loadEnv();
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      logger.warn("Magic link dispatch failed", { error: error.message });
    }
  }
}

export const authService = new AuthService();
