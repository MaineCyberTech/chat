import { describe, it, expect } from "vitest";
import { createClient, SDKClient } from "../src/client.js";

describe("SDKClient", () => {
  it("createClient returns an SDKClient instance", () => {
    const client = createClient({ baseUrl: "https://api.example.com" });
    expect(client).toBeInstanceOf(SDKClient);
  });

  it("has get, post, patch, and delete methods", () => {
    const client = createClient({ baseUrl: "https://api.example.com" });
    expect(typeof client.get).toBe("function");
    expect(typeof client.post).toBe("function");
    expect(typeof client.patch).toBe("function");
    expect(typeof client.delete).toBe("function");
  });

  it("strips trailing slash from baseUrl", () => {
    const client = createClient({ baseUrl: "https://api.example.com/" });
    expect(client).toBeInstanceOf(SDKClient);
  });

  it("uses default empty-string token when getAccessToken not provided", () => {
    const client = createClient({ baseUrl: "https://api.example.com" });
    expect(client).toBeInstanceOf(SDKClient);
  });

  it("accepts custom getAccessToken function", () => {
    const client = createClient({
      baseUrl: "https://api.example.com",
      getAccessToken: () => "custom-token",
    });
    expect(client).toBeInstanceOf(SDKClient);
  });
});
