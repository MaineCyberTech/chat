import { describe, it, expect } from "vitest";

const API_URL = process.env.API_URL || "http://localhost:4000";

describe("API Integration Tests", () => {
  it("health endpoint returns 200", async () => {
    const res = await fetch(`${API_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status");
  });

  it("healthz endpoint returns DB status", async () => {
    const res = await fetch(`${API_URL}/healthz`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks).toHaveProperty("database");
  });
});
