import { createDecipheriv, createHash, createHmac } from "node:crypto";
import { resolve4, resolve6 } from "node:dns/promises";
import type { IncomingHttpHeaders } from "node:http";
import { Agent as HttpsAgent, request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";

export const MAX_RETRIES = 5;
export const BASE_DELAY_MS = 60_000;

const WEBHOOK_ENCRYPTION_ALGORITHM = "aes-256-gcm";

function deriveWebhookEncryptionKey(encryptionKey: string): Buffer {
  return createHash("sha256").update(encryptionKey).digest();
}

/**
 * Decrypt a webhook signing secret produced by the API's `encryptSecret`
 * (`iv:authTag:ciphertext`, all hex, AES-256-GCM). Shared so the worker can
 * sign deliveries/retries with the real secret rather than the ciphertext.
 */
export function decryptWebhookSecret(encrypted: string, encryptionKey: string): string {
  const key = deriveWebhookEncryptionKey(encryptionKey);
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format");
  }
  const [ivHex, authTagHex, encryptedData] = parts;
  const decipher = createDecipheriv(WEBHOOK_ENCRYPTION_ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let plaintext = decipher.update(encryptedData, "hex", "utf8");
  plaintext += decipher.final("utf8");
  return plaintext;
}

export interface HostAddress {
  address: string;
  family: 4 | 6;
}

export interface PublicUrlValidation {
  valid: boolean;
  error?: string;
  addresses?: HostAddress[];
  /** Address the dispatcher must connect to, chosen from the validated set. */
  pinnedAddress?: HostAddress;
}

function parseIpv4(address: string): number[] | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => (/^\d+$/.test(part) ? Number(part) : Number.NaN));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets;
}

function normalizeIpLiteral(address: string): string {
  let normalized = address.trim();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.split("%")[0].toLowerCase();
}

