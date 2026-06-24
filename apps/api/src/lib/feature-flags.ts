import { getSupabaseAdmin } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetRoles?: string[];
  targetUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FeatureFlagEvaluation {
  key: string;
  enabled: boolean;
  reason: string;
}

class FeatureFlagService {
  private cache = new Map<string, FeatureFlag>();
  private cacheExpiry = 0;
  private readonly CACHE_TTL_MS = 60_000; // 1 minute

  async getAllFlags(): Promise<FeatureFlag[]> {
    if (Date.now() < this.cacheExpiry && this.cache.size > 0) {
      return Array.from(this.cache.values());
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("feature_flags").select("*").order("key");

    if (error) {
      logger.error("Failed to fetch feature flags", { error });
      return Array.from(this.cache.values());
    }

    this.cache.clear();
    for (const flag of data as FeatureFlag[]) {
      this.cache.set(flag.key, flag);
    }
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

    return data as FeatureFlag[];
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    const flags = await this.getAllFlags();
    return flags.find((f) => f.key === key) ?? null;
  }

  async evaluateFlag(
    key: string,
    context: {
      userId?: string;
      userRole?: string;
    },
  ): Promise<FeatureFlagEvaluation> {
    const flag = await this.getFlag(key);

    if (!flag) {
      return { key, enabled: false, reason: "flag_not_found" };
    }

    if (!flag.enabled) {
      return { key, enabled: false, reason: "flag_disabled" };
    }

    // Check role targeting
    if (flag.targetRoles && flag.targetRoles.length > 0 && context.userRole) {
      if (!flag.targetRoles.includes(context.userRole)) {
        return { key, enabled: false, reason: "role_not_targeted" };
      }
    }

    // Check user ID targeting
    if (flag.targetUserIds && flag.targetUserIds.length > 0 && context.userId) {
      if (!flag.targetUserIds.includes(context.userId)) {
        return { key, enabled: false, reason: "user_not_targeted" };
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100 && context.userId) {
      const hash = this.hashUserId(key, context.userId);
      if (hash >= flag.rolloutPercentage) {
        return { key, enabled: false, reason: "rollout_excluded" };
      }
    }

    return { key, enabled: true, reason: "matched" };
  }

  private hashUserId(flagKey: string, userId: string): number {
    // Simple deterministic hash for consistent rollout
    let hash = 0;
    const str = flagKey + userId;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  async createFlag(
    input: Omit<FeatureFlag, "createdAt" | "updatedAt">,
  ): Promise<FeatureFlag | null> {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("feature_flags")
      .insert({ ...input, createdAt: now, updatedAt: now })
      .select("*")
      .single();

    if (error) {
      logger.error("Failed to create feature flag", { error });
      return null;
    }

    this.invalidateCache();
    return data as FeatureFlag;
  }

  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("feature_flags")
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq("key", key)
      .select("*")
      .single();

    if (error) {
      logger.error("Failed to update feature flag", { key, error });
      return null;
    }

    this.invalidateCache();
    return data as FeatureFlag;
  }

  async deleteFlag(key: string): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("feature_flags").delete().eq("key", key);

    if (error) {
      logger.error("Failed to delete feature flag", { key, error });
      return false;
    }

    this.invalidateCache();
    return true;
  }

  private invalidateCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
  }
}

export const featureFlagService = new FeatureFlagService();
