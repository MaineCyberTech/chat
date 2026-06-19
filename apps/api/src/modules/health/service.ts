export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, { status: string; message?: string }>;
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

  getLiveness(): { status: string; timestamp: string } {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