function parseIpv6(address: string): number[] | null {
  let normalized = normalizeIpLiteral(address);
  if (!normalized.includes(":")) return null;

  if (normalized.includes(".")) {
    const lastColon = normalized.lastIndexOf(":");
    const ipv4Part = normalized.slice(lastColon + 1);
    const ipv4 = parseIpv4(ipv4Part);
    if (!ipv4) return null;
    const high = ((ipv4[0] << 8) | ipv4[1]).toString(16);
    const low = ((ipv4[2] << 8) | ipv4[3]).toString(16);
    normalized = `${normalized.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const pieces = normalized.split("::");
  if (pieces.length > 2) return null;

  const left = pieces[0] ? pieces[0].split(":") : [];
  const right = pieces.length === 2 && pieces[1] ? pieces[1].split(":") : [];
  if (pieces.length === 1 && left.length !== 8) return null;
  if (pieces.length === 2 && left.length + right.length > 7) return null;

  const missing = 8 - left.length - right.length;
  if (missing < 0) return null;

  const groups = [...left, ...Array<string>(missing).fill("0"), ...right];
  if (groups.length !== 8) return null;
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;

  return groups.map((group) => parseInt(group, 16));
}

function ipv4FromHextets(high: number, low: number): number[] {
  return [high >> 8, high & 0xff, low >> 8, low & 0xff];
}

function isPrivateIpv4(octets: number[]): boolean {
  const value = ((octets[0]! << 24) >>> 0) + (octets[1]! << 16) + (octets[2]! << 8) + octets[3]!;
  const ranges: Array<[number, number]> = [
    [0x00000000, 0x00ffffff], // 0.0.0.0/8 (includes 0.0.0.0)
    [0x0a000000, 0x0affffff], // 10.0.0.0/8
    [0x64400000, 0x647fffff], // 100.64.0.0/10 (CGNAT)
    [0x7f000000, 0x7fffffff], // 127.0.0.0/8
    [0xa9fe0000, 0xa9feffff], // 169.254.0.0/16 (link-local)
    [0xac100000, 0xac1fffff], // 172.16.0.0/12
    [0xc0000000, 0xc00000ff], // 192.0.0.0/24
    [0xc0000200, 0xc00002ff], // 192.0.2.0/24 (documentation)
    [0xc0586300, 0xc05863ff], // 192.88.99.0/24 (deprecated 6to4 relay)
    [0xc0a80000, 0xc0a8ffff], // 192.168.0.0/16
    [0xc6120000, 0xc613ffff], // 198.18.0.0/15 (benchmarking)
    [0xc6336400, 0xc63364ff], // 198.51.100.0/24 (documentation)
    [0xcb007100, 0xcb0071ff], // 203.0.113.0/24 (documentation)
    [0xe0000000, 0xefffffff], // 224.0.0.0/4 (multicast)
    [0xf0000000, 0xffffffff], // 240.0.0.0/4 (reserved, includes broadcast)
  ];
  return ranges.some(([start, end]) => value >= start && value <= end);
}

function isPrivateIpv6(groups: number[]): boolean {
  const first = groups[0]!;
  const allZeroExceptLast = groups.slice(0, 7).every((group) => group === 0);

  if (groups.every((group) => group === 0)) return true; // ::
  if (allZeroExceptLast && groups[7] === 1) return true; // ::1
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 (ULA, includes fd00::/8)
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 (link-local)
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 (multicast)
  if (first === 0x100 && groups.slice(1, 4).every((group) => group === 0)) return true; // 100::/64
  if (first === 0x2001 && groups[1] === 0x0000) return true; // 2001:0::/32 (Teredo)
  if (first === 0x2001 && groups[1] === 0x0db8) return true; // 2001:db8::/32 (documentation)
  if (first === 0x2001 && groups[1] === 0x0002 && groups[2] === 0x0000) return true; // 2001:2::/48

  // IPv4-mapped (::ffff:0:0/96), IPv4-translated (::ffff:0:0:0/96) and
  // IPv4-compatible (::/96) forms embed an IPv4 address in the final 32 bits.
  if (groups.slice(0, 5).every((group) => group === 0)) {
    const embedded = ipv4FromHextets(groups[6]!, groups[7]!);
    if (isPrivateIpv4(embedded)) return true;
  }
  if (groups.slice(0, 4).every((group) => group === 0) && groups[4] === 0xffff) {
    const embedded = ipv4FromHextets(groups[6]!, groups[7]!);
    if (isPrivateIpv4(embedded)) return true;
  }
  // NAT64 well-known prefix 64:ff9b::/96.
  if (
    first === 0x0064 &&
    groups[1] === 0xff9b &&
    groups.slice(2, 6).every((group) => group === 0)
  ) {
    const embedded = ipv4FromHextets(groups[6]!, groups[7]!);
    if (isPrivateIpv4(embedded)) return true;
  }
  // 6to4 2002::/16 embeds the IPv4 address in the next 32 bits.
  if (first === 0x2002) {
    const embedded = ipv4FromHextets(groups[1]!, groups[2]!);
    if (isPrivateIpv4(embedded)) return true;
  }

  return false;
}

/** True for loopback, private, link-local, CGNAT, ULA and other reserved IPs. */
export function isPrivateIp(address: string): boolean {
  const normalized = normalizeIpLiteral(address);
  const family = isIP(normalized);
  if (family === 4) {
    const octets = parseIpv4(normalized);
    return octets ? isPrivateIpv4(octets) : true;
  }
  if (family === 6) {
    const groups = parseIpv6(normalized);
    return groups ? isPrivateIpv6(groups) : true;
  }
  return false;
}

function uniqueAddresses(addresses: HostAddress[]): HostAddress[] {
  const seen = new Set<string>();
  return addresses.filter((entry) => {
    const key = `${entry.family}:${entry.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function resolveHostAddresses(url: string): Promise<HostAddress[]> {
  try {
    const hostname = normalizeIpLiteral(new URL(url).hostname);
    const literalFamily = isIP(hostname);
    if (literalFamily) {
      return [{ address: hostname, family: literalFamily as 4 | 6 }];
    }

    const [ipv4, ipv6] = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
    const addresses: HostAddress[] = [];
    if (ipv4.status === "fulfilled") {
      for (const address of ipv4.value) addresses.push({ address, family: 4 });
    }
    if (ipv6.status === "fulfilled") {
      for (const address of ipv6.value)
        addresses.push({ address: address.toLowerCase(), family: 6 });
    }
    return uniqueAddresses(addresses);
  } catch {
    return [];
  }
}

export async function resolveHostname(url: string): Promise<string[]> {
  return (await resolveHostAddresses(url)).map((entry) => entry.address);
}

/**
 * Validate an HTTPS URL and resolve both A and AAAA records. All addresses must
 * be public; the first validated address is returned for connection pinning so
 * a DNS answer cannot change between validation and dispatch.
 */
export async function validatePublicHttpsUrl(url: string): Promise<PublicUrlValidation> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs are allowed" };
    }
    if (parsed.username || parsed.password) {
      return { valid: false, error: "URLs cannot contain credentials" };
    }

    const hostname = normalizeIpLiteral(parsed.hostname);
    if (!hostname) return { valid: false, error: "URL host is required" };
    const hostForChecks = hostname.replace(/\.$/, "");
    if (
      hostForChecks === "localhost" ||
      hostForChecks.endsWith(".localhost") ||
      hostForChecks.endsWith(".local") ||
      hostForChecks.endsWith(".internal")
    ) {
      return { valid: false, error: "URLs cannot point to private/internal hosts" };
    }
    if (isIP(hostForChecks) && isPrivateIp(hostForChecks)) {
      return { valid: false, error: "URLs cannot point to private/internal IP addresses" };
    }

    const addresses = await resolveHostAddresses(url);
    if (addresses.length === 0) {
      return { valid: false, error: "URL host could not be resolved" };
    }
    for (const address of addresses) {
      if (isPrivateIp(address.address)) {
        return { valid: false, error: "URL resolves to a private/internal IP address" };
      }
    }

    return { valid: true, addresses, pinnedAddress: addresses[0] };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}

/** Backwards-compatible shape used by the webhook routes. */
export async function validateWebhookUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  const result = await validatePublicHttpsUrl(url);
  return { valid: result.valid, error: result.error };
}

