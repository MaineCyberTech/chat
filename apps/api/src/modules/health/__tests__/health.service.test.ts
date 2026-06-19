import { describe, it, expect, beforeEach } from "vitest";
import { HealthService } from "../service.js";

describe("HealthService", () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  describe("getReadiness", () => {
    it("returns status ok", () => {
      const result = service.getReadiness();
      expect(result.status).toBe("ok");
    });

    it("includes server check", () => {
      const result = service.getReadiness();
      expect(result.checks.server).toBeDefined();
      expect(result.checks.server.status).toBe("ok");
    });

    it("includes timestamp and uptime", () => {
      const result = service.getReadiness();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe("number");
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getLiveness", () => {
    it("returns alive status", () => {
      const result = service.getLiveness();
      expect(result.status).toBe("alive");
    });

    it("includes timestamp", () => {
      const result = service.getLiveness();
      expect(result.timestamp).toBeDefined();
    });
  });
});
