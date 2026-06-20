export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, { status: string; message?: string; latencyMs?: number }>;
}

export class HealthService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  getReadiness(): HealthStatus {
    const checks: Record<string, { status: string; message?: string }> = {
      server: { status: "ok" },
    };

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version ?? "0.0.0",
      checks,
    };
  }

  async getFullHealth(): Promise<HealthStatus> {
    const checks: Record<string, { status: string; message?: string; latencyMs?: number }> = {
      server: { status: "ok" },
    };

    try {
      const { getSupabaseAdmin } = await import("../../lib/supabase.js");
      const dbStart = Date.now();
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("workspaces")
        .select("id", { count: "exact", head: true });
      checks.database = {
        status: error ? "unhealthy" : "healthy",
        latencyMs: Date.now() - dbStart,
        message: error?.message,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      checks.database = { status: "unhealthy", message: msg };
      return {
        status: "degraded",
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: process.env.npm_package_version ?? "0.0.0",
        checks,
      };
    }

    const allHealthy = Object.values(checks).every(
      (c) => c.status === "healthy" || c.status === "ok",
    );

    return {
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version ?? "0.0.0",
      checks,
    };
  }

  getLiveness(): { status: string; timestamp: string } {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