/** Push services are HTTPS-only, but a stored endpoint may be attacker-controlled. */
export async function validatePushEndpointUrl(url: string): Promise<PublicUrlValidation> {
  return validatePublicHttpsUrl(url);
}

/** A DNS lookup override that always returns the pre-validated address. */
export function createPinnedLookup(pinned: HostAddress): LookupFunction {
  return ((hostname: string, options: unknown, callback?: unknown) => {
    const cb =
      typeof options === "function"
        ? (options as (error: Error | null, address: string, family: number) => void)
        : (callback as (error: Error | null, address: string, family: number) => void);
    const opts = typeof options === "function" ? {} : ((options ?? {}) as { all?: boolean });
    if (typeof cb !== "function") return;

    if (opts.all) {
      (cb as unknown as (error: Error | null, addresses: HostAddress[]) => void)(null, [pinned]);
      return;
    }
    cb(null, pinned.address, pinned.family);
  }) as unknown as LookupFunction;
}

export function createPinnedHttpsAgent(pinned: HostAddress): HttpsAgent {
  return new HttpsAgent({
    keepAlive: false,
    lookup: createPinnedLookup(pinned),
  });
}

export interface PinnedRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

export interface PinnedResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
  truncated: boolean;
}

/**
 * POST to an HTTPS URL using the validated/pinned address. Redirects are never
 * followed: a 3xx is returned to the caller as a non-2xx failure, so a redirect
 * cannot silently bypass the URL validation above.
 */
export async function postToPinnedHttpsUrl(
  url: string,
  options: PinnedRequestOptions,
): Promise<PinnedResponse> {
  const validation = await validatePublicHttpsUrl(url);
  if (!validation.valid || !validation.pinnedAddress) {
    throw new Error(validation.error ?? "Invalid URL");
  }

  const target = new URL(url);
  const hostname = normalizeIpLiteral(target.hostname);
  const pinned = validation.pinnedAddress;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxResponseBytes = options.maxResponseBytes ?? 1024 * 1024;

  return new Promise<PinnedResponse>((resolve, reject) => {
    const request = httpsRequest(
      {
        protocol: target.protocol,
        hostname,
        port: target.port ? Number(target.port) : 443,
        path: `${target.pathname}${target.search}`,
        method: options.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          "Content-Length": Buffer.byteLength(options.body),
        },
        lookup: createPinnedLookup(pinned),
        servername: isIP(hostname) ? undefined : hostname,
        timeout: timeoutMs,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        let truncated = false;

        response.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > maxResponseBytes) {
            truncated = true;
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            truncated,
          });
        });
        response.on("error", reject);
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Request timed out"));
    });
    request.on("error", reject);
    request.end(options.body);
  });
}

/**
 * Redirect policy for webhook dispatch. SEC-P2-002 / WH-P2-002: a validated
 * public URL must never be silently redirected to an unvalidated destination
 * (e.g. an internal/metadata address). With `redirect: "manual"` the runtime
 * returns the 3xx response instead of following it, and callers treat any
 * non-2xx as a delivery failure.
 */
export const WEBHOOK_REDIRECT_MODE = "manual" as const;

export function computeHmacSignature(
  secret: string,
  payload: Record<string, unknown>,
  event: string,
): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(JSON.stringify({ event, ...payload }));
  return `sha256=${hmac.digest("hex")}`;
}

export function buildWebhookPayload(event: string, payload: Record<string, unknown>): string {
  return JSON.stringify({ event, ...payload });
}
