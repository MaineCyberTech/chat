import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:dns/promises", () => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

import { resolve4, resolve6 } from "node:dns/promises";
import {
  createPinnedLookup,
  isPrivateIp,
  validatePublicHttpsUrl,
  validateWebhookUrl,
} from "../webhook-utils.js";

const resolve4Mock = vi.mocked(resolve4);
const resolve6Mock = vi.mocked(resolve6);

describe("IP classification", () => {
  it.each([
    "0.0.0.0",
    "0.255.255.255",
    "10.1.2.3",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:0:127.0.0.1",
    "64:ff9b::7f00:1",
    "2002:7f00:1::",
    "2001:db8::1",
  ])("treats %s as private/reserved", (address) => {
    expect(isPrivateIp(address)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700:4700::1111", "2001:4860:4860::8888"])(
    "treats %s as public",
    (address) => {
      expect(isPrivateIp(address)).toBe(false);
    },
  );
});

describe("public HTTPS URL validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolve4Mock.mockResolvedValue(["93.184.216.34"]);
    resolve6Mock.mockRejectedValue(Object.assign(new Error("no AAAA"), { code: "ENODATA" }));
  });

  it("accepts a public HTTPS URL and returns the pinned address", async () => {
    const result = await validatePublicHttpsUrl("https://example.com/hook");

    expect(result.valid).toBe(true);
    expect(result.pinnedAddress).toEqual({ address: "93.184.216.34", family: 4 });
  });

  it("rejects 0.0.0.0, IPv4-mapped IPv6, ULA and link-local literals", async () => {
    await expect(validateWebhookUrl("https://0.0.0.0/hook")).resolves.toMatchObject({
      valid: false,
    });
    await expect(validateWebhookUrl("https://[::ffff:127.0.0.1]/hook")).resolves.toMatchObject({
      valid: false,
    });
    await expect(validateWebhookUrl("https://[fd12::1]/hook")).resolves.toMatchObject({
      valid: false,
    });
    await expect(validateWebhookUrl("https://[fe80::1]/hook")).resolves.toMatchObject({
      valid: false,
    });
  });

  it("rejects a public A record when any AAAA record is private", async () => {
    resolve4Mock.mockResolvedValue(["93.184.216.34"]);
    resolve6Mock.mockResolvedValue(["fd00::1"]);

    const result = await validateWebhookUrl("https://mixed.example/hook");

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/private\/internal IP/);
  });

  it("accepts an AAAA-only host after resolving IPv6", async () => {
    resolve4Mock.mockRejectedValue(Object.assign(new Error("no A"), { code: "ENODATA" }));
    resolve6Mock.mockResolvedValue(["2606:4700:4700::1111"]);

    const result = await validatePublicHttpsUrl("https://ipv6-only.example/hook");

    expect(result.valid).toBe(true);
    expect(result.pinnedAddress).toEqual({ address: "2606:4700:4700::1111", family: 6 });
  });

  it("fails closed when the host cannot be resolved", async () => {
    resolve4Mock.mockRejectedValue(Object.assign(new Error("nxdomain"), { code: "ENOTFOUND" }));
    resolve6Mock.mockRejectedValue(Object.assign(new Error("nxdomain"), { code: "ENOTFOUND" }));

    const result = await validateWebhookUrl("https://does-not-exist.example/hook");

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/could not be resolved/);
  });

  it("rejects non-HTTPS URLs, credentials and private hostnames", async () => {
    await expect(validateWebhookUrl("http://example.com/hook")).resolves.toMatchObject({
      valid: false,
    });
    await expect(validateWebhookUrl("https://user:pass@example.com/hook")).resolves.toMatchObject({
      valid: false,
    });
    await expect(validateWebhookUrl("https://localhost/hook")).resolves.toMatchObject({
      valid: false,
    });
    await expect(validateWebhookUrl("https://service.internal/hook")).resolves.toMatchObject({
      valid: false,
    });
  });
});

describe("pinned lookup", () => {
  it("always returns the address validated before dispatch (DNS rebinding defence)", async () => {
    resolve4Mock.mockResolvedValueOnce(["93.184.216.34"]);
    const validation = await validatePublicHttpsUrl("https://rebind.example/hook");
    expect(validation.pinnedAddress?.address).toBe("93.184.216.34");

    // The attacker changes DNS after validation; the pinned lookup must not re-resolve.
    resolve4Mock.mockResolvedValue(["127.0.0.1"]);

    const lookup = createPinnedLookup(validation.pinnedAddress!);
    const callback = vi.fn();
    (lookup as unknown as (host: string, options: object, cb: unknown) => void)(
      "rebind.example",
      {},
      callback,
    );

    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
    expect(resolve4Mock).toHaveBeenCalledTimes(1);
  });
});
