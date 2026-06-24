export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  message?: string;
}

export interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, HealthCheck>;
}

export class HealthService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  getReadiness(): HealthStatus {
    const checks: Record<string, HealthCheck> = {
      server: { status: "healthy" },
    };

    return {
      service: "api",
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version ?? "0.0.0",
      checks,
    };
  }

  async getFullHealth(): Promise<HealthStatus> {
    const checks: Record<string, HealthCheck> = {
      server: { status: "healthy" },
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
    }

    const hasUnhealthy = Object.values(checks).some((c) => c.status === "unhealthy");
    const hasDegraded = Object.values(checks).some((c) => c.status === "degraded");

    return {
      service: "api",
      status: hasUnhealthy ? "down" : hasDegraded ? "degraded" : "healthy",
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
